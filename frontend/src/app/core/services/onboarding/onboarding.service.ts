import { Injectable, inject } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { Store } from '@ngrx/store';
import { OnboardingApiService, OnboardingStatus } from '../../api/onboarding-api.service';
import { AuthActions } from '../../../store/auth/auth.actions';
import { AuthService } from '../auth/auth.service';

@Injectable({ providedIn: 'root' })
export class OnboardingService {
  private readonly api = inject(OnboardingApiService);
  private readonly store = inject(Store);
  private readonly auth = inject(AuthService);

  status(): Observable<OnboardingStatus> {
    return this.api.status().pipe(tap((status) => this.syncSession(status)));
  }

  setPassword(password: string): Observable<OnboardingStatus> {
    return this.api.setPassword(password).pipe(tap((status) => this.syncSession(status)));
  }

  saveProfile(payload: {
    name: string;
    phone?: string;
    address?: string;
    city?: string;
    country?: string;
  }): Observable<OnboardingStatus> {
    return this.api.saveProfile(payload).pipe(tap((status) => this.syncSession(status)));
  }

  addFirstProperty(payload: {
    name: string;
    location?: string;
    type?: string;
  }): Observable<OnboardingStatus> {
    return this.api.addFirstProperty(payload).pipe(tap((status) => this.syncSession(status)));
  }

  complete(): Observable<OnboardingStatus> {
    return this.api.complete().pipe(tap((status) => this.syncSession(status)));
  }

  private syncSession(status: OnboardingStatus): void {
    const user = this.auth.user();
    if (!user) return;
    this.store.dispatch(
      AuthActions.updateSessionUser({
        patch: {
          mustChangePassword: status.mustChangePassword,
          onboardingComplete: status.onboardingComplete,
          orgName: status.organization?.name ?? user.orgName,
        },
      }),
    );
  }
}
