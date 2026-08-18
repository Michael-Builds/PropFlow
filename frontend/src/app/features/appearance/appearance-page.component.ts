import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ThemeId } from '../../core/interfaces/theme.interface';
import { ThemeService } from '../../core/services/theme/theme.service';
import { ToastService } from '../../core/services/toast/toast.service';
import { IconComponent } from '../../shared/icons/icon.component';
import { PageHeaderComponent } from '../../shared/ui/page-header/page-header.component';

@Component({
  selector: 'app-appearance-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PageHeaderComponent, IconComponent],
  templateUrl: './appearance-page.component.html',
  styleUrl: './appearance-page.component.css',
  host: { class: 'block' },
})
export class AppearancePageComponent {
  readonly themes = inject(ThemeService);
  private readonly toast = inject(ToastService);

  apply(id: ThemeId): void {
    this.themes.setTheme(id);
    const selected = this.themes.themes.find((theme) => theme.id === id);
    this.toast.success(`${selected?.name ?? 'Theme'} is now active on this device.`);
  }

  isActive(id: ThemeId): boolean {
    return this.themes.theme() === id;
  }
}
