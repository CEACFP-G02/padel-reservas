# API Contract — Pádel-Reservas

REST API consumed by the admin web panel and the mobile app. This document is the shared contract between the backend and frontend teams; keep it updated when endpoints change.

## Conventions

- **Base path:** `/api/v1`
- **Resources:** plural nouns, kebab-case (`/courts`, `/bookings`, `/court-blocks`).
- **HTTP verbs:** `GET` (read/list), `POST` (create), `PATCH` (partial update), `PUT` (full replace), `DELETE` (remove).
- **Auth:** JWT in `Authorization: Bearer <token>`. Roles: `OWNER`, `CLIENT`.
- **Content type:** `application/json` (UTF-8).
- **Dates/times:** ISO 8601 — date `YYYY-MM-DD`, time `HH:mm`, timestamp `YYYY-MM-DDTHH:mm:ssZ`.
- **Money:** decimal with 2 places, EUR.
- **Pagination (list endpoints):** `?page=0&size=20&sort=field,asc`. Response wraps items in `content` plus `page`, `size`, `totalElements`, `totalPages`.
- **Errors:** uniform body
  ```json
  { "timestamp": "2026-06-08T07:00:00Z", "status": 404, "error": "Not Found", "message": "Court 12 not found", "path": "/api/v1/courts/12" }
  ```
- **Status codes:** 200 OK, 201 Created, 204 No Content, 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 409 Conflict (e.g. slot already booked).

Availability model: **computed** (option B). Only opening hours (schedule) and bookings are stored; free slots are derived on the fly by subtracting bookings and blocks from the court schedule.

---

## Auth — `/api/v1/auth`

| Method | Path | Role | Purpose |
|---|---|---|---|
| POST | `/auth/register` | public | Client self sign-up. Body: `{ name, email, password, phone? }` → `201` + user |
| POST | `/auth/login` | public | `{ email, password }` → `{ accessToken, refreshToken, user }` |
| POST | `/auth/refresh` | public | `{ refreshToken }` → new `{ accessToken }` |
| GET | `/auth/me` | OWNER, CLIENT | Current authenticated user |

---

## Courts — `/api/v1/courts`

| Method | Path | Role | Purpose |
|---|---|---|---|
| GET | `/courts` | OWNER, CLIENT | List courts. Query: `type`, `active`, pagination |
| GET | `/courts/{id}` | OWNER, CLIENT | Single court |
| POST | `/courts` | OWNER | Create. Body: `{ name, type, indoor, active }` |
| PATCH | `/courts/{id}` | OWNER | Update fields |
| DELETE | `/courts/{id}` | OWNER | Deactivate / remove |

`type` examples: `GLASS`, `WALL`. `indoor`: boolean.

---

## Schedule — `/api/v1/courts/{id}/schedule`

Weekly opening hours + slot length + price per court. The source for availability.

| Method | Path | Role | Purpose |
|---|---|---|---|
| GET | `/courts/{id}/schedule` | OWNER, CLIENT | Current schedule config |
| PUT | `/courts/{id}/schedule` | OWNER | Replace schedule |

Schedule body:
```json
{
  "slotMinutes": 60,
  "price": 16.00,
  "weekdays": [
    { "day": "MONDAY", "open": "08:00", "close": "22:00" },
    { "day": "SUNDAY", "open": "09:00", "close": "14:00" }
  ]
}
```

---

## Availability — `/api/v1/availability` ⭐

Core feature. Computed from schedule − bookings − blocks.

| Method | Path | Role | Purpose |
|---|---|---|---|
| GET | `/availability?date=&courts=` | OWNER, CLIENT | Free slots for `date` that fit `courts` courts; if none, nearby days |
| GET | `/courts/{id}/availability?date=` | OWNER, CLIENT | Day grid for one court (admin calendar) |

`GET /availability?date=2026-06-08&courts=2`
```json
{
  "requestedDate": "2026-06-08",
  "courtsRequested": 2,
  "available": true,
  "slots": [
    { "start": "07:00", "end": "08:00", "courtsFree": 3, "courtIds": [1, 2, 3], "price": 16.00 },
    { "start": "08:00", "end": "09:00", "courtsFree": 2, "courtIds": [1, 3], "price": 16.00 }
  ],
  "alternativeDays": []
}
```

Each slot lists `courtIds`, the ids of the courts free in that slot (`courtsFree` is its length). To book, the client picks one of those ids and sends it as `courtId` to `POST /bookings` — the server does not auto-assign a court.

When `available` is `false`, `slots` is empty and `alternativeDays` lists nearby days that have room, searched in a **±7-day window clamped to today** — i.e. from `max(today, date−7)` to `date+7`, never in the past:
```json
{
  "requestedDate": "2026-06-08",
  "courtsRequested": 2,
  "available": false,
  "slots": [],
  "alternativeDays": [
    { "date": "2026-06-09", "freeSlotCount": 5 },
    { "date": "2026-06-10", "freeSlotCount": 8 }
  ]
}
```

---

## Bookings — `/api/v1/bookings`

| Method | Path | Role | Purpose |
|---|---|---|---|
| GET | `/bookings` | OWNER | All bookings. Query: `date`, `courtId`, `userId`, `status`, pagination |
| GET | `/me/bookings` | CLIENT | Own bookings (upcoming + history), paginated. Query: `status`, `from`, `to`, pagination |
| GET | `/bookings/{id}` | OWNER, CLIENT* | Single booking (*client: only own) |
| POST | `/bookings` | OWNER, CLIENT | Create. Client books for self; owner books manually for any client |
| PATCH | `/bookings/{id}` | OWNER, CLIENT* | Change status / reschedule |
| DELETE | `/bookings/{id}` | OWNER, CLIENT* | Cancel (min-notice rule applies to clients) |

Create body:
```json
{
  "courtId": 3,
  "date": "2026-06-08",
  "slots": [ { "start": "07:00", "end": "08:00" } ],
  "clientId": 42
}
```
`courtId` is required: it is one of the `courtIds` the availability endpoint reported free for those slots. `clientId` is optional/ignored for CLIENT (taken from token) and required for OWNER manual booking. One booking covers one court with one or more consecutive slots. Returns `409` if any slot is no longer free on that court.

Booking response (also returned by `GET /bookings/{id}`, and as the items of the paginated lists):
```json
{
  "id": 5001,
  "courtId": 3,
  "courtName": "Court 3",
  "userId": 42,
  "date": "2026-06-08",
  "status": "CONFIRMED",
  "totalPrice": 16.00,
  "createdAt": "2026-05-30T10:15:00Z",
  "slots": [ { "start": "07:00", "end": "08:00", "price": 16.00 } ]
}
```

`status`: `CONFIRMED`, `CANCELLED`, `COMPLETED`.

---

## Court blocks (maintenance) — `/api/v1/courts/{id}/blocks`

| Method | Path | Role | Purpose |
|---|---|---|---|
| GET | `/courts/{id}/blocks` | OWNER, CLIENT | Blocks for a court |
| POST | `/courts/{id}/blocks` | OWNER | Create. Body: `{ date, start, end, reason }` |
| DELETE | `/court-blocks/{id}` | OWNER | Remove block |

Blocks remove the covered slots from availability.

---

## Users / clients — `/api/v1/users`

| Method | Path | Role | Purpose |
|---|---|---|---|
| GET | `/users` | OWNER | List clients. Query: `search`, pagination |
| GET | `/users/{id}` | OWNER | Single client |
| POST | `/users` | OWNER | Create client |
| PATCH | `/users/{id}` | OWNER | Update client |
| DELETE | `/users/{id}` | OWNER | Remove client |
| GET | `/users/{id}/bookings` | OWNER | A client's bookings |

Self profile edits go through `/auth/me` (PATCH) rather than `/users/{id}`.

---

## Dashboard — `/api/v1/dashboard`

| Method | Path | Role | Purpose |
|---|---|---|---|
| GET | `/dashboard/summary?from=&to=` | OWNER | Occupancy %, revenue, most-used courts for a period |

---

## Out of MVP scope (future resources)

Optional features would add their own resources without changing the above: `/payments`, `/reviews`, `/notifications`, multi-venue (`/venues`). The contract is designed so these extend rather than break it.
