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

Base path: `/api/v1` — OWNER, CLIENT. Missing/malformed parameters → 400; hidden or missing court → 404.

| Use case | Class | Endpoint |
|---|---|---|
| Get availability (all courts) | `GetAvailabilityUseCase` | `GET /availability?date=YYYY-MM-DD&courts=N` |
| Get court-day availability | `GetCourtDayAvailabilityUseCase` | `GET /courts/{courtId}/availability?date=YYYY-MM-DD` |

**Multi-court search** (`GetAvailability`): only active courts with a schedule count. A slot
qualifies when at least `courts` courts are free in that exact `[start, end)`; it lists their
`courtIds` (ascending) and the lowest of their prices. A date in the past or `courts < 1` → 400.

**Nearby days**: when no slot of `date` qualifies, `GetAvailability` proposes the days with at
least one qualifying slot in `[max(today, date − N), date + N]` (N =
`app.availability.nearby-days-window`, default 7), excluding `date`, in date order, never in the
past.

Contract details: `docs/api.md`.
