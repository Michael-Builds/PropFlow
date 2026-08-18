import {
  ChangeDetectionStrategy,
  Component,
  computed,
  forwardRef,
  input,
  signal,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-textarea',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './textarea.component.html',
  styleUrl: './textarea.component.css',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TextareaComponent),
      multi: true,
    },
  ],
  host: { class: 'block' },
})
export class TextareaComponent implements ControlValueAccessor {
  readonly label = input<string | null>(null);
  readonly hint = input<string | null>(null);
  readonly placeholder = input('');
  readonly rows = input(4);

  readonly value = signal('');
  readonly isDisabled = signal(false);

  readonly resolvedPlaceholder = computed(() => {
    const explicit = this.placeholder().trim();
    if (explicit) return explicit;
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
    const next = (event.target as HTMLTextAreaElement).value;
    this.value.set(next);
    this.onChange(next);
  }
}
