# auth

Registration, login and token handling. No own repository: uses `UserRepository`,
`JwtService` (`shared/security`) and the BCrypt `PasswordEncoder`.

Base path: `/api/v1/auth`

| Use case | Class | Endpoint | Access |
|---|---|---|---|
| Register client | `RegisterClientUseCase` | `POST /register` | public |
| Login | `LoginUseCase` | `POST /login` | public |
| Refresh token | `RefreshTokenUseCase` | `POST /refresh` | public |
| Get current user | `GetCurrentUserUseCase` | `GET /me` | authenticated |
| Update own profile | `UpdateProfileUseCase` | `PATCH /me` (name, phone) | authenticated |

Contract details: `docs/api.md`.

Rules:
- Self-registration always creates a `CLIENT` (any `role` in the body is ignored). `OWNER` accounts
  are provisioned separately, never through `/register`.
- Emails are stored and matched trimmed and lower-cased; a duplicate email → **409 Conflict**.
- Login failures (unknown email, wrong password, inactive user) all answer **401** with the same
  message, `Invalid email or password`.
- `/refresh` accepts only a valid refresh token of a still-active user and returns a new access
  token; refresh tokens are not accepted as `Bearer` credentials.
