# booking

Court bookings. Owns `Booking` (N:1 `Court`, N:1 `User`), `BookingSlot` (1:N per booking)
and `BookingRepository` (also read by `availability` and `dashboard`).

Base path: `/api/v1` — authenticated.

| Use case | Class | Endpoint | Access |
|---|---|---|---|
| Create booking | `CreateBookingUseCase` | `POST /bookings` | CLIENT, OWNER |
| List bookings | `ListBookingsUseCase` | `GET /bookings?date=&courtId=&userId=&status=` (paged) | OWNER |
| Get booking | `GetBookingUseCase` | `GET /bookings/{id}` | booking's client, OWNER |
| Get my bookings | `GetMyBookingsUseCase` | `GET /me/bookings?status=&from=&to=` (paged, own only) | CLIENT |
| Cancel booking | `CancelBookingUseCase` | `DELETE /bookings/{id}` (soft: status CANCELLED) | booking's client, OWNER |
| Reschedule booking | `RescheduleBookingUseCase` | `PATCH /bookings/{id}` | booking's client, OWNER |

Rules:
- Each `BookingSlot` stores the price charged for it at booking time (`DECIMAL(8,2)`, `>= 0`);
  `Booking.totalPrice` is always the sum of its slot prices. Schedule price changes never touch
  existing bookings.
- Status: `CONFIRMED` → `CANCELLED` (soft cancel, row kept, `cancelledAt` set) or `COMPLETED`;
  only a `CONFIRMED` booking can be cancelled or rescheduled, otherwise **409**.
- A taken or blocked slot → `SlotNotAvailableException` → **409 Conflict**.
- A CLIENT's booking is paid by `BookingCheckout`, **credit first, then money**: of N slots, k = min(balance, N)
  (the earliest) are paid with one `CONSUMPTION` of −k in the credit ledger, linked to the booking; the price
  snapshots of the rest are charged to the client's `paymentMethodId` through `PaymentGateway` (missing → 400,
  not theirs → 404, declined → 402). The slots are checked first, the charge is made last, and everything runs
  in the booking's transaction, so any error leaves no booking, no consumption and no charge. The booking
  records `creditsUsed`, `amountCharged`, the card and the charge reference. An OWNER manual booking is not paid
  (no credits, no charge; those columns stay null).
- `BookableSlots` validates requested times (consecutive, inside the schedule grid, not started)
  and prices them; free/taken comes from `availability.CourtDaySlotCalculator`, never re-implemented.
  Booking locks the court row (`CourtRepository.findByIdForUpdate`) so two concurrent requests
  cannot both take the same slot.
- Clients can cancel/reschedule only up to `app.booking.cancel-min-notice-hours` (default 24) before start
  (exactly 24 h is allowed); later → **409**. The OWNER may do both at any time.
- `BookingAccess` decides who may read/change a booking: a CLIENT only their own (someone else's → 404),
  the OWNER any; changing also requires `CONFIRMED` and, for a CLIENT, the minimum notice.
- Reschedule reuses `BookableSlots` with the booking's own slots counting as free, and re-prices
  the new slots at the current schedule price.
- Lists (`BookingSpecifications`) filter optionally and default to `date` desc, `id` desc.

Contract details: `docs/api.md`.
