# padel-web — admin panel

Angular admin panel for the **OWNER** actor of padel-reservas. It talks to the REST API in
`../backend` (`/api/v1`). The API contract is specified in `docs/api.md`.

> Scaffold only: facade methods and auth flows are TODO stubs that throw
> `TODO: … — see docs/api.md#<section>`. API services contain the typed HTTP calls (tested against the contract).

## Run

```bash
npm install
npm start          # ng serve → http://localhost:4200
npm test           # Vitest (ng test)
npm run test:ci    # single run, no watch (used by CI)
npm run build
```

The API base URL is set in `src/environments/environment*.ts` (`apiBaseUrl`, default
`http://localhost:8080/api/v1`).

## Stack

| Choice | How |
|---|---|
| Angular 22, 100 % standalone | No NgModules; `bootstrapApplication` + `app.config.ts`. |
| Zoneless | `provideZonelessChangeDetection()` in `app.config.ts`; `zone.js` is not installed or polyfilled. Change detection is driven by signals, inputs and events. Don't rely on zone-patched async APIs to refresh the view. |
| Signals for state | Facades keep private `signal()`s and expose read-only signals / `computed()`. Pages read them in templates. Route params come in as signal `input()`s (`withComponentInputBinding`) and `effect()`s react to them. |
| Angular Material (M3) | Added with `ng add @angular/material` (azure-blue theme, Roboto typography). Shell = `mat-sidenav` + `mat-toolbar`; lists use `mat-table`; forms use `mat-form-field`/`mat-datepicker`; create/edit uses `mat-dialog`; feedback uses `mat-snackbar`. |
| HTTP | `provideHttpClient(withInterceptors([jwtInterceptor]))`, typed `HttpClient` calls. |
| Tests | Vitest via `@angular/build:unit-test` (the Angular CLI default). |

## Structure

```
src/app/
├── app.config.ts / app.routes.ts   providers + top-level lazy routes
├── core/                           app-wide singletons
│   └── auth/
│       ├── auth.service.ts         session as signals: accessToken, currentUser, role, isOwner; login/refreshToken/logout
│       ├── jwt.interceptor.ts      functional interceptor: Authorization: Bearer <token>
│       ├── owner.guard.ts          functional CanActivate: role OWNER, else /login?returnUrl=…
│       └── token-storage.ts        localStorage + JWT payload decoding
├── shared/
│   ├── models/                     interfaces + enums mirroring the API DTOs (Role, CourtType, BookingStatus, …)
│   ├── ui/shell, ui/nav-list       authenticated layout and side navigation
│   └── util/                       todo() stub marker, toIsoDate(), toHttpParams()
├── testing/                        spec helpers (setUpHttp, pageOf, fixtures)
└── features/<feature>/
    ├── <feature>.api.ts            typed HttpClient calls to the REST endpoints
    ├── <feature>.facade.ts         ONE method per OWNER use case; state in signals
    ├── <feature>.facade.spec.ts    stub spec (it.todo per use case)
    ├── <feature>.routes.ts         lazy child routes (loadComponent)
    └── pages/                      standalone Material page/dialog components
```

**Dependency rule:** `page → facade → api → HttpClient`. Components never inject an `*Api`
service. Facades are the only place that changes feature state.

## Routes

`/login` is public. Everything else renders inside the shell, behind `ownerGuard`. `/`
redirects to `/dashboard`.

| Path | Feature |
|---|---|
| `/dashboard` | dashboard |
| `/availability` | availability (calendar + occupancy grid) |
| `/bookings`, `/bookings/:id` | booking |
| `/courts`, `/courts/:id` | court |
| `/courts/:courtId/schedule` | schedule |
| `/courts/:courtId/blocks` | courtblock |
| `/clients`, `/clients/:id` | user |

## Use cases (OWNER) → facade methods

Each facade method maps 1:1 to a use case of the OWNER actor in the T3 use-case diagram.

| Feature | Facade | Methods | Endpoints |
|---|---|---|---|
| auth | `AuthService` (core, via `AuthApi`) | `login`, `refreshToken`, `loadCurrentUser`, `updateProfile`, `logout`, `currentUser` (signal) | `POST /auth/login`, `POST /auth/refresh`, `GET`/`PATCH /auth/me` |
| court | `CourtFacade` | `listCourts`, `getCourt`, `createCourt`, `updateCourt`, `deactivateCourt` | `GET /courts` (paged), `GET /courts/{id}`, `POST /courts`, `PATCH /courts/{id}`, `DELETE /courts/{id}` |
| schedule | `ScheduleFacade` | `getSchedule`, `updateSchedule` | `GET`/`PUT /courts/{id}/schedule` |
| booking | `BookingFacade` | `listBookings`, `getBooking`, `createBooking` (manual), `cancelBooking`, `rescheduleBooking` | `GET /bookings` (paged), `GET /bookings/{id}`, `POST /bookings`, `DELETE /bookings/{id}`, `PATCH /bookings/{id}` |
| availability | `AvailabilityFacade` | `getCourtDayAvailability` | `GET /courts/{id}/availability` (`AvailabilityApi.search` wraps `GET /availability`) |
| courtblock | `CourtBlockFacade` | `listBlocks`, `createBlock`, `removeBlock` | `GET`/`POST /courts/{id}/blocks`, `DELETE /court-blocks/{id}` |
| user | `UserFacade` | `listClients`, `getClient`, `createClient`, `updateClient`, `deleteClient`, `listClientBookings` | `GET /users` (paged), `GET /users/{id}`, `POST /users`, `PATCH /users/{id}`, `DELETE /users/{id}`, `GET /users/{id}/bookings` (paged) |
| dashboard | `DashboardFacade` | `getDashboardSummary` | `GET /dashboard/summary` |

Paginated lists come back as `PageResponse<T>` (`content`, `page`, `size`, `totalElements`, `totalPages`) and
take `page`/`size`/`sort`; list facades keep the metadata in a `page` signal for `mat-paginator`. Times are `HH:mm`.
