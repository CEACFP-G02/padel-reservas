# availability

Read-only feature: availability is **computed** at query time (option B, nothing stored).
No own entity or repository; reads `CourtRepository`, `ScheduleRepository`,
`BookingRepository` and `CourtBlockRepository`.

`free slots = opening hours (split by slotDurationMinutes) − non-cancelled booking slots − court blocks`

Base path: `/api/v1` — authenticated.

| Use case | Class | Endpoint |
|---|---|---|
| Get availability (all courts) | `GetAvailabilityUseCase` | `GET /availability?date=YYYY-MM-DD&courts=N` |
| Get court-day availability | `GetCourtDayAvailabilityUseCase` | `GET /courts/{courtId}/availability?date=YYYY-MM-DD` |

**Nearby days**: when `date` is fully booked, `GetAvailability` proposes days with free slots
in `[max(today, date − N), date + N]` (N = `app.availability.nearby-days-window`, default 7),
never in the past.

Contract details: `docs/api.md`.
