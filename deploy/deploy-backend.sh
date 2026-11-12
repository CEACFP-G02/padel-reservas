#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "$0")/config.sh"
cd "$(dirname "$0")/../backend"
gcloud run deploy "$SERVICE" --source . --region "$REGION" --project "$GCP_PROJECT" --allow-unauthenticated --add-cloudsql-instances "$SQL_CONN" --set-env-vars "^##^DB_URL=jdbc:postgresql:///${DB_NAME}?cloudSqlInstance=${SQL_CONN}&socketFactory=com.google.cloud.sql.postgres.SocketFactory##DB_USER=${DB_USER}##DB_PASSWORD=${DB_PASSWORD}##JWT_SECRET=${JWT_SECRET}##CORS_ALLOWED_ORIGINS=https://${FIREBASE_PROJECT}.web.app,${APP_ORIGIN}"
echo "URL del backend:"; gcloud run services describe "$SERVICE" --region "$REGION" --format='value(status.url)'
