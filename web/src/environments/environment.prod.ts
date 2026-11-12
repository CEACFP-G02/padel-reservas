// `ng build` (production) replaces environment.ts with this file. Replace the host with the Cloud Run URL
// printed by deploy/deploy-backend.sh (see deploy/README.md).
export const environment = {
  production: true,
  apiBaseUrl: 'https://REPLACE_WITH_CLOUD_RUN_URL/api/v1',
};
