import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE } from '../services/data/api-map';

export type OnboardingStatus = {
  required: boolean;
  canComplete: boolean;
  onboardingComplete: boolean;
  mustChangePassword: boolean;
  steps: {
    password: boolean;
    profile: boolean;
    property: boolean;
  };
  organization: {
    id: string;
    name: string;
    phone: string | null;
    address: string | null;
    city: string | null;
    country: string | null;
  } | null;
  propertyCount?: number;
};

@Injectable({ providedIn: 'root' })
export class OnboardingApiService {
  private readonly http = inject(HttpClient);

  status(): Observable<OnboardingStatus> {
    return this.http.get<OnboardingStatus>(`${API_BASE}/onboarding/status`);
  }

  setPassword(password: string): Observable<OnboardingStatus> {
    return this.http.post<OnboardingStatus>(`${API_BASE}/onboarding/password`, { password });
  }

  saveProfile(payload: {
    name: string;
    phone?: string;
    address?: string;
    city?: string;
    country?: string;
  }): Observable<OnboardingStatus> {
    return this.http.post<OnboardingStatus>(`${API_BASE}/onboarding/profile`, payload);
  }

  addFirstProperty(payload: {
    name: string;
    location?: string;
    type?: string;
  }): Observable<OnboardingStatus> {
    return this.http.post<OnboardingStatus>(`${API_BASE}/onboarding/first-property`, payload);
  }

  complete(): Observable<OnboardingStatus> {
    return this.http.post<OnboardingStatus>(`${API_BASE}/onboarding/complete`, {});
  }
}
