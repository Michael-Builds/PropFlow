import { TestBed } from '@angular/core/testing';
import { HttpTestingController } from '@angular/common/http/testing';
import { Router, provideRouter } from '@angular/router';
import { authGuard } from './auth.guard';
import { AuthService } from '../../services/auth/auth.service';
import { completeOwnerLogin, httpTestProviders } from '../../testing/http';

describe('authGuard', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideRouter([]), ...httpTestProviders()],
    });
  });

  it('should allow authenticated users', () => {
    completeOwnerLogin(TestBed.inject(HttpTestingController), TestBed.inject(AuthService));
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
