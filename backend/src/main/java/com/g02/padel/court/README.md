# court

Padel court catalogue. Owns the `Court` entity and `CourtRepository`.

Base path: `/api/v1/courts`

| Use case | Class | Endpoint | Access |
|---|---|---|---|
| List courts | `ListCourtsUseCase` | `GET /?includeInactive=` | public |
| Get court | `GetCourtUseCase` | `GET /{id}` | public |
| Create court | `CreateCourtUseCase` | `POST /` | OWNER |
| Update court | `UpdateCourtUseCase` | `PUT /{id}` | OWNER |
| Deactivate court | `DeactivateCourtUseCase` | `PATCH /{id}/deactivate` | OWNER |

Courts are never hard-deleted (bookings reference them); deactivation hides them from booking.

Contract details: `docs/api.md`.
