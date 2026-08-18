import { NgStyle } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  Injector,
  OnDestroy,
  afterNextRender,
  computed,
  forwardRef,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { IconComponent } from '../../icons/icon.component';
import { SelectOption, SelectSize } from '../../../core/interfaces/select.interface';

export type { SelectOption, SelectSize } from '../../../core/interfaces/select.interface';

@Component({
  selector: 'app-select',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent, NgStyle],
  templateUrl: './select.component.html',
  styleUrl: './select.component.css',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SelectComponent),
      multi: true,
    },
  ],
  host: {
    class: 'block',
    '[class.w-full]': 'stretch()',
    '[class.w-auto]': 'stretch() === false',
  },
})
export class SelectComponent implements ControlValueAccessor, OnDestroy {
  private readonly injector = inject(Injector);
  private readonly root = viewChild.required<ElementRef<HTMLElement>>('root');
  private readonly trigger = viewChild.required<ElementRef<HTMLButtonElement>>('trigger');
  private readonly menu = viewChild<ElementRef<HTMLElement>>('menu');

  readonly label = input<string | null>(null);
  readonly hint = input<string | null>(null);
  readonly leadingLabel = input<string | null>(null);
  readonly placeholder = input('Select an option');
  readonly options = input<SelectOption[]>([]);
  readonly size = input<SelectSize>('md');
  readonly searchable = input(false);
  readonly emptyLabel = input('No options found');
  readonly stretch = input(true);

  readonly valueChange = output<string>();

  readonly value = signal('');
  readonly open = signal(false);
  readonly search = signal('');
  readonly isDisabled = signal(false);
  readonly menuStyle = signal<Record<string, string>>({});

  readonly selectedLabel = computed(() => {
    const match = this.options().find((option) => option.value === this.value());
    return match?.label ?? null;
  });

  readonly filteredOptions = computed(() => {
    const q = this.search().trim().toLowerCase();
    if (!q || !this.searchable()) return this.options();
    return this.options().filter((option) => option.label.toLowerCase().includes(q));
  });

  private onChange: (value: string) => void = () => undefined;
  private onTouched: () => void = () => undefined;
  private readonly onCaptureScroll = (): void => {
    if (this.open()) this.reposition();
  };

  constructor() {
    document.addEventListener('scroll', this.onCaptureScroll, true);
  }

  ngOnDestroy(): void {
    document.removeEventListener('scroll', this.onCaptureScroll, true);
    this.detachMenu();
  }

  @HostListener('document:mousedown', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.open()) return;
    const target = event.target as Node;
    const inRoot = this.root().nativeElement.contains(target);
    const inMenu = this.menu()?.nativeElement.contains(target) ?? false;
    if (!inRoot && !inMenu) this.close();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.open()) this.close();
  }

  @HostListener('window:resize')
  onViewportChange(): void {
    if (!this.open()) return;
    this.reposition();
  }

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

  toggle(): void {
    if (this.isDisabled()) return;
    if (this.open()) this.close();
    else this.openMenu();
  }

  select(option: SelectOption): void {
    this.value.set(option.value);
    this.onChange(option.value);
    this.valueChange.emit(option.value);
    this.onTouched();
    this.close();
  }

  onSearch(event: Event): void {
    this.search.set((event.target as HTMLInputElement).value);
  }

  close(): void {
    this.detachMenu();
    this.open.set(false);
    this.search.set('');
    this.onTouched();
  }

  get triggerClass(): string {
    const size =
      this.size() === 'sm'
        ? 'h-10 px-3 text-sm'
        : 'h-11 px-3.5 text-sm md:h-12 md:px-4 md:text-base';
    return [
      'flex w-full items-center justify-between gap-2 rounded-md border bg-white text-left outline-none transition',
      size,
      this.open() ? 'border-brand' : 'border-border hover:border-brand/40',
      this.isDisabled() ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
    ].join(' ');
  }

  private openMenu(): void {
    this.reposition();
    this.open.set(true);
    afterNextRender(
      () => {
        const menuEl = this.menu()?.nativeElement;
        if (!menuEl || !this.open()) return;
        if (menuEl.parentElement !== document.body) {
          document.body.appendChild(menuEl);
        }
        this.reposition();
      },
      { injector: this.injector },
    );
  }

  private reposition(): void {
    const trigger = this.trigger()?.nativeElement;
    if (!trigger) return;

    const rect = trigger.getBoundingClientRect();
    const gap = 6;
    const maxMenuHeight = 224;
    const spaceBelow = window.innerHeight - rect.bottom - gap;
    const spaceAbove = rect.top - gap;
    const openUp = spaceBelow < Math.min(maxMenuHeight, 160) && spaceAbove > spaceBelow;

    const left = Math.min(Math.max(16, rect.left), window.innerWidth - rect.width - 16);
    const style: Record<string, string> = {
      left: `${left}px`,
      width: `${rect.width}px`,
      minWidth: `${rect.width}px`,
      maxWidth: 'min(18rem, calc(100vw - 2rem))',
    };

    if (openUp) {
      style['bottom'] = `${window.innerHeight - rect.top + gap}px`;
      style['top'] = 'auto';
      style['maxHeight'] = `${Math.min(maxMenuHeight, Math.max(120, spaceAbove))}px`;
    } else {
      style['top'] = `${rect.bottom + gap}px`;
      style['bottom'] = 'auto';
      style['maxHeight'] = `${Math.min(maxMenuHeight, Math.max(120, spaceBelow))}px`;
    }

    this.menuStyle.set(style);
  }

  private detachMenu(): void {
    const menuEl = this.menu()?.nativeElement;
    if (menuEl?.parentElement === document.body) {
      menuEl.remove();
    }
  }
}