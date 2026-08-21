import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE } from '../services/data/api-map';
import { UserRole } from '../interfaces/nav.interface';

export type AuthResponse = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: {
    id: string;
    role: UserRole;
    orgId: string | null;
    email: string;
    fullName?: string | null;
    tenantId?: string | null;
    vendorId?: string | null;
    mustChangePassword?: boolean;
    onboardingComplete?: boolean;
    orgName?: string | null;
  };
};

@Injectable({ providedIn: 'root' })
export class AuthApiService {
  private readonly http = inject(HttpClient);

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${API_BASE}/auth/login`, { email, password });
  }

  forgotPassword(email: string): Observable<{ ok: boolean }> {
    return this.http.post<{ ok: boolean }>(`${API_BASE}/auth/forgot-password`, { email });
  }

  resetPassword(token: string, password: string): Observable<{ ok: boolean }> {
    return this.http.post<{ ok: boolean }>(`${API_BASE}/auth/reset-password`, { token, password });
  }

  logout(refreshToken: string, accessToken?: string | null): Observable<unknown> {
    return this.http.post(
      `${API_BASE}/auth/logout`,
      { refreshToken },
      accessToken ? { headers: { Authorization: `Bearer ${accessToken}` } } : {},
    );
  }

  refresh(refreshToken: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${API_BASE}/auth/refresh`, { refreshToken });
  }
}
