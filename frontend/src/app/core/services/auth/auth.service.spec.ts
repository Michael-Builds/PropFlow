import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(AuthService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should authenticate on valid login', () => {
    const result = service.login('owner@propflow.app', 'password');
    expect(result.ok).toBe(true);
    expect(service.authenticated()).toBe(true);
    expect(service.role()).toBe('owner');
  });

  it('should reject unknown accounts', () => {
    const result = service.login('unknown@propflow.app', 'password');
    expect(result.ok).toBe(false);
    expect(service.authenticated()).toBe(false);
  });

  it('should reject short passwords', () => {
    const result = service.login('owner@propflow.app', '123');
    expect(result.ok).toBe(false);
  });

  it('should send vendors to tickets', () => {
    service.login('vendor@propflow.app', 'password');
    expect(service.homePath()).toBe('/tickets');
  });

  it('should clear session on logout', () => {
    service.login('owner@propflow.app', 'password');
    service.logout();
    expect(service.authenticated()).toBe(false);
  });
});
