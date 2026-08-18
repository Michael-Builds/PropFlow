import {
  ChangeDetectionStrategy,
  Component,
  computed,
  forwardRef,
  input,
  signal,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { NavIconName } from '../../../core/interfaces/nav.interface';
import { IconComponent } from '../../icons/icon.component';

@Component({
  selector: 'app-input',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent],
  templateUrl: './input.component.html',
  styleUrl: './input.component.css',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => InputComponent),
      multi: true,
    },
  ],
  host: { class: 'block' },
})
export class InputComponent implements ControlValueAccessor {
  readonly label = input<string | null>(null);
  readonly hint = input<string | null>(null);
  readonly placeholder = input('');
  readonly type = input('text');
  readonly leftIcon = input<NavIconName | null>(null);
  readonly rightIcon = input<NavIconName | null>(null);

  readonly value = signal('');
  readonly isDisabled = signal(false);
  readonly showPassword = signal(false);

  readonly isPassword = computed(() => this.type() === 'password');
  readonly inputType = computed(() => {
    if (!this.isPassword()) return this.type();
    return this.showPassword() ? 'text' : 'password';
  });
  readonly showRightToggle = computed(() => this.isPassword());
  readonly showRightIcon = computed(() => !this.isPassword() && !!this.rightIcon());
  readonly resolvedPlaceholder = computed(() => {
    const explicit = this.placeholder().trim();
    if (explicit) return explicit;
    if (this.isPassword()) return '••••••••';
    if (this.type() === 'email') return 'name@example.com';
    if (this.type() === 'number') return '0';
    const label = this.label()?.trim();
    return label ? `Enter ${label.toLowerCase()}` : '';
  });

  private onChange: (value: string) => void = () => undefined;
  onTouched: () => void = () => undefined;

  writeValue(value: string | null): void {
    this.value.set(value ?? '');
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.isDisabled.set(isDisabled);
  }

  onInput(event: Event): void {
    const next = (event.target as HTMLInputElement).value;
    this.value.set(next);
    this.onChange(next);
  }

  togglePasswordVisibility(): void {
    this.showPassword.update((open) => !open);
  }
}
