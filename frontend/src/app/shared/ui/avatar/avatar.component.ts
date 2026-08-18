import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { AvatarRounded, AvatarSize } from '../../../core/interfaces/avatar.interface';

export type { AvatarRounded, AvatarSize } from '../../../core/interfaces/avatar.interface';

const SIZE_MAP: Record<Exclude<AvatarSize, number>, number> = {
  sm: 32,
  md: 40,
  lg: 56,
  xl: 72,
};

@Component({
  selector: 'app-avatar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './avatar.component.html',
  styleUrl: './avatar.component.css',
  host: {
    class: 'inline-flex shrink-0',
    '[style.width.px]': 'pixelSize()',
    '[style.height.px]': 'pixelSize()',
  },
})
export class AvatarComponent {
  readonly initials = input.required<string>();
  readonly size = input<AvatarSize>('md');
  readonly bgColor = input('#0028f2');
  readonly textColor = input('#ffffff');
  readonly rounded = input<AvatarRounded>('xl');
  readonly label = input<string | null>(null);

  readonly pixelSize = computed(() => {
    const size = this.size();
    return typeof size === 'number' ? size : SIZE_MAP[size];
  });

  readonly fontSize = computed(() => Math.round(this.pixelSize() * 0.36));

  readonly roundedClass = computed(() => {
    const map: Record<AvatarRounded, string> = {
      md: 'rounded-md',
      lg: 'rounded-lg',
      xl: 'rounded-xl',
      '2xl': 'rounded-2xl',
      full: 'rounded-full',
    };
    return map[this.rounded()];
  });

  readonly classes = computed(
    () =>
      `inline-flex size-full items-center justify-center font-semibold tracking-wide uppercase select-none ${this.roundedClass()}`,
  );
}
