# padel-reservas
Sistema de reserva de pistas de pádel: API REST, panel web y app móvil. Proyecto DAM · G02.

## Componentes

| Carpeta | Qué es | Stack | Cómo instalar y ejecutar |
|---|---|---|---|
| [`backend/`](backend/) | API REST | Java 21, Spring Boot 3.3, PostgreSQL, Flyway | [backend/README.md](backend/README.md) |
| [`web/`](web/) | Panel de administración (rol `OWNER`) | Angular (standalone, zoneless, signals), Angular Material | [web/README.md](web/README.md) |
| [`mobile/`](mobile/) | App de cliente (rol `CLIENT`) | Ionic + Angular, Capacitor | [mobile/README.md](mobile/README.md) |
| [`docs/`](docs/) | Documentación | — | [docs/api.md](docs/api.md) — contrato de la API (fuente de verdad) |

## Arranque rápido

```bash
# Backend (requiere JDK 21 y PostgreSQL; ver backend/README.md)
cd backend && ./mvnw spring-boot:run      # http://localhost:8080/api/v1

# Panel web
cd web && npm install && npm start        # http://localhost:4200

# App móvil
cd mobile && npm install && npm start     # http://localhost:4200
```

## Tests

```bash
cd backend && ./mvnw test
cd web && npm test
cd mobile && npm test
```

La integración continua ([`.github/workflows/ci.yml`](.github/workflows/ci.yml)) ejecuta estas tres suites en cada push y pull request.
