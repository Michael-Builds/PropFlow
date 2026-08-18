import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { IconComponent } from '../../icons/icon.component';
import { NavIconName } from '../../../core/interfaces/nav.interface';
import { ButtonComponent } from '../button/button.component';

@Component({
  selector: 'app-empty-state',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent, ButtonComponent],
  templateUrl: './empty-state.component.html',
  styleUrl: './empty-state.component.css',
})
export class EmptyStateComponent {
  readonly title = input.required<string>();
  readonly description = input.required<string>();
  readonly icon = input<NavIconName>('info');
  readonly actionLabel = input<string | null>(null);
  readonly actionIcon = input<NavIconName | null>('plus');
  action?: () => void;
}
