# dashboard

Admin KPIs. Read-only; no own entity or repository — aggregates `BookingRepository`.

Base path: `/api/v1/dashboard` — role `ADMIN`.

| Use case | Class | Endpoint |
|---|---|---|
| Get dashboard summary | `GetDashboardSummaryUseCase` | `GET /summary?from=&to=` |

Contract details: `docs/api.md`.
