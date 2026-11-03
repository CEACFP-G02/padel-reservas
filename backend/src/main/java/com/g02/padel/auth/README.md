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
