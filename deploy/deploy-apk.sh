#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "$0")/config.sh"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT/mobile"
npm ci
npx ng build --configuration production
npx cap sync android
cd android
./gradlew assembleRelease
APK="app/build/outputs/apk/release/app-release.apk"
PUB="$(find "$ROOT/web/dist" -maxdepth 3 -name index.html -printf '%h\n' | head -1)"
cp "$APK" "$PUB/padel-reservas.apk"
cd "$ROOT/web"
firebase deploy --only hosting --project "$FIREBASE_PROJECT"
echo "APK: https://${FIREBASE_PROJECT}.web.app/padel-reservas.apk"
