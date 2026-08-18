import {
  ChangeDetectionStrategy,
  Component,
  effect,
  forwardRef,
  input,
  output,
  signal,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { IconComponent } from '../../icons/icon.component';
import { CheckboxSize } from '../../../core/interfaces/checkbox.interface';

export type { CheckboxSize } from '../../../core/interfaces/checkbox.interface';

@Component({
  selector: 'app-checkbox',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent],
  templateUrl: './checkbox.component.html',
  styleUrl: './checkbox.component.css',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CheckboxComponent),
      multi: true,
    },
  ],
  host: {
    class: 'inline-flex max-w-full',
  },
})
export class CheckboxComponent implements ControlValueAccessor {
  readonly label = input<string | null>(null);
  readonly description = input<string | null>(null);
  readonly size = input<CheckboxSize>('md');
  readonly indeterminate = input(false);
  readonly ariaLabel = input<string | null>(null);
  readonly checked = input<boolean | undefined>(undefined);

  readonly checkedChange = output<boolean>();

  readonly value = signal(false);
  readonly isDisabled = signal(false);

  private onChange: (value: boolean) => void = () => undefined;
  onTouched: () => void = () => undefined;

  constructor() {
    effect(() => {
      const external = this.checked();
      if (external !== undefined) {
        this.value.set(external);
      }
    });
  }

  writeValue(value: boolean | null): void {
    this.value.set(Boolean(value));
  }

  registerOnChange(fn: (value: boolean) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.isDisabled.set(isDisabled);
  }

  toggle(): void {
    if (this.isDisabled()) return;
    const next = this.indeterminate() ? true : !this.value();
    this.value.set(next);
    this.onChange(next);
    this.checkedChange.emit(next);
    this.onTouched();
  }

  get boxClass(): string {
    const size = this.size() === 'sm' ? 'size-4.5' : 'size-[1.125rem]';
    const active = this.value() || this.indeterminate();
    return [
      size,
      'inline-flex shrink-0 items-center justify-center rounded-sm border transition-all duration-150',
      active
        ? 'border-brand bg-brand text-white'
        : 'border-border bg-white text-transparent group-hover:border-brand/45',
      this.isDisabled() ? 'opacity-50' : '',
    ].join(' ');
  }
}
