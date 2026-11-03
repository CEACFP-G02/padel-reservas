# padel-mobile — client app

Ionic + Angular app for the **CLIENT** actor of padel-reservas. It talks to the REST API
(`/api/v1`) specified in `../docs/api.md`, which is the source of truth for every model and
endpoint here.

> Scaffold: facade methods (except `BookingFacade.createBooking`) and the `AuthService`
> login/register/refresh flows are TODO stubs that throw `TODO: … — see docs/api.md#<section>`. API services, the JWT interceptor, the
> client guard, token storage and booking from a slot are implemented and tested.

## Run

```bash
npm install
npm start           # ng serve → http://localhost:4200
npm test            # Vitest (ng test)
npm run test:ci     # single run, no watch (used by CI)
npm run build       # → www/ (Capacitor webDir)
npm run lint
```

`apiBaseUrl` is in `src/environments/environment*.ts` (default `http://localhost:8080/api/v1`).

Native shells (not generated yet):

```bash
npx cap add android   # needs Android Studio / SDK to build
npx cap add ios       # needs macOS + Xcode
npm run build && npx cap sync
```

On a device, `localhost` is the phone itself; point `apiBaseUrl` at the host machine's LAN IP
(or `10.0.2.2` for the Android emulator).

## Stack

| Choice | How |
|---|---|
| Ionic 9 + Angular 22, 100 % standalone | `bootstrapApplication(AppComponent, appConfig)`; Ionic components imported per component from `@ionic/angular`. No NgModules. |
| Zoneless | `provideZonelessChangeDetection()` in `app.config.ts`; `polyfills: []`. `zone.js` is **not installed**: it is an *optional* peer dependency of `@ionic/angular` 9, and Ionic's `NgZone.run()` calls become plain calls without zone. Verified in a browser: forms, navigation, tabs and `ion-datetime` update with `window.Zone` undefined. |
| Signals for state | Facades keep private `signal()`s and expose read-only signals / `computed()`. Pages read them in templates; route params arrive as signal `input()`s (`withComponentInputBinding`). |
| Ionic UI | `ion-tabs` shell, `ion-datetime` (date picker, `es-ES`, min = today), `ion-select`, `ion-list`/`ion-item`, `ion-card`, `ion-button`, `AlertController`, `ToastController`. Tabbed pages refresh in `ionViewWillEnter` (Ionic keeps them alive). |
| Capacitor 8 | `capacitor.config.ts` (`com.g02.padel`, `webDir: www`). |
| HTTP | `provideHttpClient(withInterceptors([jwtInterceptor]))`, typed `HttpClient`. |
| Tests | Vitest via `@angular/build:unit-test` (jsdom). `src/test-setup.ts` polyfills `matchMedia` and `IntersectionObserver` for Ionic components. |

Tokens are kept in `localStorage` (synchronous, so the guard works on cold start). Moving to
`@capacitor/preferences` would need an async app initializer.

## Structure

```
src/app/
├── app.config.ts / app.routes.ts   providers + top-level routes
├── core/auth/
│   ├── auth.api.ts                 POST /auth/register | /login | /refresh
│   ├── auth.service.ts             session as signals: currentUser, role, isClient; register/login/refreshToken/logout
│   ├── jwt.interceptor.ts          functional: Authorization: Bearer <token> (API host only)
│   ├── client.guard.ts             functional CanActivate: role CLIENT, else /login?returnUrl=…
│   └── token-storage.ts            localStorage + JWT payload decoding
├── shared/
│   ├── models/                     interfaces + enums from docs/api.md (User, Court, AvailabilityResponse, SlotResponse, Booking, BookingSlot, PageResponse<T>, Role, CourtType, BookingStatus)
│   ├── ui/                         tabs.page (shell), booking-status-badge, empty-state
│   └── util/                       toIsoDate, toHttpParams, todo()
├── testing/                        test helpers (fakeJwt)
└── features/<feature>/
    ├── <feature>.api.ts (+ spec)   typed HttpClient calls
    ├── <feature>.facade.ts (+ spec) ONE method per CLIENT use case; state in signals
    ├── <feature>.routes.ts         lazy child routes
    └── pages/                      standalone Ionic pages
```

**Dependency rule:** `page → facade → api → HttpClient`. Pages never inject an `*Api`. The
`auth` feature has only pages; it uses the core `AuthService`.

## Routes

`/login` and `/register` are public. `/tabs/**` is behind `clientGuard`. `/` redirects to
`/tabs/availability`.

| Tab | Path | Feature |
|---|---|---|
| Reservar | `/tabs/availability` (+ `/courts`, `/courts/:id`) | availability, court |
| Mis reservas | `/tabs/bookings`, `/tabs/bookings/:id` | booking |
| Perfil | `/tabs/profile` | profile |

## Use cases (CLIENT) → facade methods

Each method maps 1:1 to a CLIENT use case in the T3 use-case diagram.

| Feature | Facade | Methods | Endpoints |
|---|---|---|---|
| auth | `AuthService` (core) | `register`, `login` (+ `refreshToken`, `logout`) | `POST /auth/register`, `/auth/login`, `/auth/refresh` |
| availability | `AvailabilityFacade` | `getAvailability` | `GET /availability?date=&courts=` |
| court | `CourtFacade` | `listCourts`, `getCourt` | `GET /courts`, `/courts/{id}` |
| booking | `BookingFacade` | `createBooking`, `getMyBookings`, `getBooking`, `cancelBooking` | `POST /bookings`, `GET /me/bookings`, `GET /bookings/{id}`, `DELETE /bookings/{id}` |
| profile | `ProfileFacade` | `getCurrentUser`, `updateProfile` | `GET /auth/me`, `PATCH /auth/me` |

The headline screen (Reservar) sends `date` + `courts` and renders either the free `slots` or,
when `available=false`, the `alternativeDays`. The ±7-day window is computed server-side.

## Open points against docs/api.md

Both earlier gaps are resolved by the refined contract:

- **Booking from a slot:** each availability slot lists the `courtIds` free in it. "Reservar" sends
  `POST /bookings` with one of them as `courtId`: directly when only one court is free, otherwise the
  user picks it in an `ion-alert` (`AvailabilitySearchPage.book`). The server never auto-assigns a court.
- **Response shapes:** the booking response (`courtName`, `userId`, `totalPrice`, `createdAt`,
  per-slot `price`) is specified, and `/me/bookings` is paginated (`PageResponse<Booking>`, `page`/`size`/`sort`).
