import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { IconComponent } from '../../icons/icon.component';
import { NavIconName } from '../../../core/interfaces/nav.interface';

@Component({
  selector: 'app-stat-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent],
  templateUrl: './stat-card.component.html',
  styleUrl: './stat-card.component.css',
})
export class StatCardComponent {
  readonly label = input.required<string>();
  readonly value = input.required<string>();
  readonly hint = input<string | null>(null);
  readonly icon = input<NavIconName>('activity');
}
