import {
  HttpErrorResponse,
  HttpInterceptorFn,
  HttpRequest,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable, catchError, finalize, shareReplay, switchMap, tap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthApiService, AuthResponse } from '../api/auth-api.service';
import { UserRole } from '../enums/user-role.enum';
import { AuthService } from '../services/auth/auth.service';
import { AuthActions } from '../../store/auth/auth.actions';

let refreshInFlight$: Observable<AuthResponse> | null = null;

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (!isApiRequest(req.url)) {
    return next(req);
  }

  const auth = inject(AuthService);
  const api = inject(AuthApiService);
  const store = inject(Store);
  const authenticated = withAuthHeaders(req, auth);

  return next(authenticated).pipe(
    catchError((error: unknown) => {
      if (!shouldRefresh(authenticated, error)) {
        return throwError(() => error);
      }
      const refreshToken = auth.refreshToken();
      if (!refreshToken) {
        store.dispatch(AuthActions.logout({ refreshToken: null, accessToken: null }));
        return throwError(() => error);
      }
      return refreshSession(api, store, refreshToken).pipe(
        switchMap((response) => next(withAccessToken(authenticated, response.accessToken))),
        catchError(() => throwError(() => error)),
      );
    }),
  );
};

function withAuthHeaders(req: HttpRequest<unknown>, auth: AuthService): HttpRequest<unknown> {
  const headers: Record<string, string> = {
    'ngrok-skip-browser-warning': 'true',
  };
  if (!isAnonymousAuthUrl(req.url)) {
    const token = req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '') || auth.accessToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const orgId = auth.activeOrgId();
    if (orgId && auth.role() !== UserRole.PlatformAdmin) {
      headers['x-org-id'] = orgId;
    }
  }
  return req.clone({ setHeaders: headers });
}

function withAccessToken(req: HttpRequest<unknown>, accessToken: string): HttpRequest<unknown> {
  return req.clone({
    setHeaders: {
      Authorization: `Bearer ${accessToken}`,
      'X-PropFlow-Retried': '1',
    },
  });
}

function shouldRefresh(req: HttpRequest<unknown>, error: unknown): boolean {
  if (!(error instanceof HttpErrorResponse) || error.status !== 401) return false;
  if (isAnonymousAuthUrl(req.url) || isAuthPath(req.url, '/auth/refresh') || isAuthPath(req.url, '/auth/logout')) {
    return false;
  }
  return req.headers.get('X-PropFlow-Retried') !== '1';
}

function refreshSession(api: AuthApiService, store: Store, refreshToken: string): Observable<AuthResponse> {
  if (!refreshInFlight$) {
    refreshInFlight$ = api.refresh(refreshToken).pipe(
      tap((response) => store.dispatch(AuthActions.refreshSuccess({ response }))),
      catchError((error) => {
        store.dispatch(AuthActions.logout({ refreshToken, accessToken: null }));
        return throwError(() => error);
      }),
      finalize(() => {
        refreshInFlight$ = null;
      }),
      shareReplay({ bufferSize: 1, refCount: false }),
    );
  }
  return refreshInFlight$;
}

function isAnonymousAuthUrl(url: string): boolean {
  return (
    isAuthPath(url, '/auth/login') ||
    isAuthPath(url, '/auth/refresh') ||
    isAuthPath(url, '/auth/forgot-password') ||
    isAuthPath(url, '/auth/reset-password')
  );
}

function isAuthPath(url: string, path: string): boolean {
  return url.includes(path);
}

function isApiRequest(url: string): boolean {
  return (
    url.startsWith(environment.apiBaseUrl) ||
    url.startsWith(`${environment.apiOrigin}/api/`) ||
    url.startsWith('/api/')
  );
}
