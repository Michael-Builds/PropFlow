import { TestBed } from '@angular/core/testing';
import { HttpTestingController } from '@angular/common/http/testing';
import { UserRole, UserRoles } from '../../enums/user-role.enum';
import { AuthService } from './auth.service';
import { completeOwnerLogin, httpTestProviders } from '../../testing/http';

describe('AuthService', () => {
  let service: AuthService;
  let http: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: httpTestProviders(),
    });
    service = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should authenticate on valid login', () => {
    completeOwnerLogin(http, service);
    expect(service.authenticated()).toBe(true);
    expect(service.role()).toBe(UserRole.Owner);
  });

  it('should reject unknown accounts', () => {
    let result: { ok: boolean } | undefined;
    service.login('unknown@propflow.app', 'password').subscribe((value) => (result = value));
    const req = http.expectOne((request) => request.url.includes('/auth/login'));
    req.flush({ message: 'Invalid credentials' }, { status: 401, statusText: 'Unauthorized' });
    expect(result?.ok).toBe(false);
    expect(service.authenticated()).toBe(false);
  });

  it('should reject short passwords', () => {
    let result: { ok: boolean } | undefined;
    service.login('owner@propflow.app', '123').subscribe((value) => (result = value));
    expect(result?.ok).toBe(false);
  });

  it('should keep each role on its own navigation', () => {
    completeOwnerLogin(http, service);
    expect(service.canAccess(UserRoles.portfolio)).toBe(true);
    expect(service.canAccess(UserRoles.platform)).toBe(false);
    expect(service.homePath()).toBe('/dashboard');
  });

  it('should send vendors to the dashboard', () => {
    service.login('vendor@propflow.app', 'password').subscribe();
    const req = http.expectOne((request) => request.url.includes('/auth/login'));
    req.flush({
      accessToken: 'a',
      refreshToken: 'r',
      expiresIn: 3600,
      user: {
        id: 'usr_004',
        role: UserRole.Vendor,
        orgId: 'org_001',
        email: 'vendor@propflow.app',
        fullName: 'AquaFix Ops',
      },
    });
    expect(service.homePath()).toBe('/dashboard');
  });

  it('should clear session on logout', () => {
    completeOwnerLogin(http, service);
    service.logout();
    http.expectOne((request) => request.url.includes('/auth/logout')).flush({ ok: true });
    expect(service.authenticated()).toBe(false);
  });
});
