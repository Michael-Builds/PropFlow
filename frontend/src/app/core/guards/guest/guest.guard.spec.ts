import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { guestGuard } from './guest.guard';
import { AuthService } from '../../services/auth/auth.service';

describe('guestGuard', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideRouter([])],
    });
  });

  it('should allow guests', () => {
    const result = TestBed.runInInjectionContext(() => guestGuard({} as never, {} as never));
    expect(result).toBe(true);
  });

  it('should send signed-in users home', () => {
    const auth = TestBed.inject(AuthService);
    const router = TestBed.inject(Router);
    auth.login('owner@propflow.app', 'password');
    const result = TestBed.runInInjectionContext(() => guestGuard({} as never, {} as never));
    expect(result).toEqual(router.createUrlTree(['/dashboard']));
  });
});
