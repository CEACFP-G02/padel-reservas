import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';

import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

/** Adds `Authorization: Bearer <token>` to requests sent to our API only. */
export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const token = inject(AuthService).accessToken();
  if (!token || !req.url.startsWith(environment.apiBaseUrl)) {
    return next(req);
  }
  // TODO: on 401, AuthService.refreshToken() once and retry — see docs/api.md#auth--apiv1auth
  return next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
};
