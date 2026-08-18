import { ChangeDetectionStrategy, Component, HostListener, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth/auth.service';
import { NotificationService } from '../../core/services/notification/notification.service';
import { SidebarService } from '../../core/services/sidebar/sidebar.service';
import { IconComponent } from '../../shared/icons/icon.component';

@Component({
  selector: 'app-topbar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, IconComponent],
  templateUrl: './topbar.component.html',
  styleUrl: './topbar.component.css',
})
export class TopbarComponent {
  readonly sidebar = inject(SidebarService);
  readonly auth = inject(AuthService);
  readonly notifications = inject(NotificationService);
  readonly notifOpen = signal(false);

  toggleNotifications(): void {
    this.notifOpen.update((open) => !open);
  }

  markAllRead(): void {
    this.notifications.markAllRead();
  }

  @HostListener('document:mousedown')
  closeMenus(): void {
    this.notifOpen.set(false);
  }
}
