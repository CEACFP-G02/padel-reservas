# shared

Cross-cutting code used by every feature. No use cases live here.

- `enums/` — `Role`, `CourtType`, `BookingStatus` (persisted as `VARCHAR`).
- `exception/` — `NotFoundException` (404), `SlotNotAvailableException` (409) and
  `GlobalExceptionHandler`, which returns a uniform `ErrorResponse` body. While scaffolding,
  use-case stubs throw `UnsupportedOperationException`, mapped to **501 Not Implemented**.
- `config/` — `SecurityConfig` (stateless JWT, BCrypt), `CorsConfig`, `OpenApiConfig`
  (Swagger UI at `/swagger-ui.html`).
- `security/` — `JwtService` and `JwtAuthenticationFilter`.
