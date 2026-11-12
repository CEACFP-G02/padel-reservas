#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "$0")/config.sh"
cd "$(dirname "$0")/../web"
npm ci
npx ng build --configuration production
firebase deploy --only hosting --project "$FIREBASE_PROJECT"
echo "Panel: https://${FIREBASE_PROJECT}.web.app"
