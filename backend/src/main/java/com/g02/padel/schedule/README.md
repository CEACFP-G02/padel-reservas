# schedule

Weekly opening hours per court. Owns `Schedule` (1:1 with `Court`), `OpeningHours`
(1:N, one row per day/range) and `ScheduleRepository`.

Base path: `/api/v1/courts/{courtId}/schedule`

| Use case | Class | Endpoint | Access |
|---|---|---|---|
| Get schedule | `GetScheduleUseCase` | `GET /` | authenticated |
| Update schedule | `UpdateScheduleUseCase` | `PUT /` (full replace) | ADMIN |

Contract details: `docs/api.md`.
