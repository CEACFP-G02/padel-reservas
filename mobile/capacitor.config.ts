import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.g02.padelreservas',
  appName: 'Pádel Reservas',
  // Angular build output (angular.json → outputPath.base, browser: '').
  webDir: 'www',
  server: {
    // Serve the WebView from http://localhost (not the default https://localhost). That one origin works in both
    // places: on the emulator it may call the local plain-HTTP backend (http://10.0.2.2:8080) without being blocked
    // as mixed content, and in production it calls the HTTPS Cloud Run API, which an http origin is always allowed
    // to do. Cleartext is permitted only for 10.0.2.2 and localhost (android/app/src/main/res/xml/
    // network_security_config.xml); every other host, the API included, must be HTTPS.
    androidScheme: 'http',
  },
};

export default config;
