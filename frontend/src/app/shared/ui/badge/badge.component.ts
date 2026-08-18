import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { BadgeVariant } from '../../../core/interfaces/badge.interface';

export type { BadgeVariant } from '../../../core/interfaces/badge.interface';

@Component({
  selector: 'app-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './badge.component.html',
  styleUrl: './badge.component.css',
})
export class BadgeComponent {
  readonly variant = input<BadgeVariant>('neutral');
  readonly label = input<string | null>(null);

  get classes(): string {
    const base =
      'inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold tracking-wide';

    const variants: Record<BadgeVariant, string> = {
      neutral: 'bg-border-light text-text-secondary',
      brand: 'bg-brand-soft text-brand',
      success: 'bg-success-soft text-success',
      warning: 'bg-warning-soft text-warning',
      danger: 'bg-danger-soft text-danger',
      info: 'bg-info-soft text-info',
    };

    return `${base} ${variants[this.variant()]}`;
  }
}
