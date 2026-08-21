import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE } from '../services/data/api-map';
import {
  PlatformAvailabilityMode,
  PlatformAvailabilityState,
} from '../interfaces/platform-availability.interface';

@Injectable({ providedIn: 'root' })
export class PlatformAvailabilityApiService {
  private readonly http = inject(HttpClient);

  get(): Observable<PlatformAvailabilityState> {
    return this.http.get<PlatformAvailabilityState>(`${API_BASE}/platform/availability`);
  }

  update(payload: {
    mode: PlatformAvailabilityMode;
    title?: string;
    message?: string;
    supportEmail?: string;
    notifyUsers?: boolean;
  }): Observable<PlatformAvailabilityState> {
    return this.http.patch<PlatformAvailabilityState>(`${API_BASE}/platform/availability`, payload);
  }
}
