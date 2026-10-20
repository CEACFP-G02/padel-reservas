# user

Client management by the administrator. Owns the `User` entity (table `app_user`)
and `UserRepository` (also used by `auth`, `booking`).

Base path: `/api/v1/users` — all endpoints require role `ADMIN`.

| Use case | Class | Endpoint |
|---|---|---|
| List clients | `ListClientsUseCase` | `GET /` |
| Get client | `GetClientUseCase` | `GET /{id}` |
| Create client | `CreateClientUseCase` | `POST /` |
| Update client | `UpdateClientUseCase` | `PUT /{id}` |
| Delete client | `DeleteClientUseCase` | `DELETE /{id}` |

Contract details: `docs/api.md`.
