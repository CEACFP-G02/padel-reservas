# padel-backend — REST API

Spring Boot 3.3 REST API (Java 21, Maven) for padel-reservas. It serves the admin panel
(`../web`, OWNER) and the client app (`../mobile`, CLIENT) under `/api/v1`. The contract is
specified in `../docs/api.md`, the single source of truth for every endpoint and DTO.

## Requirements

- JDK 21
- PostgreSQL 14+ (local install or Docker)
- Docker, to run the tests: `FlywayPostgresIntegrationTest` starts a throwaway PostgreSQL with
  Testcontainers

Maven itself is not required: use the bundled wrapper (`./mvnw`).

## Run

```bash
# 1. Start a local PostgreSQL (matches the defaults in application.yml)
docker run -d --name padel-db -p 5432:5432 \
  -e POSTGRES_DB=padel -e POSTGRES_USER=padel -e POSTGRES_PASSWORD=padel postgres:16-alpine

# 2. Run the API → http://localhost:8080 (Swagger UI at /swagger-ui.html)
./mvnw spring-boot:run

# Tests (JUnit 5 + Mockito)
./mvnw test

# Package
./mvnw package   # → target/padel-backend-0.0.1-SNAPSHOT.jar
```

Flyway applies `src/main/resources/db/migration` (`V1__init.sql`, `V2__align_with_api_contract.sql`)
on startup; Hibernate only validates the schema (`ddl-auto=validate`). Never edit an applied
migration — add a new `V<n>__<description>.sql` instead.

## Configuration

| Variable | Default | Purpose |
|---|---|---|
| `DB_URL` | `jdbc:postgresql://localhost:5432/padel` | JDBC URL |
| `DB_USER` / `DB_PASSWORD` | `padel` / `padel` | DB credentials |
| `JWT_SECRET` | dev-only key | Base64 HMAC key (≥ 256 bits) — always override outside local dev |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:5173,http://localhost:3000` | Allowed browser origins |

## Structure

Package by feature, layered within, with an explicit use-case layer:
`Controller → usecase/<UseCase> → Repository`, DTOs (`dto/`) separate from JPA entities.

```
src/main/java/com/g02/padel/
├── PadelApplication.java
├── auth/          login, register, refresh, current user
├── user/          clients (OWNER management)
├── court/         courts
├── schedule/      per-court schedule + opening hours
├── availability/  computed free slots (schedule − bookings − blocks)
├── booking/       bookings + booking slots
├── courtblock/    maintenance blocks
├── dashboard/     OWNER summary
└── shared/        config/, security/, exception/, enums/, web/ (cross-cutting)
```

Each feature folder has its own `README.md` listing its use cases and endpoints.
