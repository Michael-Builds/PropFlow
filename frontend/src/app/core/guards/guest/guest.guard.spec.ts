import { TestBed } from '@angular/core/testing';
import { HttpTestingController } from '@angular/common/http/testing';
import { Router, provideRouter } from '@angular/router';
import { guestGuard } from './guest.guard';
import { AuthService } from '../../services/auth/auth.service';
import { completeOwnerLogin, httpTestProviders } from '../../testing/http';

describe('guestGuard', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideRouter([]), ...httpTestProviders()],
    });
  });

  it('should allow guests', () => {
    const result = TestBed.runInInjectionContext(() => guestGuard({} as never, {} as never));
    expect(result).toBe(true);
  });

  it('should send signed-in users home', () => {
    const router = TestBed.inject(Router);
    completeOwnerLogin(TestBed.inject(HttpTestingController), TestBed.inject(AuthService));
    const result = TestBed.runInInjectionContext(() => guestGuard({} as never, {} as never));
    expect(result).toEqual(router.createUrlTree(['/dashboard']));
  });
});
