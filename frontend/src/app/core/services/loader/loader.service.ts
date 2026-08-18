import { Injectable, computed, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class LoaderService {
  private readonly _count = signal(0);
  private readonly _label = signal('Processing...');

  readonly loading = computed(() => this._count() > 0);
  readonly label = computed(() => this._label());

  show(label?: string): void {
    if (label) this._label.set(label);
    this._count.update((n) => n + 1);
  }

  hide(): void {
    this._count.update((n) => Math.max(0, n - 1));
    if (this._count() === 0) this._label.set('Processing...');
  }

  reset(): void {
    this._count.set(0);
    this._label.set('Processing...');
  }
}
