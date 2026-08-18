# PropFlow

PropFlow is a property operations platform for landlords, property managers, and real-estate operators. It brings leasing, collections, maintenance, and compliance into one workspace so operators are not running portfolios from spreadsheets, chat threads, and ad-hoc follow-up.

Currency in product examples is **GHS**. Source of truth for scope and behaviour is [`docs/PropFlow_PRD_v1.1.txt`](docs/PropFlow_PRD_v1.1.txt).

## What it does

MVP covers the operator loop end to end:

- **Portfolio** — properties, units, occupancy, and unit metadata
- **Leasing** — tenant profiles, KYC status, leases (create / renew / terminate; one active lease per unit)
- **Collections** — invoices, payment posting, partials, arrears aging, reminders
- **Maintenance** — tickets with SLA, vendor assignment, Open → Assigned → In progress → Resolved → Closed
- **Compliance** — document vault with expiry highlighting
- **Admin** — RBAC by role, in-app notifications, audit logs, dashboards, CSV/PDF exports

Out of scope for MVP: full accounting/GL, public listings, mortgage origination, and AI valuation.

## Roles

One Angular operator app. Navigation is shown or hidden from the JWT/`role` claim (the UI currently uses a local demo session with the same role model).

| Role | Access |
| --- | --- |
| **Owner** | Full org: portfolio, collections, operations, audit logs, appearance |
| **Manager** | Day-to-day operations across properties, leases, tickets, collections |
| **Finance** | Invoices, payments, arrears, documents, dashboards |
| **Vendor** | Assigned work orders only |
| **Tenant** | Own tickets and documents (portal-style subset) |

Vendors and tenants land on **Maintenance** after sign-in. Other roles land on the **dashboard**.

## Repository layout

```
PropFlow/
├── docs/                  Product requirements
├── backend/               NestJS API
│   ├── prisma/            Schema and migrations (Neon Postgres)
│   └── src/               Modules, guards, jobs, storage, logging
└── frontend/              Angular operator app
    └── src/app/
        ├── core/          Interfaces, services, guards, icons, config, mock data
        ├── shared/        Icons and reusable UI (tables, modals, toasts, charts)
        ├── layouts/       Auth split layout and main chrome (sidebar + topbar)
        └── features/      Login, dashboard, appearance, collection list + detail
```

Frontend structure follows a TrustNET-style layout: each UI piece typically has `.html`, `.css`, `.ts`, and `.spec.ts`. Overlays (`toast`, `modal`, `loader`) sit on `app-root`.

## Architecture

| Layer | Stack |
| --- | --- |
| Operator UI | Angular 21, Tailwind CSS 4, Figtree, `@ng-icons` (Heroicons), ApexCharts, jsPDF |
| API | NestJS 11, Prisma 7, class-validator, Swagger |
| Database | Neon Postgres (org-scoped) |
| Cache / queues | Redis (local Docker, no auth) + BullMQ |
| Auth | JWT access + refresh; org in token claims |
| Files | S3 + CloudFront (presigned upload URLs) |
| Rate limits | `@nestjs/throttler` with Redis storage; tighter windows on login |

The UI calls the API at `environment.apiBaseUrl` (`{origin}/api/{version}`). The Nest app serves versioned routes under `/api/v1` and Swagger at `/docs`.

**Current frontend auth** is a local demo session (email + password against in-memory accounts). List/detail screens use in-memory mock JSON so the operator UX can be exercised without the API. The Nest API is the production contract for the same domains.

## Prerequisites

- Node.js 22+ and npm
- Docker (for Redis)
- A Neon (or other Postgres) database URL for the API
- Optional: AWS credentials if you exercise document upload

## Backend

Implementation detail (modules, env, throttling, Prisma, API status): [`backend/README.md`](backend/README.md).

```bash
cd backend
cp .env.example .env   # then fill values
npm install
```

Start Redis (no password):

```bash
docker run --name propflow-redis -p 6379:6379 -d redis:7
```

Generate the Prisma client and run migrations:

```bash
npm run prisma:generate
npm run prisma:migrate:dev
```

Run the API:

```bash
npm run start:dev
```

Defaults (from env):

- API: `http://localhost:3000/api/v1`
- Health: `GET /api/v1/health`
- Swagger: `http://localhost:3000/docs`

Useful scripts:

| Command | Purpose |
| --- | --- |
| `npm run start:dev` | Watch mode |
| `npm run build` / `npm run start:prod` | Production compile and run |
| `npm run prisma:studio` | Browse Postgres |
| `npm run test` / `npm run test:e2e` | Unit and e2e tests |

Required env groups are documented in [`backend/.env.example`](backend/.env.example): `DATABASE_URL`, JWT secrets and TTLs, Redis host/port, throttle windows, S3/CloudFront, and audit flags.

Login is rate-limited more tightly than the global windows (short / medium / long). Health and Swagger are skipped. Trackers include user id and client IP (`X-Forwarded-For` when present).

## Frontend

Implementation detail (routes, mock data, roles, theming, UI map): [`frontend/README.md`](frontend/README.md).

```bash
cd frontend
npm install
npm start
```

App: [http://localhost:4200](http://localhost:4200)

The frontend uses `environment.apiBaseUrl` from [`frontend/src/environments`](frontend/src/environments).

```bash
npm run build    # production bundle
npm test         # unit tests
```

### Demo operator accounts

The login screen does not list these. Use them locally against the in-memory auth service. Password for every account: `password`

| Email | Role | Lands on |
| --- | --- | --- |
| `owner@propflow.app` | Owner | Dashboard |
| `manager@propflow.app` | Manager | Dashboard |
| `finance@propflow.app` | Finance | Dashboard |
| `vendor@propflow.app` | Vendor | Maintenance |
| `tenant@propflow.app` | Tenant | Maintenance |

### Operator UX

- **Auth layout** — split brand panel (SVG property pattern) and sign-in form; password fields use show/hide via ng-icons
- **Dashboard** — portfolio posture, KPIs, ticket pipeline, charts, alerts, role-filtered quick actions
- **Collections** — searchable, filterable, paginated data tables with CSV/PDF export, bulk delete, add/edit dialogs
- **Detail pages** — `/properties/:id` (and the same pattern for units, tenants, leases, invoices, payments, arrears, tickets, documents, notifications, audit logs): stats, overview, related records, documents, timeline, notes
- **Appearance** — Atlantic, Forest, Ember, Graphite, Orchid; saved in the browser (`data-theme` on `<html>`)
- **Chrome** — collapsing sidebar, mobile drawer, notification tray, confirm modals, toasts, global loader

Mock volumes are large enough for table pagination (for example 58 units, 60 invoices, 52 payments).

## API surface (v1)

REST JSON, Bearer JWT, `org_id` scoped on the server. Pagination `?page=&page_size=`, sort `?sort=-created_at`, filters as query params.

| Area | Prefix |
| --- | --- |
| Auth | `POST /auth/login`, `/auth/refresh`, `/auth/logout` |
| Portfolio | `/properties`, `/units` |
| Leasing | `/tenants`, `/leases` (+ renew / terminate) |
| Collections | `/invoices`, `/payments`, `/arrears` |
| Maintenance | `/tickets` |
| Documents | `/documents`, `/documents/upload-url` |
| Insights | `/dashboard` |
| Admin | `/audit-logs` |
| Health | `/health` |

See the PRD §6 for request/response examples (rent amounts in GHS).

## Product rules worth knowing

- No overlapping **active** lease on a unit
- Invoices support paid / partial / overdue; payments post with method and reference
- Ticket SLA is category/priority based
- Documents highlight upcoming expiry
- Audit logs are owner-only in the UI
- Operator copy and receipts should stay factual (arrears reminders are not eviction notices)

## Development notes

- Frontend TypeScript is **~5.9** (Angular 21). The backend SDK may use TypeScript 6; do not bump the frontend compiler to 6 to match.
- Logging on the API uses a colour `AppLogger` (`error` / `warning` / `success` / `info`).
- Theme tokens live in `frontend/src/styles.css` (`--pf-brand`, navy, surface). Charts pick up brand colours when the theme changes.

## License

UNLICENSED — private project.
