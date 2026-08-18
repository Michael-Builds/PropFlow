# PropFlow operator app

Angular 21 workspace for landlords, managers, finance, vendors, and tenants. One app; the signed-in `role` shows and hides navigation.

This folder is the operator UX. Screens and tables currently run on **in-memory mock JSON**. The Nest API in `../backend` is the production contract (`/api` is already proxied there). Product spec: [`../docs/PropFlow_PRD_v1.1.txt`](../docs/PropFlow_PRD_v1.1.txt). Amounts in the UI are **GHS**.

## Stack

| Piece | Choice |
| --- | --- |
| Framework | Angular 21 (standalone, OnPush, signals) |
| Language | TypeScript ~5.9 (do not bump to 6 to match the backend SDK) |
| Styling | Tailwind CSS 4, Figtree, theme tokens in `src/styles.css` |
| Icons | `@ng-icons/core` + `@ng-icons/heroicons` outline, registered in `app.config.ts` |
| Charts | ApexCharts via `app-chart` |
| Export | CSV + jsPDF / autotable from the data table |
| Tests | Angular unit-test builder (Vitest / jsdom) |

## Run

```bash
npm install
npm start
```

Open [http://localhost:4200](http://localhost:4200). `ng serve` uses [`proxy.conf.json`](proxy.conf.json) so `/api` goes to `http://localhost:3000`.

```bash
npm run build    # production
npm run watch    # development rebuild
npm test         # unit tests
```

## Demo logins

The sign-in page does **not** list these. Session is stored in `localStorage` under `propflow.session`. Password for every account: **`password`**

| Email | Role | Home |
| --- | --- | --- |
| `owner@propflow.app` | Owner | `/dashboard` |
| `manager@propflow.app` | Manager | `/dashboard` |
| `finance@propflow.app` | Finance | `/dashboard` |
| `vendor@propflow.app` | Vendor | `/tickets` |
| `tenant@propflow.app` | Tenant | `/tickets` |

Failed logins toast a generic invalid-credentials message. Password fields use show/hide (`eye` / `eyeOff`) inside `app-input`, not on the page.

## Folder map

```
frontend/src/app/
├── app.ts / app.html / app.config.ts / app.routes.ts
├── core/
│   ├── config/          nav, collections, detail builders
│   ├── guards/          auth, guest
│   ├── icons/           Heroicon registration + semantic map
│   ├── interfaces/      typed contracts (nav, table, toast, detail, …)
│   ├── mock/            JSON stores for lists, details, dashboard
│   ├── services/        auth, data, toast, modal, loader, theme, sidebar, notifications
│   └── utils/           format (incl. GHS), breakpoints, layout, detail loader
├── shared/
│   ├── icons/           <app-icon>
│   └── ui/              one folder per component (html/css/ts/spec)
├── layouts/
│   ├── auth-layout/     split brand panel + SVG pattern
│   ├── main-layout/
│   ├── sidebar/
│   └── topbar/
└── features/
    ├── auth/login/
    ├── dashboard/
    ├── appearance/
    ├── collection/      list
    ├── collection/detail/
    └── errors/not-found/
```

Overlays on `app-root`: `<router-outlet />`, `<app-toast-host />`, `<app-modal-host />`, `<app-loader />`.

## Routing

| Path | Guard | Screen |
| --- | --- | --- |
| `/auth/login` | guest | Sign in |
| `/dashboard` | auth | Operations dashboard |
| `/appearance` | auth | Theme picker |
| `/:collection` | auth + role | List (data table + add/edit dialog) |
| `/:collection/:id` | auth + role | Detail |
| `**` | — | Not found |

Collections: `properties`, `units`, `tenants`, `leases`, `invoices`, `payments`, `arrears`, `tickets`, `documents`, `notifications`, `audit-logs`.

`authGuard` sends guests to login and blocks routes whose nav item does not include the current role. `guestGuard` sends an already-signed-in user to their home path.

## Roles and nav

Configured in `core/config/nav.config.ts`.

| Area | Roles |
| --- | --- |
| Dashboard | owner, manager, finance |
| Properties / units / tenants / leases | owner, manager |
| Invoices / payments / arrears | owner, manager, finance |
| Maintenance | owner, manager, vendor, tenant |
| Documents | owner, manager, finance, tenant |
| Notifications | all |
| Audit logs | owner |
| Appearance | all |

## Shared UI

Reusable pieces under `shared/ui/` (html, css, ts, spec in each folder):

| Component | Use |
| --- | --- |
| `app-button` / `app-input` / `app-select` / `app-checkbox` | Forms. Password inputs toggle visibility |
| `app-data-table` | Search, filters, sort, pagination (5/10/25/50), selection, CSV/PDF, row actions |
| `app-form-dialog` | Add/edit modal (`body.pf-modal-open` locks scroll) |
| `app-modal-host` | Confirm dialogs via `ModalService` |
| `app-toast-host` | Success / error / warning / info |
| `app-loader` | Global busy state |
| `app-page-header` / `app-card` / `app-stat-card` / `app-badge` / `app-empty-state` | Page chrome |
| `app-chart` | Area / bar / doughnut; colours follow `data-theme` |
| `app-detail-*` | Fields, stats, timeline, notes, documents, quick actions |

Icons: semantic names (`building`, `wallet`, `wrench`, …) map to Heroicons in `core/icons/icon-map.ts`.

## Features

**Auth layout.** Two columns from `lg` up. Left: navy brand panel with a house-grid SVG. Right: login form. Mobile shows a compact PropFlow header.

**Dashboard.** Posture banner, KPI cards, ticket pipeline, collections/occupancy/SLA charts, property health, activity, alerts, role-filtered quick actions.

**Lists.** `CollectionPageComponent` is driven by `route.data.collection`. Config in `collections.config.ts` (columns, filters, form fields, create/edit/delete). Row click or View opens the detail route. Edit opens the form dialog. Delete uses `ModalService.confirm` then a toast.

**Details.** `CollectionDetailPageComponent` plus `detail.config.ts`: stats, overview, related records, vaulted documents, timeline, notes, quick links. Related rows are filtered from the in-memory store (`DataService.related`).

**Appearance.** Atlantic, Forest, Ember, Graphite, Orchid. Each card is a live mini chrome preview (`data-theme` on the card). Selection is saved as `propflow.theme` and set on `<html>`. Charts re-read CSS variables when the theme changes.

**Chrome.** Collapsible sidebar (88px when collapsed), mobile drawer, search, notification tray, appearance shortcut, sign-out confirm.

Clickable controls use `cursor: pointer` from the `md` breakpoint up (`src/styles.css`).

## Mock data

`DataService` clones JSON from `core/mock/` and supports load / getById / create / update / remove / related. Approximate sizes (enough for table pagination):

| File | Rows |
| --- | --- |
| properties | 18 |
| units | 58 |
| tenants | 42 |
| leases | 40 |
| invoices | 60 |
| payments | 52 |
| arrears | 24 |
| tickets | 36 |
| documents | 34 |
| notifications | 30 |
| audit-logs | 48 |
| dashboard | KPI + chart payload |

## Theming

Tokens in `src/styles.css`: `--pf-brand`, `--pf-navy-deep`, surface, semantic success/warning/danger/info. Tailwind `@theme` maps them to utilities (`bg-brand`, `text-text-secondary`, …). Default theme: Atlantic.

## Conventions

- Standalone components, `ChangeDetectionStrategy.OnPush`, signals for local UI state
- `providedIn: 'root'` services
- Semantic icons through `app-icon`, not raw `ng-icon`, except a few table/export internals
- Do not put demo credentials on the login screen
- Frontend TypeScript stays on 5.9 even if the editor language service is 6 from the backend SDK

## Wiring the API later

`proxy.conf.json` already forwards `/api`. Replace `AuthService` and `DataService` with HTTP calls to `/api/v1` (Bearer access token, refresh on 401, org from claims). Keep the same routes and table/detail shells.
