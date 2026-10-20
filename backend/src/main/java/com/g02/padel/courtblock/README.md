# courtblock

Admin-defined periods in which a court cannot be booked (maintenance, tournaments...).
Owns `CourtBlock` (N:1 `Court`) and `CourtBlockRepository` (also read by `availability`
and `booking`).

Base path: `/api/v1` — all endpoints require role `ADMIN`.

| Use case | Class | Endpoint |
|---|---|---|
| List blocks | `ListBlocksUseCase` | `GET /courts/{courtId}/blocks?date=` |
| Create block | `CreateBlockUseCase` | `POST /courts/{courtId}/blocks` |
| Remove block | `RemoveBlockUseCase` | `DELETE /courts/{courtId}/blocks/{blockId}` |

Contract details: `docs/api.md`.
