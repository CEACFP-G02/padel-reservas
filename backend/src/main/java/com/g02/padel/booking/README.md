# booking

Court bookings. Owns `Booking` (N:1 `Court`, N:1 `User`), `BookingSlot` (1:N per booking)
and `BookingRepository` (also read by `availability` and `dashboard`).

Base path: `/api/v1` — authenticated.

| Use case | Class | Endpoint | Access |
|---|---|---|---|
| Create booking | `CreateBookingUseCase` | `POST /bookings` | CLIENT, OWNER |
| List bookings | `ListBookingsUseCase` | `GET /bookings?date=&courtId=&userId=&status=` (paged) | OWNER |
| Get booking | `GetBookingUseCase` | `GET /bookings/{id}` | booking's client, OWNER |
| Get my bookings | `GetMyBookingsUseCase` | `GET /me/bookings?status=&from=&to=` (paged) | CLIENT |
| Cancel booking | `CancelBookingUseCase` | `DELETE /bookings/{id}` (soft: status CANCELLED) | booking's client, OWNER |
| Reschedule booking | `RescheduleBookingUseCase` | `PATCH /bookings/{id}` | booking's client, OWNER |

Rules:
- Each `BookingSlot` stores the price charged for it at booking time (`DECIMAL(8,2)`, `>= 0`);
  `Booking.totalPrice` is always the sum of its slot prices. Schedule price changes never touch
  existing bookings.
- Status: `CONFIRMED` → `CANCELLED` (soft cancel, row kept, `cancelledAt` set) or `COMPLETED`;
  only a `CONFIRMED` booking can be cancelled or rescheduled, otherwise **409**.
- A taken or blocked slot → `SlotNotAvailableException` → **409 Conflict**.
- Clients can cancel/reschedule only up to `app.booking.cancel-min-notice-hours` (default 24) before start.

Contract details: `docs/api.md`.
