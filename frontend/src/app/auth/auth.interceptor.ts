import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { ApiConfiguration } from '../services/api-configuration';
import { TokenService } from '../services/token/token.service';
import { SessionService } from './session.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const { rootUrl } = inject(ApiConfiguration);
  const tokens = inject(TokenService);
  const session = inject(SessionService);

  // Login and refresh use the password or the cookie, and a 401 there is a real answer.
  if (!req.url.startsWith(`${rootUrl}/`) || req.url.startsWith(`${rootUrl}/auth/`)) {
    return next(req);
  }

  const send = (token: string | null) =>
    next(token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req);

  return send(tokens.token).pipe(
    catchError((err: unknown) => {
      if (!(err instanceof HttpErrorResponse) || err.status !== 401) {
        return throwError(() => err);
      }
      return session.refresh().pipe(
        catchError(() => {
          session.end();
          return throwError(() => err);
        }),
        switchMap((token) => send(token)),
      );
    }),
  );
};
