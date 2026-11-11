# courtblock

Owner-defined periods in which a court cannot be booked (maintenance, tournaments...).
Owns `CourtBlock` (N:1 `Court`) and `CourtBlockRepository` (also read by `availability`
and `booking`).

Base path: `/api/v1` — all endpoints require role `OWNER`.

| Use case | Class | Endpoint |
|---|---|---|
| List blocks | `ListBlocksUseCase` | `GET /courts/{courtId}/blocks?from=&to=` |
| Create block | `CreateBlockUseCase` | `POST /courts/{courtId}/blocks` |
| Remove block | `RemoveBlockUseCase` | `DELETE /court-blocks/{id}` |

Rules (details in `docs/api.md`):
- A block is one time range on one date; it must end after now (`Clock`) and `end > start` → else `400`.
- Overlap policy: a block may not cover a `CONFIRMED` booking → `409`; overlapping other blocks is allowed.
  Creation locks the court row (`findByIdForUpdate`), like booking creation, so the two cannot interleave.

Contract details: `docs/api.md`.
