import { Injectable, computed, inject, signal } from '@angular/core';
import { catchError, of, tap } from 'rxjs';
import { PlatformAvailabilityApiService } from '../../api/platform-availability-api.service';
import {
  PLATFORM_AVAILABILITY_DEFAULTS,
  PlatformAvailabilityMode,
  PlatformAvailabilityState,
} from '../../interfaces/platform-availability.interface';
import { UserRole } from '../../enums/user-role.enum';
import { AuthService } from '../auth/auth.service';
import { RealtimeService } from '../realtime/realtime.service';

const LIVE: PlatformAvailabilityState = {
  mode: PlatformAvailabilityMode.Live,
  title: '',
  message: '',
  supportEmail: null,
  updatedAt: null,
  updatedBy: null,
};

@Injectable({ providedIn: 'root' })
export class PlatformAvailabilityService {
  private readonly api = inject(PlatformAvailabilityApiService);
  private readonly auth = inject(AuthService);
  private readonly realtime = inject(RealtimeService);

  private readonly state = signal<PlatformAvailabilityState>(LIVE);
  private readonly ready = signal(false);

  readonly availability = this.state.asReadonly();
  readonly loaded = this.ready.asReadonly();
  readonly mode = computed(() => this.state().mode);
  readonly isGated = computed(() => {
    const mode = this.state().mode;
    if (mode === PlatformAvailabilityMode.Live) return false;
    if (this.auth.role() === UserRole.PlatformAdmin) return false;
    return true;
  });
  readonly operatorBanner = computed(() => {
    if (this.auth.role() !== UserRole.PlatformAdmin) return null;
    const mode = this.state().mode;
    if (mode === PlatformAvailabilityMode.Live) return null;
    return mode === PlatformAvailabilityMode.Maintenance
      ? 'Maintenance mode is on — company users are blocked.'
      : 'Coming soon mode is on — company users are blocked.';
  });

  constructor() {
    this.refresh();
    this.realtime.connect();
    this.realtime.platformAvailability$.subscribe((payload) => {
      this.state.set(normalize(payload));
      this.ready.set(true);
    });
  }

  refresh(): void {
    this.api
      .get()
      .pipe(
        tap((payload) => {
          this.state.set(normalize(payload));
          this.ready.set(true);
        }),
        catchError(() => {
          this.state.set(LIVE);
          this.ready.set(true);
          return of(LIVE);
        }),
      )
      .subscribe();
  }

  update(payload: {
    mode: PlatformAvailabilityMode;
    title?: string;
    message?: string;
    supportEmail?: string;
    notifyUsers?: boolean;
  }) {
    return this.api.update(payload).pipe(
      tap((next) => {
        this.state.set(normalize(next));
      }),
    );
  }
}

function normalize(payload: PlatformAvailabilityState): PlatformAvailabilityState {
  const mode = payload?.mode ?? PlatformAvailabilityMode.Live;
  if (mode === PlatformAvailabilityMode.Live) {
    return { ...LIVE, supportEmail: payload.supportEmail ?? null, updatedAt: payload.updatedAt ?? null, updatedBy: payload.updatedBy ?? null };
  }
  const defaults = PLATFORM_AVAILABILITY_DEFAULTS[mode];
  return {
    mode,
    title: payload.title?.trim() || defaults.title,
    message: payload.message?.trim() || defaults.message,
    supportEmail: payload.supportEmail ?? null,
    updatedAt: payload.updatedAt ?? null,
    updatedBy: payload.updatedBy ?? null,
    notificationsQueued: payload.notificationsQueued,
  };
}
