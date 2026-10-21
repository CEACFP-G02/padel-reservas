# court

Padel court catalogue. Owns the `Court` entity and `CourtRepository`.

Base path: `/api/v1/courts`

| Use case | Class | Endpoint | Access |
|---|---|---|---|
| List courts | `ListCourtsUseCase` | `GET /?type=&active=` (paged) | public |
| Get court | `GetCourtUseCase` | `GET /{id}` | public |
| Create court | `CreateCourtUseCase` | `POST /` | OWNER |
| Update court | `UpdateCourtUseCase` | `PATCH /{id}` | OWNER |
| Deactivate court | `DeactivateCourtUseCase` | `DELETE /{id}` (soft: active=false) | OWNER |

Courts are never hard-deleted (bookings reference them); deactivation hides them from booking.

Contract details: `docs/api.md`.
