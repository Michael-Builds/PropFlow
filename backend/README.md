# PropFlow API

NestJS 11 service for PropFlow. It is org-scoped, JWT-authenticated, and sits in front of Neon Postgres, Redis, BullMQ, and S3/CloudFront.

Product rules and the intended REST contract live in [`../docs/PropFlow_PRD_v1.1.txt`](../docs/PropFlow_PRD_v1.1.txt). Currency in product examples is **GHS**.

## Stack

| Piece | Choice |
| --- | --- |
| Runtime | NestJS 11, Express |
| Language | TypeScript 6 (this package only) |
| Database | Prisma 7 + Neon Postgres (`@prisma/adapter-pg`) |
| Auth | Passport JWT, bcrypt, access + refresh tokens |
| Cache / queues | Redis (ioredis) + BullMQ |
| Rate limits | `@nestjs/throttler` + `@nest-lab/throttler-storage-redis` |
| Files | AWS S3 presigned PUTs, optional CloudFront domain |
| HTTP | Helmet, compression, global validation pipe, Swagger |
| Logs | `AppLogger` (`error` / `warning` / `success` / `info`; `debug` off in production) |

## Layout

```
backend/
├── prisma/schema.prisma      Data model
├── src/
│   ├── main.ts               Bootstrap, versioning, Swagger
│   ├── app.module.ts         Root module, global guard/filter/interceptors
│   ├── config/env.schema.ts  Joi env validation
│   ├── prisma/               Prisma client wrapper
│   ├── common/               Logger, Redis, throttler, interceptors, filters
│   ├── auth/                 Login + JWT strategy
│   ├── users/
│   ├── properties/ units/ tenants/ leases/
│   ├── invoices/ payments/
│   ├── tickets/ documents/ dashboard/
│   ├── notifications/ audit-logs/
│   ├── jobs/                 BullMQ notifications queue
│   ├── storage/              S3 upload URLs
│   └── generated/prisma/     Prisma client output (do not edit)
└── .env.example
```

Prisma client is generated into `src/generated/prisma` (`moduleFormat: cjs`). `npm install` runs `prisma generate` via `postinstall`.

## Run locally

Needs Node 22+, npm, Docker (Redis), and a Postgres URL.

```bash
cp .env.example .env
# fill DATABASE_URL, JWT secrets, Redis, AWS keys

docker run --name propflow-redis -p 6379:6379 -d redis:7

npm install
npm run prisma:generate
npm run prisma:migrate:dev
npm run start:dev
```

| URL | Purpose |
| --- | --- |
| `http://localhost:3000/api/v1` | Versioned API |
| `GET /api/v1/health` | Liveness (`{ status: "ok", service: "propflow-api" }`) |
| `http://localhost:3000/docs` | Swagger UI |

Scripts:

| Command | Purpose |
| --- | --- |
| `npm run start` | Compile once and listen |
| `npm run start:dev` | Watch mode |
| `npm run start:prod` | `node dist/main` |
| `npm run build` | `nest build` |
| `npm run prisma:migrate:dev` | Dev migrations |
| `npm run prisma:migrate:deploy` | Deploy migrations |
| `npm run prisma:studio` | Prisma Studio |
| `npm test` / `npm run test:e2e` | Jest unit / e2e |

## Environment

Validated in `src/config/env.schema.ts`. Copy `.env.example` and set at least:

| Variable | Notes |
| --- | --- |
| `DATABASE_URL` | Neon Postgres connection string |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | Required |
| `JWT_ACCESS_TTL` | Seconds, default `3600` |
| `JWT_REFRESH_TTL` | Seconds, default `1209600` (14 days) |
| `REDIS_HOST` / `REDIS_PORT` | Required. Username/password optional (local Redis has none) |
| `REDIS_DB` | Default `0` |
| `PORT` | Default `3000` |
| `API_PREFIX` | Default `api` |
| `API_VERSION` | Default `1` (URI versioning) |
| `AWS_REGION` / `AWS_S3_BUCKET` / keys | Required even if you are not uploading yet |
| `AWS_S3_ENDPOINT` / `AWS_S3_FORCE_PATH_STYLE` | Optional (MinIO / path-style) |
| `AWS_CLOUDFRONT_DOMAIN` | Optional public file host |
| `AUDIT_LOG_ENABLED` | Default `true` |

Throttle windows (overridable):

| Name | Default |
| --- | --- |
| short | 30 requests / 10s |
| medium | 120 / 60s |
| long | 1000 / hour |

Login is tighter (see below). Health and Swagger skip throttling.

## Bootstrap behaviour

`src/main.ts`:

- `trust proxy` so `X-Forwarded-For` is trusted
- Helmet + compression + CORS
- Global prefix + URI versioning → `/api/v1/...`
- `ValidationPipe`: `transform`, `whitelist`, `forbidNonWhitelisted`
- Bearer auth in Swagger
- Prisma shutdown hooks
- Coloured bootstrap logs with listen URL and `/docs`

## Cross-cutting

**Auth.** `POST /auth/login` takes `{ email, password }`. Looks up the user, `bcrypt.compare` on `passwordHash`, then signs access and refresh JWTs with claims `sub`, `orgId`, `role`, `email`. Failed logins return `401 Invalid credentials` (same message whether the user is missing or the password is wrong). Login throttle: 5 / 10s (block 60s), 8 / min (block 5 min), 20 / hour (block 1 hour). Tracker is `userId:IP` (`anon` before auth).

**Org scope.** Every domain table has `orgId`. Queries must stay inside the org from the token. Several list methods still take a placeholder `'org_demo'` until JWT is wired through every controller.

**Throttler.** Redis-backed. Tracker `userId:IP` including `X-Forwarded-For`. Skips `/health`, `/docs`, `/swagger`.

**Logging.** `AppLogger` implements Nest `LoggerService`. HTTP interceptor logs method, path, status, duration. Exceptions go through `AllExceptionsFilter`.

**Audit.** `AuditLogInterceptor` writes privileged actions when `AUDIT_LOG_ENABLED` is true. Model: actor, action, entity, before/after JSON, IP.

**Jobs.** BullMQ queue `notifications`. `JobsService` + `NotificationsProcessor` for queued/sent notification work.

**Storage.** `StorageService.createUploadUrl` returns a presigned PUT. Documents module records vault metadata after upload.

## Data model (Prisma)

Enums: `UserRole` (`owner` | `manager` | `finance` | `vendor` | `tenant`), `EntityType` (`property` | `unit` | `tenant` | `lease`).

| Model | Role |
| --- | --- |
| `Organization` | Tenant boundary |
| `User` | Login, role, `passwordHash` |
| `Property` / `Unit` | Portfolio. Unit has `unitCode`, `rentAmount`, `currency`, status |
| `Tenant` | Occupant + `kycStatus` |
| `Lease` | Dates, rent, `dueDay`, `version`. Product rule: one active lease per unit |
| `Invoice` / `Payment` | Due / paid / balance; payments have method + reference |
| `Ticket` | Category, priority, SLA timestamps |
| `Vendor` | Assigned work |
| `Document` / `ComplianceRule` | Vault + required docs / validity |
| `Notification` | Channel, type, payload, queued/sent |
| `AuditLog` | Privileged trail |

Product copy uses GHS; the schema currently defaults unit `currency` to `USD` — set GHS explicitly when creating units.

## HTTP modules

Global prefix + version: **`/api/v1`**.

| Module | Controller prefix | Status |
| --- | --- | --- |
| Health | `/health` | Live |
| Auth | `/auth` | `POST /login` live |
| Documents | `/documents` | `GET /`, `POST /`, `POST /upload-url` |
| Audit logs | `/audit-logs` | `GET /` with `page` / `pageSize` (max 100) |
| Properties, units, tenants, leases | matching prefix | Module + service scaffolded |
| Invoices, payments, tickets, dashboard | matching prefix | Module + service scaffolded |
| Notifications | — | Service + queue processor |

Pagination DTO: `page` (default 1), `pageSize` (default 25, max 100).

Intended contract (PRD): Bearer JWT, org from claims, filters as query params, sort `?sort=-created_at`, idempotency keys on retried writes.

## Conventions

- DTO validation with `class-validator` / `class-transformer`
- Swagger `@ApiTags` / `@ApiBearerAuth` on live controllers
- Do not hand-edit `src/generated/prisma`
- Do not log secrets or raw passwords
- Keep operator-facing copy factual (arrears reminders are not eviction notices)

## Tests

Jest (`rootDir: src`, `*.spec.ts`). E2e: `npm run test:e2e` (`test/jest-e2e.json`).
