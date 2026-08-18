import { Injectable, computed, signal } from '@angular/core';
import { ROLE_LABELS } from '../../config/nav.config';
import { SessionUser } from '../../interfaces/user.interface';
import { UserRole } from '../../interfaces/nav.interface';

const AUTH_KEY = 'propflow.session';

const DEMO_USERS: Record<string, SessionUser> = {
  'owner@propflow.app': {
    id: 'usr_001',
    orgId: 'org_001',
    fullName: 'Ama Owusu',
    email: 'owner@propflow.app',
    role: 'owner',
    initials: 'AO',
  },
  'manager@propflow.app': {
    id: 'usr_002',
    orgId: 'org_001',
    fullName: 'Yaw Asante',
    email: 'manager@propflow.app',
    role: 'manager',
    initials: 'YA',
  },
  'finance@propflow.app': {
    id: 'usr_003',
    orgId: 'org_001',
    fullName: 'Kwesi Darko',
    email: 'finance@propflow.app',
    role: 'finance',
    initials: 'KD',
  },
  'vendor@propflow.app': {
    id: 'usr_004',
    orgId: 'org_001',
    fullName: 'AquaFix Ops',
    email: 'vendor@propflow.app',
    role: 'vendor',
    initials: 'AF',
  },
  'tenant@propflow.app': {
    id: 'usr_005',
    orgId: 'org_001',
    fullName: 'Ama Boateng',
    email: 'tenant@propflow.app',
    role: 'tenant',
    initials: 'AB',
  },
};

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly _user = signal<SessionUser | null>(this.readUser());
  readonly user = this._user.asReadonly();
  readonly authenticated = computed(() => this._user() !== null);
  readonly role = computed(() => this._user()?.role ?? null);
  readonly displayName = computed(() => this._user()?.fullName ?? 'Guest');
  readonly roleLabel = computed(() => {
    const role = this._user()?.role;
    return role ? ROLE_LABELS[role] : '';
  });

  login(email: string, password: string): { ok: boolean; message?: string } {
    if (password.length < 6) {
      return { ok: false, message: 'Password must be at least 6 characters.' };
    }
    const user = DEMO_USERS[email.trim().toLowerCase()];
    if (!user) {
      return { ok: false, message: 'Unknown demo account. Use one of the emails below.' };
    }
    this._user.set(user);
    localStorage.setItem(AUTH_KEY, JSON.stringify(user));
    return { ok: true };
  }

  logout(): void {
    this._user.set(null);
    localStorage.removeItem(AUTH_KEY);
  }

  canAccess(roles: UserRole[]): boolean {
    const role = this._user()?.role;
    return !!role && roles.includes(role);
  }

  homePath(): string {
    const role = this._user()?.role;
    if (role === 'vendor' || role === 'tenant') return '/tickets';
    return '/dashboard';
  }

  private readUser(): SessionUser | null {
    try {
      const raw = localStorage.getItem(AUTH_KEY);
      return raw ? (JSON.parse(raw) as SessionUser) : null;
    } catch {
      return null;
    }
  }
}
