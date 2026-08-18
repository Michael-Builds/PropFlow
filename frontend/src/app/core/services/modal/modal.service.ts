import { Injectable, signal } from '@angular/core';
import {
  ConfirmModalData,
  ModalInstance,
  ModalRef,
  OpenModalConfig,
} from '../../interfaces/modal.interface';

@Injectable({ providedIn: 'root' })
export class ModalService {
  private readonly _modals = signal<ModalInstance[]>([]);
  private readonly resolvers = new Map<string, (value: unknown) => void>();

  readonly modals = this._modals.asReadonly();

  open<TResult = unknown>(config: OpenModalConfig): ModalRef<TResult> {
    const id = crypto.randomUUID();
    const instance: ModalInstance = {
      id,
      title: config.title,
      size: config.size ?? 'md',
      dismissible: config.dismissible ?? true,
      data: config.data,
      component: config.component,
    };
    this._modals.update((items) => [...items, instance]);

    const closed = new Promise<TResult | undefined>((resolve) => {
      this.resolvers.set(id, resolve as (value: unknown) => void);
    });

    return {
      id,
      closed,
      close: (result?: TResult) => this.close(id, result),
    } as ModalRef<TResult> & { closed: Promise<TResult | undefined> };
  }

  confirm(data: ConfirmModalData): Promise<boolean> {
    const id = crypto.randomUUID();
    this._modals.update((items) => [
      ...items,
      {
        id,
        title: data.title,
        size: 'sm',
        dismissible: true,
        data: { ...data, __confirm: true },
      },
    ]);
    return new Promise<boolean>((resolve) => {
      this.resolvers.set(id, (value) => resolve(Boolean(value)));
    });
  }

  close(id: string, result?: unknown): void {
    this._modals.update((items) => items.filter((modal) => modal.id !== id));
    const resolve = this.resolvers.get(id);
    if (resolve) {
      resolve(result);
      this.resolvers.delete(id);
    }
  }

  closeAll(): void {
    this._modals().forEach((modal) => this.close(modal.id));
  }
}
