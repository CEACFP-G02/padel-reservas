import { HttpErrorResponse, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, from, switchMap, throwError } from 'rxjs';

import { environment } from '../../../environments/environment';
import { AuthFacade } from './auth.facade';

const AUTH_URL = `${environment.apiBaseUrl}/auth/`;

/**
 * Adds `Authorization: Bearer <access token>` to requests sent to our API. On a 401 it refreshes the access
 * token once and retries; if the refresh fails the facade signs out and the original 401 is propagated.
 */
export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthFacade);
  const token = auth.accessToken();
  if (!token || !req.url.startsWith(environment.apiBaseUrl)) {
    return next(req);
  }
  return next(withBearer(req, token)).pipe(
    catchError((error: unknown) => {
      const refreshable =
        error instanceof HttpErrorResponse && error.status === 401 && !req.url.startsWith(AUTH_URL);
      if (!refreshable) {
        return throwError(() => error);
      }
      return from(auth.refreshToken()).pipe(
        catchError(() => throwError(() => error)),
        switchMap(() => next(withBearer(req, auth.accessToken() ?? ''))),
      );
    }),
  );
};

function withBearer(req: HttpRequest<unknown>, token: string): HttpRequest<unknown> {
  return req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
}
