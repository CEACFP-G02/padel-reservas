#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "$0")/config.sh"
gcloud auth login
gcloud config set project "$GCP_PROJECT"
gcloud services enable run.googleapis.com sqladmin.googleapis.com artifactregistry.googleapis.com cloudbuild.googleapis.com
gcloud sql instances create "$SQL_INSTANCE" --database-version=POSTGRES_16 --cpu=1 --memory=4GB --region="$REGION"
gcloud sql databases create "$DB_NAME" --instance="$SQL_INSTANCE"
gcloud sql users create "$DB_USER" --instance="$SQL_INSTANCE" --password="$DB_PASSWORD"
npm install -g firebase-tools
firebase login
firebase use --add "$FIREBASE_PROJECT"
keytool -genkeypair -v -keystore mobile/android/padel-release.keystore -alias padel -keyalg RSA -keysize 2048 -validity 10000
echo "Rellena mobile/android/key.properties con las claves del keystore."
