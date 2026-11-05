import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthFacade } from './auth.facade';

/** Only CLIENT users may use the app; everyone else goes to /login. */
export const clientGuard: CanActivateFn = (_route, state) => {
  if (inject(AuthFacade).isClient()) {
    return true;
  }
  return inject(Router).createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
};
