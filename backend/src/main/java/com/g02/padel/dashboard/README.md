# dashboard

Owner KPIs for today. Read-only; no own entity or repository — aggregates courts, schedules and bookings, and reuses `CourtDaySlotCalculator` for occupancy.

Base path: `/api/v1/dashboard` — role `OWNER`.

| Use case | Class | Endpoint |
|---|---|---|
| Get dashboard summary | `GetDashboardSummaryUseCase` | `GET /summary` |

Contract details: `docs/api.md`.
