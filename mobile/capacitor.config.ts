import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.g02.padelreservas',
  appName: 'Pádel Reservas',
  // Angular build output (angular.json → outputPath.base, browser: '').
  webDir: 'www',
  server: {
    // Serve the WebView from http://localhost instead of the default https://localhost, so calls to the backend over
    // plain HTTP (http://10.0.2.2:8080 in the emulator) are not blocked as mixed content. Cleartext itself is allowed
    // only for 10.0.2.2/localhost (android/app/src/main/res/xml/network_security_config.xml). Use 'https' for a
    // release that talks to an HTTPS API.
    androidScheme: 'http',
  },
};

export default config;
