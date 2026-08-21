import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { NAV_SECTIONS } from '../../core/config/nav.config';
import { AuthService } from '../../core/services/auth/auth.service';
import { ModalService } from '../../core/services/modal/modal.service';
import { NotificationService } from '../../core/services/notification/notification.service';
import { SidebarService } from '../../core/services/sidebar/sidebar.service';
import { ToastService } from '../../core/services/toast/toast.service';
import { IconComponent } from '../../shared/icons/icon.component';
import { LogoComponent } from '../../shared/ui/logo/logo.component';

@Component({
  selector: 'app-sidebar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive, IconComponent, LogoComponent],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css',
})
export class SidebarComponent {
  readonly sidebar = inject(SidebarService);
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly modal = inject(ModalService);
  private readonly toast = inject(ToastService);
  readonly unread = inject(NotificationService).unreadCount;

  readonly collapsed = this.sidebar.collapsed;
  readonly mobileOpen = this.sidebar.mobileOpen;
  readonly expanded = computed(() => !this.collapsed());

  readonly visibleSections = computed(() => {
    if (this.auth.needsOnboarding()) {
      return [
        {
          id: 'setup',
          label: 'Setup',
          items: [
            {
              id: 'onboarding',
              label: 'Finish onboarding',
              path: '/onboarding',
              icon: 'lock' as const,
              roles: [] as const,
            },
          ],
        },
      ];
    }
    return NAV_SECTIONS.map((section) => ({
      ...section,
      items: section.items.filter((item) => this.auth.canAccess(item.roles)),
    })).filter((section) => section.items.length > 0);
  });

  async logout(): Promise<void> {
    const confirmed = await this.modal.confirm({
      title: 'Sign out',
      message: 'End this operator session?',
      confirmLabel: 'Sign out',
      variant: 'danger',
    });
    if (!confirmed) return;
    this.auth.logout();
    this.sidebar.closeMobile();
    this.toast.success('You have been signed out.');
    void this.router.navigateByUrl('/auth/login');
  }
}
