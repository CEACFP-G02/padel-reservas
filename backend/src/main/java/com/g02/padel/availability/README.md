# availability

Read-only feature: availability is **computed** at query time (option B, nothing stored).
No own entity or repository; reads `CourtRepository`, `ScheduleRepository`,
`BookingRepository` and `CourtBlockRepository`.

`free slots = opening hours (split by the schedule's slotMinutes) − non-cancelled booking slots − court blocks`

`CourtDaySlotCalculator` computes one court's day; both use cases build on it:
- a slot is `[start, end)`; it is taken if it overlaps a booking slot or block by any amount
  (back-to-back ranges do not overlap), and on today a slot that has already started is taken;
- a trailing remainder shorter than `slotMinutes` is not a slot;
- no schedule, or no opening hours that weekday → no slots.

Base path: `/api/v1` — authenticated.

| Use case | Class | Endpoint |
|---|---|---|
| Get availability (all courts) | `GetAvailabilityUseCase` | `GET /availability?date=YYYY-MM-DD&courts=N` |
| Get court-day availability | `GetCourtDayAvailabilityUseCase` | `GET /courts/{courtId}/availability?date=YYYY-MM-DD` |

**Nearby days**: when `date` is fully booked, `GetAvailability` proposes days with free slots
in `[max(today, date − N), date + N]` (N = `app.availability.nearby-days-window`, default 7),
never in the past.

Contract details: `docs/api.md`.
