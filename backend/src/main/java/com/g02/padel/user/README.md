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
| List a client's bookings | `ListBookingsUseCase` (booking feature, `userId` filter) | `GET /{id}/bookings` (paged) |

Contract details: `docs/api.md`.
