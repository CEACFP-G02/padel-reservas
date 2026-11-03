import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from './auth.service';

/** Only the OWNER role may enter the admin panel; everyone else goes to /login. */
export const ownerGuard: CanActivateFn = (_route, state) => {
  if (inject(AuthService).isOwner()) {
    return true;
  }
  return inject(Router).createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
};
