import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  PLATFORM_AVAILABILITY_DEFAULTS,
  PlatformAvailabilityMode,
} from '../../core/interfaces/platform-availability.interface';
import { PlatformAvailabilityService } from '../../core/services/platform-availability/platform-availability.service';
import { ToastService } from '../../core/services/toast/toast.service';
import { PageHeaderComponent } from '../../shared/ui/page-header/page-header.component';
import { ButtonComponent } from '../../shared/ui/button/button.component';
import { IconComponent } from '../../shared/icons/icon.component';

type ModeOption = {
  value: PlatformAvailabilityMode;
  label: string;
  hint: string;
  detail: string;
  icon: 'check' | 'warning' | 'clock';
  tone: 'live' | 'maintenance' | 'soon';
};

@Component({
  selector: 'app-system-status-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, FormsModule, PageHeaderComponent, ButtonComponent, IconComponent],
  templateUrl: './system-status-page.component.html',
  styleUrl: './system-status-page.component.css',
  host: { class: 'block space-y-5' },
})
export class SystemStatusPageComponent {
  private readonly availability = inject(PlatformAvailabilityService);
  private readonly toast = inject(ToastService);

  readonly current = this.availability.availability;
  readonly saving = signal(false);
  readonly mode = signal<PlatformAvailabilityMode>(this.current().mode);
  readonly title = signal(this.current().title);
  readonly message = signal(this.current().message);
  readonly supportEmail = signal(this.current().supportEmail ?? 'support@propflow.app');
  readonly notifyUsers = signal(true);
  readonly dirty = signal(false);

  readonly modes: ModeOption[] = [
    {
      value: PlatformAvailabilityMode.Live,
      label: 'Live',
      hint: 'Open for all roles',
      detail: 'Normal access across every company workspace.',
      icon: 'check',
      tone: 'live',
    },
    {
      value: PlatformAvailabilityMode.Maintenance,
      label: 'Maintenance',
      hint: 'Company users gated',
      detail: 'Ops continue for platform admins while tenants wait.',
      icon: 'warning',
      tone: 'maintenance',
    },
    {
      value: PlatformAvailabilityMode.ComingSoon,
      label: 'Coming soon',
      hint: 'Pre-launch gate',
      detail: 'Hold the product behind a launch screen until ready.',
      icon: 'clock',
      tone: 'soon',
    },
  ];

  readonly selected = computed(
    () => this.modes.find((m) => m.value === this.mode()) ?? this.modes[0],
  );

  readonly showNotify = computed(
    () =>
      this.mode() === PlatformAvailabilityMode.Maintenance ||
      this.mode() === PlatformAvailabilityMode.ComingSoon,
  );

  readonly previewTitle = computed(() => {
    if (this.mode() === PlatformAvailabilityMode.Live) return 'PropFlow is live';
    return this.title().trim() || 'Status title';
  });

  readonly previewMessage = computed(() => {
    if (this.mode() === PlatformAvailabilityMode.Live) {
      return 'No gate screen. Every role can sign in and work as usual.';
    }
    return this.message().trim() || 'Status message for gated users.';
  });

  readonly publishedLabel = computed(() => {
    const mode = this.current().mode;
    if (mode === PlatformAvailabilityMode.Live) return 'Published live';
    if (mode === PlatformAvailabilityMode.Maintenance) return 'Published in maintenance';
    return 'Published as coming soon';
  });

  constructor() {
    effect(() => {
      const state = this.current();
      if (this.dirty() || this.saving()) return;
      this.mode.set(state.mode);
      this.title.set(state.title);
      this.message.set(state.message);
      this.supportEmail.set(state.supportEmail ?? 'support@propflow.app');
    });
  }

  selectMode(mode: PlatformAvailabilityMode): void {
    this.dirty.set(true);
    this.mode.set(mode);
    if (mode === PlatformAvailabilityMode.Live) {
      this.title.set('');
      this.message.set('');
      return;
    }
    const defaults = PLATFORM_AVAILABILITY_DEFAULTS[mode];
    if (!this.title().trim()) this.title.set(defaults.title);
    if (!this.message().trim()) this.message.set(defaults.message);
  }

  markDirty(): void {
    this.dirty.set(true);
  }

  modeCardClass(option: ModeOption): string {
    const active = this.mode() === option.value;
    const tones: Record<ModeOption['tone'], string> = {
      live: active
        ? 'border-success bg-success-soft/40 ring-2 ring-success/30'
        : 'border-border bg-linear-to-b from-success-soft/50 to-white hover:border-success/40',
      maintenance: active
        ? 'border-warning bg-warning-soft/50 ring-2 ring-warning/30'
        : 'border-border bg-linear-to-b from-warning-soft/50 to-white hover:border-warning/40',
      soon: active
        ? 'border-info bg-info-soft/50 ring-2 ring-info/30'
        : 'border-border bg-linear-to-b from-info-soft/50 to-white hover:border-info/40',
    };
    return tones[option.tone];
  }

  modeIconClass(option: ModeOption): string {
    const tones: Record<ModeOption['tone'], string> = {
      live: 'bg-success/15 text-success',
      maintenance: 'bg-warning/15 text-warning',
      soon: 'bg-info/15 text-info',
    };
    return tones[option.tone];
  }

  modeHintClass(option: ModeOption): string {
    const tones: Record<ModeOption['tone'], string> = {
      live: 'text-success',
      maintenance: 'text-warning',
      soon: 'text-info',
    };
    return tones[option.tone];
  }

  modeCheckClass(option: ModeOption): string {
    const tones: Record<ModeOption['tone'], string> = {
      live: 'bg-success',
      maintenance: 'bg-warning',
      soon: 'bg-info',
    };
    return tones[option.tone];
  }

  chipClass(): string {
    const tone = this.selected().tone;
    if (tone === 'live') return 'border-success/30 bg-success-soft text-success';
    if (tone === 'maintenance') return 'border-warning/30 bg-warning-soft text-warning';
    return 'border-info/30 bg-info-soft text-info';
  }

  save(): void {
    this.saving.set(true);
    this.availability
      .update({
        mode: this.mode(),
        title: this.title() || undefined,
        message: this.message() || undefined,
        supportEmail: this.supportEmail() || undefined,
        notifyUsers: this.showNotify() ? this.notifyUsers() : false,
      })
      .subscribe({
        next: (state) => {
          this.saving.set(false);
          this.dirty.set(false);
          const queued = state.notificationsQueued ?? 0;
          const note = queued > 0 ? ` Notified ${queued} user(s).` : '';
          this.toast.success(
            state.mode === PlatformAvailabilityMode.Live
              ? `PropFlow is live.${note}`
              : `Mode set to ${state.mode.replace('_', ' ')}.${note}`,
          );
        },
        error: () => {
          this.saving.set(false);
          this.toast.error('Could not update platform availability.');
        },
      });
  }
}
