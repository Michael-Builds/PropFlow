import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of, tap } from 'rxjs';
import { ROLE_LABELS } from '../../config/nav.config';
import { SessionUser } from '../../interfaces/user.interface';
import { UserRole } from '../../interfaces/nav.interface';
import { initialsFromName } from '../../utils';
import { API_BASE } from '../data/api-map';

const AUTH_KEY = 'propflow.session';

type AuthResponse = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: {
    id: string;
    role: UserRole;
    orgId: string | null;
    email: string;
    fullName?: string | null;
    tenantId?: string | null;
    vendorId?: string | null;
  };
};

type StoredSession = {
  user: SessionUser;
  accessToken: string;
  refreshToken: string;
  activeOrgId: string | null;
};

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly stored = this.readSession();
  private readonly _user = signal<SessionUser | null>(this.stored?.user ?? null);
  private readonly _accessToken = signal<string | null>(this.stored?.accessToken ?? null);
  private readonly _refreshToken = signal<string | null>(this.stored?.refreshToken ?? null);
  private readonly _activeOrgId = signal<string | null>(this.stored?.activeOrgId ?? this.stored?.user.orgId ?? null);

  readonly user = this._user.asReadonly();
  readonly authenticated = computed(() => this._user() !== null);
  readonly role = computed(() => this._user()?.role ?? null);
  readonly displayName = computed(() => this._user()?.fullName ?? 'Guest');
  readonly roleLabel = computed(() => {
    const role = this._user()?.role;
    return role ? ROLE_LABELS[role] : '';
  });
  readonly activeOrgId = this._activeOrgId.asReadonly();

  accessToken(): string | null {
    return this._accessToken();
  }

  login(email: string, password: string): Observable<{ ok: boolean; message?: string }> {
    if (password.length < 6) {
      return of({ ok: false, message: 'Password must be at least 6 characters.' });
    }
    return this.http.post<AuthResponse>(`${API_BASE}/auth/login`, { email, password }).pipe(
      tap((res) => this.applyAuth(res)),
      map(() => ({ ok: true as const })),
      catchError((err: { error?: { message?: string } }) =>
        of({ ok: false, message: err.error?.message ?? 'Invalid email or password.' }),
      ),
    );
  }

  forgotPassword(email: string): Observable<{ ok: boolean }> {
    return this.http.post<{ ok: boolean }>(`${API_BASE}/auth/forgot-password`, { email }).pipe(
      catchError(() => of({ ok: true })),
    );
  }

  resetPassword(token: string, password: string): Observable<{ ok: boolean; message?: string }> {
    return this.http.post<{ ok: boolean }>(`${API_BASE}/auth/reset-password`, { token, password }).pipe(
      map(() => ({ ok: true as const })),
      catchError((err: { error?: { message?: string } }) =>
        of({ ok: false, message: err.error?.message ?? 'Unable to reset password.' }),
      ),
    );
  }

  logout(): void {
    const refreshToken = this._refreshToken();
    if (this._accessToken() && refreshToken) {
      this.http.post(`${API_BASE}/auth/logout`, { refreshToken }).subscribe({ error: () => undefined });
    }
    this._user.set(null);
    this._accessToken.set(null);
    this._refreshToken.set(null);
    this._activeOrgId.set(null);
    localStorage.removeItem(AUTH_KEY);
  }

  setActiveOrg(orgId: string): void {
    this._activeOrgId.set(orgId);
    this.persist();
  }

  canAccess(roles: UserRole[]): boolean {
    const role = this._user()?.role;
    if (!role) return false;
    if (role === 'platform_admin') return true;
    return roles.includes(role);
  }

  homePath(): string {
    const role = this._user()?.role;
    if (role === 'platform_admin') return '/organizations';
    if (role === 'vendor' || role === 'tenant') return '/tickets';
    return '/dashboard';
  }

  private applyAuth(res: AuthResponse): void {
    const fullName = res.user.fullName?.trim() || res.user.email;
    const user: SessionUser = {
      id: res.user.id,
      orgId: res.user.orgId,
      fullName,
      email: res.user.email,
      role: res.user.role,
      initials: initialsFromName(fullName),
    };
    this._user.set(user);
    this._accessToken.set(res.accessToken);
    this._refreshToken.set(res.refreshToken);
    this._activeOrgId.set(res.user.role === 'platform_admin' ? this._activeOrgId() : res.user.orgId);
    this.persist();
  }

  private persist(): void {
    const user = this._user();
    const accessToken = this._accessToken();
    const refreshToken = this._refreshToken();
    if (!user || !accessToken || !refreshToken) return;
    const payload: StoredSession = {
      user,
      accessToken,
      refreshToken,
      activeOrgId: this._activeOrgId(),
    };
    localStorage.setItem(AUTH_KEY, JSON.stringify(payload));
  }

  private readSession(): StoredSession | null {
    try {
      const raw = localStorage.getItem(AUTH_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as StoredSession | SessionUser;
      if ('accessToken' in parsed && 'user' in parsed) return parsed;
      return null;
    } catch {
      return null;
    }
  }
}
