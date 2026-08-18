import { Injectable, signal } from '@angular/core';
import { Toast, ToastOptions, ToastVariant } from '../../interfaces/toast.interface';

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly _toasts = signal<Toast[]>([]);
  readonly toasts = this._toasts.asReadonly();

  show(options: ToastOptions): string {
    const id = crypto.randomUUID();
    const toast: Toast = {
      id,
      title: options.title,
      message: options.message,
      variant: options.variant ?? 'info',
      durationMs: options.durationMs ?? 4200,
      createdAt: Date.now(),
    };
    this._toasts.update((items) => [...items, toast]);
    if (toast.durationMs > 0) {
      window.setTimeout(() => this.dismiss(id), toast.durationMs);
    }
    return id;
  }

  success(message: string, title = 'Success'): string {
    return this.show({ message, title, variant: 'success' });
  }

  error(message: string, title = 'Error'): string {
    return this.show({ message, title, variant: 'error', durationMs: 5600 });
  }

  warning(message: string, title = 'Warning'): string {
    return this.show({ message, title, variant: 'warning' });
  }

  info(message: string, title = 'Info'): string {
    return this.show({ message, title, variant: 'info' });
  }

  dismiss(id: string): void {
    this._toasts.update((items) => items.filter((toast) => toast.id !== id));
  }

  clear(): void {
    this._toasts.set([]);
  }

  variantIcon(variant: ToastVariant): 'check' | 'error' | 'warning' | 'info' {
    switch (variant) {
      case 'success':
        return 'check';
      case 'error':
        return 'error';
      case 'warning':
        return 'warning';
      default:
        return 'info';
    }
  }
}
