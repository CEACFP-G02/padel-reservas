import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.g02.padelreservas',
  appName: 'Pádel Reservas',
  // Angular build output (angular.json → outputPath.base, browser: '').
  webDir: 'www',
  server: {
    // Release: the WebView is served from https://localhost so calls to the HTTPS Cloud Run API are not mixed
    // content. For the emulator against a plain-HTTP local backend (npm run build:android → http://10.0.2.2:8080),
    // switch this to 'http' locally; cleartext is allowed only for 10.0.2.2/localhost
    // (android/app/src/main/res/xml/network_security_config.xml).
    androidScheme: 'https',
  },
};

export default config;
