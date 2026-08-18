import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { catchError, map, of, switchMap, tap, withLatestFrom } from 'rxjs';
import { AuthApiService } from '../../core/api/auth-api.service';
import { httpErrorMessage } from '../../core/api/http-error';
import { AuthActions } from './auth.actions';
import { persistAuth } from './auth.models';
import { authFeature } from './auth.reducer';

@Injectable()
export class AuthEffects {
  private readonly actions$ = inject(Actions);
  private readonly api = inject(AuthApiService);
  private readonly store = inject(Store);

  login$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.login),
      switchMap(({ email, password }) =>
        this.api.login(email, password).pipe(
          map((response) => AuthActions.loginSuccess({ response })),
          catchError((error) =>
            of(AuthActions.loginFailure({ message: httpErrorMessage(error, 'Invalid email or password.') })),
          ),
        ),
      ),
    ),
  );

  forgotPassword$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.forgotPassword),
      switchMap(({ email }) =>
        this.api.forgotPassword(email).pipe(
          map(() => AuthActions.forgotPasswordSuccess()),
          catchError(() => of(AuthActions.forgotPasswordSuccess())),
        ),
      ),
    ),
  );

  resetPassword$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.resetPassword),
      switchMap(({ token, password }) =>
        this.api.resetPassword(token, password).pipe(
          map(() => AuthActions.resetPasswordSuccess()),
          catchError((error) =>
            of(AuthActions.resetPasswordFailure({ message: httpErrorMessage(error, 'Unable to reset password.') })),
          ),
        ),
      ),
    ),
  );

  logout$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.logout),
      switchMap(({ refreshToken }) => {
        const request = refreshToken ? this.api.logout(refreshToken).pipe(catchError(() => of(null))) : of(null);
        return request.pipe(map(() => AuthActions.logoutSuccess()));
      }),
    ),
  );

  persist$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.loginSuccess, AuthActions.logout, AuthActions.logoutSuccess, AuthActions.setActiveOrg),
        withLatestFrom(this.store.select(authFeature.selectAuthState)),
        tap(([, state]) => persistAuth(state)),
      ),
    { dispatch: false },
  );
}
