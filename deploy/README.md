# Deployment

Scripts to deploy Pádel-Reservas to Google Cloud and Firebase.

## Stack

| Part | Where it runs |
|---|---|
| Admin panel (`web/`, OWNER) | **Firebase Hosting** — `https://<FIREBASE_PROJECT>.web.app` |
| Backend (`backend/`) | **Cloud Run** (service `SERVICE`), built from source, talking to **Cloud SQL** (PostgreSQL 16) through the Cloud SQL socket factory |
| Client app (`mobile/`, CLIENT) | A **signed release APK**, hosted on the same Firebase Hosting site at `/padel-reservas.apk`. It is **not** published on Google Play: clients download and install it directly. |

The backend reads its settings from environment variables set by `deploy-backend.sh`: `DB_URL`, `DB_USER`,
`DB_PASSWORD`, `JWT_SECRET` and `CORS_ALLOWED_ORIGINS` (see `backend/src/main/resources/application.yml`).

## Run order

Run every script from the repository root (e.g. `./deploy/deploy-backend.sh`).

1. **Configure.** `cp deploy/config.example.sh deploy/config.sh` and edit `deploy/config.sh`: project, region,
   database password and `JWT_SECRET`. `JWT_SECRET` is a **Base64-encoded** HMAC key of at least 256 bits, e.g.
   `openssl rand -base64 48`.
2. **One-time setup.** `./deploy/00-setup-once.sh`: logs in to gcloud, enables the APIs, creates the Cloud SQL
   instance, database and user, installs and logs in to the Firebase CLI, and creates the release keystore
   `mobile/android/padel-release.keystore`. Then create `mobile/android/key.properties`:
   ```properties
   storeFile=padel-release.keystore
   storePassword=...
   keyAlias=padel
   keyPassword=...
   ```
   (`storeFile` is relative to `mobile/android/`.)
3. **Backend.** `./deploy/deploy-backend.sh` deploys to Cloud Run and prints the service URL. Flyway creates the
   schema on the first start. Then copy that URL:
   - into `deploy/config.sh` as `API_URL`;
   - into `web/src/environments/environment.prod.ts` and `mobile/src/environments/environment.prod.ts`, replacing
     `REPLACE_WITH_CLOUD_RUN_URL` (keep the `/api/v1` suffix).
4. **Admin panel.** `./deploy/deploy-web.sh` builds `web/` for production and deploys it to Firebase Hosting.
5. **Client app.** `./deploy/deploy-apk.sh` builds `mobile/` for production, builds the signed release APK, copies
   it into the web build output and redeploys Hosting, which serves it as
   `application/vnd.android.package-archive`. Run it after `deploy-web.sh`, since it publishes into that build.

## Secrets

These files hold secrets and are **gitignored**. Never commit them:

- `deploy/config.sh` (database password, JWT secret);
- `mobile/android/key.properties` (keystore passwords);
- `*.keystore` (the release signing key). Keep a safe copy: an APK signed with another key cannot update an
  installed app.

`deploy/config.example.sh` is the committed template for `deploy/config.sh`.
