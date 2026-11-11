# user

Client management by the owner. Owns the `User` entity (table `app_user`)
and `UserRepository` (also used by `auth`, `booking`).

Base path: `/api/v1/users` — all endpoints require role `OWNER`.

| Use case | Class | Endpoint |
|---|---|---|
| List clients | `ListClientsUseCase` | `GET /?search=` (paged) |
| Get client | `GetClientUseCase` | `GET /{id}` |
| Create client | `CreateClientUseCase` | `POST /` |
| Update client | `UpdateClientUseCase` | `PATCH /{id}` |
| Delete client | `DeleteClientUseCase` | `DELETE /{id}` |
| List a client's bookings | `ListClientBookingsUseCase` | `GET /{id}/bookings` (paged, most recent first) |

Rules (details in `docs/api.md`):
- Only `CLIENT` accounts are managed here; an owner id is `404`, like an unknown one.
- Emails are normalized (trimmed, lower-case, `auth.usecase.Emails`) and unique → `409`.
- Delete is soft (`active=false`, bookings kept) when the client has bookings, otherwise a real delete.
  An inactive client cannot log in; `PATCH { "active": true }` reactivates it.

Contract details: `docs/api.md`.
