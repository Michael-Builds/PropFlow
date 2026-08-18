# PropFlow frontend

Angular operator app. Screens follow the PropFlow PRD. Data is mock JSON until the Nest API is wired.

## Run

```bash
npm start
```

Open http://localhost:4200

## Demo logins

Password for all: `password`

| Email | Role | Sees |
|---|---|---|
| owner@propflow.app | Owner | Everything, including audit logs |
| manager@propflow.app | Manager | Portfolio, collections, tickets, docs |
| finance@propflow.app | Finance | Dashboard, invoices, payments, arrears |
| vendor@propflow.app | Vendor | Assigned maintenance |
| tenant@propflow.app | Tenant | Own tickets and documents |

Color schemes: Appearance in the sidebar, or the palette icon in the top bar (Atlantic, Forest, Ember, Graphite, Orchid).
