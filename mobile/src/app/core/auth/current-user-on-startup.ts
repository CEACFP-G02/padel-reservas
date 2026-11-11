import { EnvironmentProviders, inject, provideAppInitializer } from '@angular/core';

import { AuthFacade } from './auth.facade';

/**
 * Restores the profile (name, email) of a stored session at startup, so it shows after the app is reopened and
 * not only right after login. Does not block bootstrap; a failed request is left to the interceptor and guard.
 */
export function provideCurrentUserOnStartup(): EnvironmentProviders {
  return provideAppInitializer(() => {
    const auth = inject(AuthFacade);
    if (auth.isAuthenticated()) {
      auth.loadCurrentUser().catch(() => undefined);
    }
  });
}
