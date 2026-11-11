// `ng build --configuration android` (npm run build:android) replaces environment.ts with this file.
// 10.0.2.2 is the Android emulator's alias for the host machine, where the backend runs on :8080.
export const environment = {
  production: true,
  apiBaseUrl: 'http://10.0.2.2:8080/api/v1',
};
