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
- **Pagination (list endpoints):** `?page=0&size=20&sort=field,asc` (`page` is 0-based). Paginated responses are a `PageResponse<T>`:
  ```jsonc
  { "content": [ /* items of type T */ ], "page": 0, "size": 20, "totalElements": 42, "totalPages": 3 }
  ```
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
| GET | `/courts` | OWNER, CLIENT | List courts. Query: `type`, `active`, pagination. CLIENT: active courts only |
| GET | `/courts/{id}` | OWNER, CLIENT | Single court. CLIENT: `404` if the court is inactive |
| POST | `/courts` | OWNER | Create. Body: `{ name, type, indoor, active }` |
| PATCH | `/courts/{id}` | OWNER | Update fields |
| DELETE | `/courts/{id}` | OWNER | Deactivate / remove |

`type` examples: `GLASS`, `WALL`. `indoor`: boolean.

**Visibility by role** (decided from the caller's token, never from a request parameter):

- **OWNER** sees active and inactive courts. `GET /courts` returns both unless filtered with
  `active=true|false`; `GET /courts/{id}` returns the court whatever its state.
- **CLIENT** sees active courts only. `GET /courts` never includes inactive courts — an
  `active=false` filter returns an empty page — and `GET /courts/{id}` of an inactive court
  returns `404`, the same as a court that does not exist.

**Rules and errors** (OWNER writes):

- `POST` body: `name` required, not blank, max 100 characters; `type` and `indoor` required;
  `active` optional (default `true`). `PATCH` body: any subset of those fields — only the fields
  present change, and `name` must not be blank when present. Otherwise `400` with `fieldErrors`:
  ```json
  { "status": 400, "error": "Bad Request", "message": "Validation failed", "path": "/api/v1/courts",
    "fieldErrors": { "name": "must not be blank", "type": "must not be null" } }
  ```
- Court names are unique, compared trimmed and ignoring case (`"Pista 1"` and `" pista 1 "`
  clash). `POST`/`PATCH` with a name another court already uses → `409`
  (`"Court name Pista 1 is already in use"`). Renaming a court to its own name is fine.
- `PATCH`/`DELETE` of an unknown id → `404`.
- `DELETE` is a soft delete: the court becomes inactive (`active: false`) and its bookings and
  schedule are kept → `204`. Deleting an already inactive court is also `204`. An inactive court
  can be reactivated with `PATCH { "active": true }`.

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

- `price`: price of one slot of `slotMinutes`, EUR, `>= 0` with at most 2 decimals (`DECIMAL(8,2)`).
- `slotMinutes`: `30`–`240`.
- `weekdays`: opening ranges; a day may have several (e.g. morning and evening), days not listed are
  closed. Each range needs `open < close` and must fit at least one slot; ranges of the same day
  must not overlap (one may end when the next starts, e.g. `10:00–14:00` and `14:00–20:00`).
  `[]` closes the court all week.
- `PUT` replaces the whole schedule (creates it the first time). Invalid values → `400` with the
  uniform error body.
- `404` if the court does not exist, if it has no schedule yet (`GET`), or — for a CLIENT — if the
  court is inactive (see *Visibility by role* above).

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

Query parameters:
- `date` (required, `YYYY-MM-DD`): today or later. Missing, malformed or past → `400`.
- `courts` (optional, default `1`): how many courts the client needs at the same time, `>= 1`, else `400`.

Each slot lists `courtIds`, the ids of the courts free in that slot (`courtsFree` is its length). To book, the client picks one of those ids and sends it as `courtId` to `POST /bookings` — the server does not auto-assign a court.

How slots are computed (never stored):
- Only **active** courts with a schedule take part, for every role.
- A court's slots for a date are that weekday's opening ranges split into `slotMinutes` slots (a trailing remainder shorter than one slot is not a slot). A slot `[start, end)` is **taken** if it overlaps — by any amount — a booking slot of a non-`CANCELLED` booking or a court block; back-to-back ranges (one ends when the other starts) do not overlap. On today, a slot that has already started is taken.
- A slot is listed when at least `courts` courts are free in that exact `start`–`end`. `slots` are ordered by `start`, `courtIds` ascending, and `price` is the lowest slot price among those courts.

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

`alternativeDays` excludes the requested date, is in date order, and `freeSlotCount` is the number of slots that day with at least `courts` free courts. If the requested date is today the window is today…today+7; if it is 3 days ahead, today…date+7. It is `[]` when no day in the window has room.

`GET /courts/3/availability?date=2026-06-08` — every slot of one court's day, flagged free or not:
```json
{
  "courtId": 3,
  "courtName": "Court 3",
  "date": "2026-06-08",
  "slots": [
    { "start": "07:00", "end": "08:00", "available": false },
    { "start": "08:00", "end": "09:00", "available": true }
  ]
}
```
Same slot rules as above, for this court only (any date, so the admin calendar can show past days — all their slots are unavailable). `slots` is `[]` if the court has no schedule or is closed that weekday. `date` is required (missing or malformed → `400`). `404` if the court does not exist or — for a CLIENT — is inactive.

---

## Bookings — `/api/v1/bookings`

| Method | Path | Role | Purpose |
|---|---|---|---|
| GET | `/bookings` | OWNER | All bookings. Query: `date`, `courtId`, `userId`, `status`, pagination |
| GET | `/me/bookings` | CLIENT | Own bookings (upcoming + history), paginated. Query: `status`, `from`, `to`, pagination |
| GET | `/bookings/{id}` | OWNER, CLIENT* | Single booking (*client: only own) |
| POST | `/bookings` | OWNER, CLIENT | Create. Client books for self; owner books manually for any client |
| PATCH | `/bookings/{id}` | OWNER, CLIENT* | Reschedule: new date, slots and optionally court |
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

Create rules (`201` + the booking response below):
- Each slot must be one of the court's schedule slots for that weekday (same `start`/`end` as `GET /courts/{id}/availability` lists), and the slots must be consecutive (any order in the body). Otherwise `400` (e.g. `"12:00-13:00 is outside the schedule of court 3"`, `"Slots must be consecutive"`), also when the court has no schedule.
- A slot that has already started (or a past `date`) → `400`.
- A slot taken by a non-cancelled booking or a court block → `409` (`"07:00-08:00 is not available on court 3"`). Free/taken is the same computation as availability.
- Each slot's `price` is the schedule price at this moment (snapshot); `totalPrice` is their sum.
- `404` if the court does not exist — or, for a CLIENT, is inactive (an OWNER gets `400 "Court 3 is inactive"`) — or if an OWNER's `clientId` is not a client. An OWNER without `clientId` → `400`.
- An OWNER booking for an **inactive** client (one removed with `DELETE /users/{id}`, see Users) → `400` (`"Client 42 is inactive"`); nothing is booked. Reactivate the client first with `PATCH /users/{id} { "active": true }`. This rule is checked before the slots, so it wins over a `409`.

Booking response (also returned by `GET /bookings/{id}`, and as the items of the paginated lists):
```json
{
  "id": 5001,
  "courtId": 3,
  "courtName": "Court 3",
  "userId": 42,
  "userName": "Demo Client",
  "date": "2026-06-08",
  "status": "CONFIRMED",
  "totalPrice": 16.00,
  "createdAt": "2026-05-30T10:15:00Z",
  "slots": [ { "start": "07:00", "end": "08:00", "price": 16.00 } ]
}
```

`status`: `CONFIRMED`, `CANCELLED`, `COMPLETED`.

Each `slots[].price` is a snapshot of the court's slot price taken when the slot was booked; later schedule price changes never alter an existing booking. `totalPrice` is the sum of the slot prices. A cancelled booking is kept with status `CANCELLED`; only a `CONFIRMED` booking can be cancelled or rescheduled.

Listing and reading:
- `GET /bookings` (OWNER only; a CLIENT gets `403`): every client's bookings, filtered by any of `date`, `courtId`, `userId`, `status`.
- `GET /me/bookings` (CLIENT only; an OWNER gets `403`): only the caller's bookings, filtered by `status` and the inclusive date range `from`–`to`.
- Both are paginated and sorted by `date` descending (most recent first) unless `sort` is given.
- `GET /bookings/{id}`: the OWNER reads any booking; a CLIENT reads only their own — someone else's is `404`, the same as a missing one.

Cancel — `DELETE /bookings/{id}` → `204`. The booking is kept with status `CANCELLED` and its slots become free again.
- **Minimum notice (CLIENT):** a client may cancel only until **24 hours** before the booking starts (its first slot; configurable as `app.booking.cancel-min-notice-hours`). Exactly 24 hours before is still allowed. Later → `409`:
  ```json
  { "timestamp": "2026-06-07T08:00:00Z", "status": 409, "error": "Conflict", "message": "Bookings can only be cancelled or changed at least 24 hours before they start", "path": "/api/v1/bookings/5001" }
  ```
- The OWNER may cancel at any time.
- Only a `CONFIRMED` booking can be cancelled → otherwise `409` (`"Booking 5001 is CANCELLED"`).
- `404` if the booking does not exist or — for a CLIENT — is not theirs.

Reschedule — `PATCH /bookings/{id}` → `200` + the booking response. Body (replaces date and slots; `courtId` optional, omitted keeps the current court):
```json
{
  "courtId": 3,
  "date": "2026-06-09",
  "slots": [ { "start": "18:00", "end": "19:00" } ]
}
```
- Same slot rules and errors as create (`400` past / outside the schedule / not consecutive, `409` taken). The booking's own current slots count as free, so it can be shifted onto times that overlap itself.
- The new slots are priced at the current schedule price (a new snapshot).
- Same minimum-notice rule as cancel for a CLIENT, measured on the booking's current start; same `CONFIRMED`-only and `404` rules.
- Status changes are not made with `PATCH`: cancel with `DELETE`.

---

## Court blocks (maintenance) — `/api/v1/courts/{id}/blocks`

| Method | Path | Role | Purpose |
|---|---|---|---|
| GET | `/courts/{id}/blocks` | OWNER | Blocks for a court. Query: `from`, `to` (optional) |
| POST | `/courts/{id}/blocks` | OWNER | Create. Body: `{ date, start, end, reason? }` |
| DELETE | `/court-blocks/{id}` | OWNER | Remove block |

Blocks remove the covered slots from availability: a slot that overlaps a block (even partly) is not
free. Every endpoint here is OWNER-only (a CLIENT gets `403`); clients only see the effect on availability.

A block covers one time range of one day on one court (`start`/`end` are local times on `date`):
```json
{ "id": 9, "courtId": 3, "date": "2026-06-08", "start": "07:00", "end": "09:00", "reason": "Mantenimiento" }
```
`reason` is optional (`null` when not given).

List — `GET /courts/3/blocks?from=2026-06-01&to=2026-06-30` → `200` + an array of blocks (not paginated):
- Sorted by `date`, then `start`. `from`/`to` are optional and inclusive; without them every block of the
  court is returned, past ones included. `from` after `to` → `400`.
- `404` if the court does not exist (active or inactive courts can both be blocked).

Create — `POST /courts/3/blocks` → `201` + the block:
```json
{ "date": "2026-06-08", "start": "07:00", "end": "09:00", "reason": "Mantenimiento" }
```
- `date`, `start` and `end` are required (`HH:mm`); `reason` max 255. Otherwise `400` with `fieldErrors`.
- `end` must be after `start` → otherwise `400` (`"Block end must be after its start"`).
- Not in the past: the block must end after now (server clock) → otherwise `400`
  (`"Block 07:00-09:00 on 2026-06-08 is in the past"`). A block that has already started but not ended
  is fine (it blocks the rest of the range).
- **Overlap policy:** a block may not cover a `CONFIRMED` booking of that court — cancel or reschedule the
  booking first. Otherwise `409` (`"Block 07:00-09:00 overlaps booking 5001 (08:00-09:00) on court 3"`).
  Overlapping another block is allowed. Cancelled bookings do not count.
- `404` if the court does not exist.

Remove — `DELETE /court-blocks/{id}` → `204`; the covered slots become free again (unless booked or
covered by another block). `404` if the block does not exist.

---

## Users / clients — `/api/v1/users`

| Method | Path | Role | Purpose |
|---|---|---|---|
| GET | `/users` | OWNER | List clients. Query: `search`, pagination |
| GET | `/users/{id}` | OWNER | Single client |
| POST | `/users` | OWNER | Create client. Body: `{ name, email, password, phone? }` |
| PATCH | `/users/{id}` | OWNER | Update client. Body: any of `{ name, email, phone, active }` |
| DELETE | `/users/{id}` | OWNER | Remove client (deactivate if it has bookings) |
| GET | `/users/{id}/bookings` | OWNER | A client's bookings |

Self profile edits go through `/auth/me` (PATCH) rather than `/users/{id}`.

Every endpoint here is OWNER-only (a CLIENT gets `403`) and works on **clients only**: an OWNER account
is never listed, and `GET`/`PATCH`/`DELETE /users/{id}` of an owner id is `404`, the same as an
unknown id.

Client response (`GET /users/{id}`, `POST`, `PATCH`, and the items of `GET /users`):
```json
{ "id": 42, "name": "Ana López", "email": "ana@padel.test", "phone": "600000000", "active": true }
```
`phone` is `null` when not given. `active: false` means the client was removed but kept because it has
bookings; an inactive client cannot log in.

List — `GET /users?search=ana&page=0&size=20` → `200` + `PageResponse<Client>`:
- Active and inactive clients, sorted by `name` ascending unless `sort` is given.
- `search` (optional) matches clients whose name, email or phone contains it, ignoring case.

Create — `POST /users` → `201` + the client:
```json
{ "name": "Ana López", "email": "ana@padel.test", "password": "s3cret-pass", "phone": "600000000" }
```
- Same body and rules as `POST /auth/register`: `name` required, not blank, max 200; `email` required,
  a valid email; `password` required, 8–72 characters (the owner hands it to the client); `phone`
  optional, max 30. Otherwise `400` with `fieldErrors`.
- The account is always a `CLIENT` and starts active, whatever else the body contains.
- Emails are stored trimmed and lower-cased. An email any user already has → `409`
  (`"Email ana@padel.test is already registered"`).

Update — `PATCH /users/{id}` → `200` + the client. Only the fields present change:
```json
{ "phone": "611111111" }
```
- `name` must not be blank (max 200), `email` must be a valid email, `phone` max 30 (`""` clears it),
  `active: true` reactivates a removed client. Otherwise `400` with `fieldErrors`.
- Changing `email` to one another user already has → `409` (same message as create). Keeping the
  client's own email is fine.
- The password and the role cannot be changed here.

Remove — `DELETE /users/{id}` → `204`:
- A client with bookings (any status) is **soft-deleted**, like courts: it becomes `active: false` and
  its bookings are kept. Removing an already inactive client is also `204`.
- A client without bookings is deleted for good.

A client's bookings — `GET /users/{id}/bookings?page=0&size=20` → `200` + `PageResponse<Booking>` (items are
the booking response of *Bookings*):
- Every booking of that client, any status (`CONFIRMED`, `CANCELLED`, `COMPLETED`), also for an inactive client.
- Most recent first (`date` desc, then `id` desc) unless `sort` is given — the same order as `GET /bookings`.
- `404` if the id does not exist or is not a client (`"Client 7 not found"`); a CLIENT gets `403`.

---

## Dashboard — `/api/v1/dashboard`

| Method | Path | Role | Purpose |
|---|---|---|---|
| GET | `/dashboard/summary` | OWNER | Today's snapshot: active courts, bookings today and in the next 7 days, today's occupancy and revenue |

Summary — `GET /dashboard/summary` → `200`. No query parameters; a CLIENT gets `403`.
```json
{
  "date": "2026-06-08",
  "activeCourts": 4,
  "bookingsToday": 12,
  "upcomingBookings": 37,
  "occupancyRate": 41.7,
  "revenueToday": 192.00
}
```
- `date` (date): today by the server clock — the day the "today" figures refer to.
- `activeCourts` (integer): courts with `active = true`.
- `bookingsToday` (integer): `CONFIRMED` bookings dated today, on any court, whether their slots have started or not.
- `upcomingBookings` (integer): `CONFIRMED` bookings dated in the next 7 days — tomorrow through today + 7
  (today is `bookingsToday`).
- `occupancyRate` (number, percentage `0`–`100`, one decimal): share of today's bookable slots on active courts
  taken by a booking. Bookable slots are the court's schedule slots for today (the grid of
  `GET /courts/{id}/availability`) minus those covered by a court block; a court without a schedule adds none.
  A slot is taken by a non-cancelled booking, the same rule as availability. `0` when nothing is bookable today.
- `revenueToday` (money): sum of the slot price snapshots (`slots[].price`) of today's `CONFIRMED` bookings.

---

## Out of MVP scope (future resources)

Optional features would add their own resources without changing the above: `/payments`, `/reviews`, `/notifications`, multi-venue (`/venues`). The contract is designed so these extend rather than break it.
