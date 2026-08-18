import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { authGuard } from './auth.guard';
import { AuthService } from '../../services/auth/auth.service';

describe('authGuard', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideRouter([])],
    });
  });

  it('should allow authenticated users', () => {
    const auth = TestBed.inject(AuthService);
    auth.login('owner@propflow.app', 'password');

    const result = TestBed.runInInjectionContext(() =>
      authGuard({} as never, { url: '/dashboard' } as never),
    );
    expect(result).toBe(true);
  });

  it('should redirect guests to login', () => {
    const router = TestBed.inject(Router);
    const result = TestBed.runInInjectionContext(() =>
      authGuard({} as never, { url: '/dashboard' } as never),
    );
    expect(result).toEqual(router.createUrlTree(['/auth/login']));
  });
});
