import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthFacade } from './auth.facade';

/** Only the OWNER role may enter the admin panel; everyone else goes to /login. */
export const ownerGuard: CanActivateFn = (_route, state) => {
  if (inject(AuthFacade).isOwner()) {
    return true;
  }
  return inject(Router).createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
};
