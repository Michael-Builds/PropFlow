import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AuthService } from '../services/auth/auth.service';
import { provideAppStore } from '../../store';

import { UserRole } from '../enums/user-role.enum';

export const OWNER_AUTH = {
  accessToken: 'access-token',
  refreshToken: 'refresh-token',
  expiresIn: 3600,
  user: {
    id: 'usr_001',
    role: UserRole.Owner,
    orgId: 'org_001',
    email: 'owner@propflow.app',
    fullName: 'Ama Owusu',
  },
};

export function httpTestProviders() {
  return [provideHttpClient(), provideHttpClientTesting(), provideAppStore()];
}

export function completeOwnerLogin(http: HttpTestingController, auth: AuthService): void {
  auth.login('owner@propflow.app', 'password').subscribe();
  const req = http.expectOne((request) => request.url.includes('/auth/login'));
  req.flush(OWNER_AUTH);
}
