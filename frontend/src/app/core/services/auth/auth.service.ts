import { Injectable, computed, inject } from '@angular/core';
import { Actions, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { Observable, map, of, take } from 'rxjs';
import { ROLE_LABELS } from '../../config/nav.config';
import { UserRole } from '../../interfaces/nav.interface';
import { AuthActions } from '../../../store/auth/auth.actions';
import { authFeature } from '../../../store/auth/auth.reducer';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly store = inject(Store);
  private readonly actions$ = inject(Actions);

  readonly user = this.store.selectSignal(authFeature.selectUser);
  readonly authenticated = computed(() => this.user() !== null);
  readonly role = computed(() => this.user()?.role ?? null);
  readonly displayName = computed(() => this.user()?.fullName ?? 'Guest');
  readonly roleLabel = computed(() => {
    const role = this.user()?.role;
    return role ? ROLE_LABELS[role] : '';
  });
  readonly activeOrgId = this.store.selectSignal(authFeature.selectActiveOrgId);
  private readonly accessTokenSignal = this.store.selectSignal(authFeature.selectAccessToken);
  private readonly refreshTokenSignal = this.store.selectSignal(authFeature.selectRefreshToken);

  accessToken(): string | null {
    return this.accessTokenSignal();
  }

  login(email: string, password: string): Observable<{ ok: boolean; message?: string }> {
    if (password.length < 6) {
      return of({ ok: false, message: 'Password must be at least 6 characters.' });
    }
    this.store.dispatch(AuthActions.login({ email, password }));
    return this.actions$.pipe(
      ofType(AuthActions.loginSuccess, AuthActions.loginFailure),
      take(1),
      map((action) =>
        action.type === AuthActions.loginSuccess.type
          ? { ok: true as const }
          : { ok: false, message: action.message },
      ),
    );
  }

  forgotPassword(email: string): Observable<{ ok: boolean }> {
    this.store.dispatch(AuthActions.forgotPassword({ email }));
    return this.actions$.pipe(
      ofType(AuthActions.forgotPasswordSuccess),
      take(1),
      map(() => ({ ok: true })),
    );
  }

  resetPassword(token: string, password: string): Observable<{ ok: boolean; message?: string }> {
    this.store.dispatch(AuthActions.resetPassword({ token, password }));
    return this.actions$.pipe(
      ofType(AuthActions.resetPasswordSuccess, AuthActions.resetPasswordFailure),
      take(1),
      map((action) =>
        action.type === AuthActions.resetPasswordSuccess.type
          ? { ok: true as const }
          : { ok: false, message: action.message },
      ),
    );
  }

  logout(): void {
    this.store.dispatch(AuthActions.logout({ refreshToken: this.refreshTokenSignal() }));
  }

  setActiveOrg(orgId: string): void {
    this.store.dispatch(AuthActions.setActiveOrg({ orgId }));
  }

  canAccess(roles: UserRole[]): boolean {
    const role = this.user()?.role;
    if (!role) return false;
    if (role === 'platform_admin') return true;
    return roles.includes(role);
  }

  homePath(): string {
    const role = this.user()?.role;
    if (role === 'platform_admin') return '/organizations';
    if (role === 'vendor' || role === 'tenant') return '/tickets';
    return '/dashboard';
  }
}
