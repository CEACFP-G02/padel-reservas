# booking

Court bookings. Owns `Booking` (N:1 `Court`, N:1 `User`), `BookingSlot` (1:N per booking)
and `BookingRepository` (also read by `availability` and `dashboard`).

Base path: `/api/v1` — authenticated.

| Use case | Class | Endpoint | Access |
|---|---|---|---|
| Create booking | `CreateBookingUseCase` | `POST /bookings` | CLIENT, ADMIN |
| List bookings | `ListBookingsUseCase` | `GET /bookings?courtId=&date=` | ADMIN |
| Get booking | `GetBookingUseCase` | `GET /bookings/{id}` | owner, ADMIN |
| Get my bookings | `GetMyBookingsUseCase` | `GET /me/bookings` | CLIENT |
| Cancel booking | `CancelBookingUseCase` | `PATCH /bookings/{id}/cancel` | owner, ADMIN |
| Reschedule booking | `RescheduleBookingUseCase` | `PATCH /bookings/{id}/reschedule` | owner, ADMIN |

Rules:
- A taken or blocked slot → `SlotNotAvailableException` → **409 Conflict**.
- Clients can cancel/reschedule only up to `app.booking.cancel-min-notice-hours` (default 24) before start.

Contract details: `docs/api.md`.
