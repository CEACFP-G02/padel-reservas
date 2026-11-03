# court

Padel court catalogue. Owns the `Court` entity and `CourtRepository`.

Base path: `/api/v1/courts`

| Use case | Class | Endpoint | Access |
|---|---|---|---|
| List courts | `ListCourtsUseCase` | `GET /?type=&active=` (paged) | OWNER, CLIENT |
| Get court | `GetCourtUseCase` | `GET /{id}` | OWNER, CLIENT |
| Create court | `CreateCourtUseCase` | `POST /` | OWNER |
| Update court | `UpdateCourtUseCase` | `PATCH /{id}` | OWNER |
| Deactivate court | `DeactivateCourtUseCase` | `DELETE /{id}` (soft: active=false) | OWNER |

Courts are never hard-deleted (bookings reference them); deactivation hides them from booking.

Rules:
- Names are unique ignoring case (trimmed) → duplicate on create/update is **409 Conflict**.
- `create`: `name`, `type` (`GLASS`/`WALL`) and `indoor` are required; `active` defaults to `true`.
- `PATCH` changes only the fields present; a blank `name` is **400**.
- List filters (`type`, `active`) are optional and combinable; default sort is `id`.
- Visibility by role (from the token via `CurrentRole`, never a request flag): OWNER sees active and
  inactive courts; CLIENT sees active ones only — inactive courts never appear in the list (even
  with `active=false`) and `GET /{id}` of one is **404**.
- Unknown enum values, non-numeric ids and malformed JSON are **400**; a missing court is **404**.

Contract details: `docs/api.md`.
