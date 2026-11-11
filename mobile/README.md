# padel-mobile — client app

Ionic + Angular app for the **CLIENT** actor of padel-reservas. It talks to the REST API
(`/api/v1`) specified in `../docs/api.md`, which is the source of truth for every model and
endpoint here.

> Scaffold: feature facade methods (except `BookingFacade.createBooking`) are TODO stubs that throw
> `TODO: … — see docs/api.md#<section>`. Auth (login, registration, token refresh), API services, the JWT
> interceptor, the client guard, token storage and booking from a slot are implemented and tested.

## Run

```bash
npm install
npm start           # ng serve → http://localhost:4200
npm test            # Vitest (ng test)
npm run test:ci     # single run, no watch (used by CI)
npm run build       # → www/ (Capacitor webDir)
npm run lint
```

## Environments (where the API is)

`apiBaseUrl` comes from `src/environments/`, swapped at build time by `angular.json`:

| File | Used by | `apiBaseUrl` |
|---|---|---|
| `environment.ts` | `npm start` (browser, `ng serve`) and tests | `http://localhost:8080/api/v1` |
| `environment.prod.ts` | `npm run build` (production, browser) | `http://localhost:8080/api/v1` |
| `environment.android.ts` | `npm run build:android` (Android emulator) | `http://10.0.2.2:8080/api/v1` |

`10.0.2.2` is the Android emulator's alias for the host machine (inside the emulator `localhost` is the
emulator itself). For a **physical phone**, put the host's LAN IP (e.g. `http://192.168.1.20:8080/api/v1`) in
`environment.android.ts` and add that IP to `android/app/src/main/res/xml/network_security_config.xml`.

## Android (Capacitor)

The native project lives in `android/` (Capacitor 8, app id `com.g02.padelreservas`, name "Pádel Reservas",
web assets from `www/`). Generated files (`build/`, `.gradle/`, `local.properties`, the copied web assets
`app/src/main/assets/public`, `capacitor.config.json`) are ignored by `android/.gitignore`; re-create them with a sync.

| Script | Does |
|---|---|
| `npm run build:android` | `ng build` (production) with `environment.android.ts` → `www/` |
| `npm run android:sync` | `build:android` + `npx cap sync android` (copies `www/` and plugins into `android/`) |
| `npm run android:open` | `android:sync` + opens the project in Android Studio |
| `npm run android:run` | `android:sync` + builds, installs and launches on a running emulator/device (`npx cap run android`) |

### First time (local machine)

1. Install **Android Studio** (it brings the Android SDK and a JDK). In *SDK Manager* install an Android SDK
   Platform (API 36, the `compileSdkVersion`) and the *Android SDK Platform-Tools*.
2. In *Device Manager* create an **AVD** (virtual device), e.g. a Pixel with a recent Google APIs image, and start it.
3. Make the SDK findable from the terminal (for `npx cap run android`), e.g. on Linux/macOS:
   `export ANDROID_HOME=$HOME/Android/Sdk` (macOS: `$HOME/Library/Android/sdk`).

### Each time

```bash
# 1. backend on the host, allowing the WebView origin (http://localhost, no port) in CORS
cd backend
CORS_ALLOWED_ORIGINS=http://localhost,http://localhost:4200 ./mvnw spring-boot:run

# 2. app on the running emulator
cd mobile
npm install
npm run android:run        # or: npm run android:open, then ▶ Run in Android Studio
```

Why the extra settings: the WebView is served from `http://localhost` (`server.androidScheme: 'http'` in
`capacitor.config.ts`) so it may call the plain-HTTP backend, and
`android/app/src/main/res/xml/network_security_config.xml` allows cleartext only to `10.0.2.2`/`localhost`. Both are
for development; a release build should use an HTTPS API, `androidScheme: 'https'` and no cleartext exception.

iOS is not set up (`npx cap add ios` needs macOS + Xcode).

## Stack

| Choice | How |
|---|---|
| Ionic 9 + Angular 22, 100 % standalone | `bootstrapApplication(AppComponent, appConfig)`; Ionic components imported per component from `@ionic/angular`. No NgModules. |
| Zoneless | `provideZonelessChangeDetection()` in `app.config.ts`; `polyfills: []`. `zone.js` is **not installed**: it is an *optional* peer dependency of `@ionic/angular` 9, and Ionic's `NgZone.run()` calls become plain calls without zone. Verified in a browser: forms, navigation, tabs and `ion-datetime` update with `window.Zone` undefined. |
| Signals for state | Facades keep private `signal()`s and expose read-only signals / `computed()`. Pages read them in templates; route params arrive as signal `input()`s (`withComponentInputBinding`). |
| Ionic UI | `ion-tabs` shell, `ion-datetime` (date picker, `es-ES`, min = today), `ion-select`, `ion-list`/`ion-item`, `ion-card`, `ion-button`, `AlertController`, `ToastController`. Tabbed pages refresh in `ionViewWillEnter` (Ionic keeps them alive). |
| Capacitor 8 | `capacitor.config.ts` (`com.g02.padelreservas`, `webDir: www`); native Android project in `android/`. |
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
│   ├── auth.facade.ts              auth use cases (register, login, refreshToken, loadCurrentUser, logout) + session signals: currentUser, role, isClient
│   ├── jwt.interceptor.ts          functional: Authorization: Bearer <token> (API host only); on 401 refreshes once and retries
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
`auth` feature has only pages; they use the core `AuthFacade` (page → `AuthFacade` → `AuthApi`).

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
| auth | `AuthFacade` (core) | `register` (always CLIENT, then logs in), `login` (CLIENT only), `refreshToken`, `loadCurrentUser`, `logout` | `POST /auth/register`, `/auth/login`, `/auth/refresh`, `GET /auth/me` |
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
