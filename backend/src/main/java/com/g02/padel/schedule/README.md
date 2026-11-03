# schedule

Weekly opening hours and slot price per court. Owns `Schedule` (1:1 with `Court`), `OpeningHours`
(1:N, one row per day/range) and `ScheduleRepository`.

Base path: `/api/v1/courts/{courtId}/schedule`

| Use case | Class | Endpoint | Access |
|---|---|---|---|
| Get schedule | `GetScheduleUseCase` | `GET /` | OWNER, CLIENT |
| Update schedule | `UpdateScheduleUseCase` | `PUT /` (full replace) | OWNER |

Rules:
- `PUT` replaces the whole schedule (creates it the first time): `slotMinutes` 30–240, `price` per
  slot `>= 0` with at most 2 decimals (`DECIMAL(8,2)`), and the opening ranges.
- Each range closes after it opens and fits at least one slot; ranges of the same day must not
  overlap (they may touch). A day may have several ranges; days not listed are closed.
- Bean Validation errors → **400** with `fieldErrors`; range-rule violations → **400** with a
  message such as `MONDAY 13:00-20:00 overlaps 08:00-14:00`.
- **404** for a missing court, a court without a schedule yet (`GET`), or an inactive court read
  by a CLIENT. Ranges are returned by weekday (Monday first), then by opening time.

Contract details: `docs/api.md`.
