import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PlatformAvailabilityService } from '../../../core/services/platform-availability/platform-availability.service';
import { AuthService } from '../../../core/services/auth/auth.service';
import { LogoComponent } from '../logo/logo.component';
import { IconComponent } from '../../icons/icon.component';
import { ButtonComponent } from '../button/button.component';

@Component({
  selector: 'app-platform-gate',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, LogoComponent, IconComponent, ButtonComponent],
  templateUrl: './platform-gate.component.html',
  styleUrl: './platform-gate.component.css',
  host: { class: 'fixed inset-0 z-[100]' },
})
export class PlatformGateComponent {
  private readonly availability = inject(PlatformAvailabilityService);
  readonly auth = inject(AuthService);

  readonly state = this.availability.availability;
  readonly isMaintenance = computed(() => this.state().mode === 'maintenance');
  readonly icon = computed(() => (this.isMaintenance() ? 'warning' : 'clock'));
}
