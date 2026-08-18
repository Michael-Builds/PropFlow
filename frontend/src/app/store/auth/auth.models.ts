import { SessionUser } from '../../core/interfaces/user.interface';
import { AuthResponse } from '../../core/api/auth-api.service';
import { initialsFromName } from '../../core/utils';

export const AUTH_STORAGE_KEY = 'propflow.session';

export type AuthStatus = 'idle' | 'authenticating' | 'error';

export interface AuthState {
  user: SessionUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  activeOrgId: string | null;
  status: AuthStatus;
  error: string | null;
}

export interface StoredSession {
  user: SessionUser;
  accessToken: string;
  refreshToken: string;
  activeOrgId: string | null;
}

export const initialAuthState: AuthState = loadAuthState();

export function toSessionUser(user: AuthResponse['user']): SessionUser {
  const fullName = user.fullName?.trim() || user.email;
  return {
    id: user.id,
    orgId: user.orgId,
    fullName,
    email: user.email,
    role: user.role,
    initials: initialsFromName(fullName),
  };
}

export function persistAuth(state: AuthState): void {
  if (typeof localStorage === 'undefined') return;
  if (!state.user || !state.accessToken || !state.refreshToken) {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    return;
  }
  const payload: StoredSession = {
    user: state.user,
    accessToken: state.accessToken,
    refreshToken: state.refreshToken,
    activeOrgId: state.activeOrgId,
  };
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(payload));
}

function loadAuthState(): AuthState {
  const empty: AuthState = {
    user: null,
    accessToken: null,
    refreshToken: null,
    activeOrgId: null,
    status: 'idle',
    error: null,
  };
  if (typeof localStorage === 'undefined') return empty;
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return empty;
    const parsed = JSON.parse(raw) as StoredSession;
    if (!parsed?.accessToken || !parsed.user) return empty;
    return {
      user: parsed.user,
      accessToken: parsed.accessToken,
      refreshToken: parsed.refreshToken,
      activeOrgId: parsed.user.role === 'platform_admin' ? null : (parsed.activeOrgId ?? parsed.user.orgId ?? null),
      status: 'idle',
      error: null,
    };
  } catch {
    return empty;
  }
}
