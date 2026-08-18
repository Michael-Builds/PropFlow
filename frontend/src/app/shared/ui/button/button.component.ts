import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { IconComponent } from '../../icons/icon.component';
import { NavIconName } from '../../../core/interfaces/nav.interface';
import { ButtonSize, ButtonVariant } from '../../../core/interfaces/button.interface';

export type { ButtonVariant, ButtonSize } from '../../../core/interfaces/button.interface';

@Component({
  selector: 'app-button',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent],
  templateUrl: './button.component.html',
  styleUrl: './button.component.css',
  host: {
    '[class]': 'hostClass',
  },
})
export class ButtonComponent {
  readonly variant = input<ButtonVariant>('primary');
  readonly size = input<ButtonSize>('md');
  readonly type = input<'button' | 'submit' | 'reset'>('button');
  readonly disabled = input(false);
  readonly loading = input(false);
  readonly icon = input<NavIconName | null>(null);
  readonly iconOnly = input(false);
  readonly label = input<string | null>(null);
  readonly ariaLabel = input<string | null>(null);
  readonly pressed = output<MouseEvent>();

  get isActionIcon(): boolean {
    return this.isRowActionVariant() || this.iconOnly();
  }

  get hostClass(): string {
    return this.isActionIcon
      ? 'inline-flex size-8 shrink-0'
      : 'inline-flex max-w-full align-middle';
  }

  get iconSize(): number {
    if (this.size() === 'xs') return 14;
    if (this.size() === 'sm') return 14;
    if (this.size() === 'lg') return 18;
    return 16;
  }

  get classes(): string {
    const base =
      'inline-flex w-full items-center justify-center gap-1.5 rounded-md font-medium transition-colors duration-200 ease-out touch-manipulation disabled:opacity-50 disabled:pointer-events-none cursor-pointer shadow-none';

    const variants: Record<ButtonVariant, string> = {
      primary: 'bg-brand text-white hover:bg-brand-dark',
      secondary:
        'bg-white text-text-secondary border border-border hover:bg-brand-muted hover:text-text-primary',
      ghost: 'bg-transparent text-text-secondary hover:bg-surface hover:text-text-primary',
      danger: 'bg-danger text-white hover:bg-danger/90',
      soft: 'bg-brand-soft text-brand hover:bg-brand/15',
      icon: 'bg-border-light text-text-muted hover:bg-border hover:text-text-primary',
      view: 'bg-info-soft text-info hover:bg-info/25',
      edit: 'bg-warning-soft text-warning hover:bg-warning/25',
      delete: 'bg-danger-soft text-danger hover:bg-danger/25',
      approve: 'bg-success-soft text-success hover:bg-success/25',
    };

    const sizes: Record<ButtonSize, string> = {
      xs: 'h-7 px-2 text-xs',
      sm: 'h-8 px-3 text-xs md:h-9 md:px-3.5 md:text-sm',
      md: 'h-9 px-4 text-sm md:h-11 md:px-4 md:text-base',
      lg: 'h-11 px-5 text-sm md:h-12 md:px-5 md:text-base',
    };

    if (this.isActionIcon) {
      return `${base} ${variants[this.variant()]} size-full p-0`.trim();
    }

    return `${base} ${variants[this.variant()]} ${sizes[this.size()]}`.trim();
  }

  private isRowActionVariant(): boolean {
    const variant = this.variant();
    return (
      variant === 'view' ||
      variant === 'edit' ||
      variant === 'delete' ||
      variant === 'approve' ||
      variant === 'icon'
    );
  }
}
