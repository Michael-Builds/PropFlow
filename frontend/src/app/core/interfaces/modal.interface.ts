import { Type } from '@angular/core';

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl';

export interface ModalRef<TResult = unknown> {
  id: string;
  close: (result?: TResult) => void;
  closed?: Promise<TResult | undefined>;
}

export interface ConfirmModalData {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'default' | 'danger' | 'warning';
}

export interface OpenModalConfig<TData = unknown> {
  title?: string;
  size?: ModalSize;
  data?: TData;
  component?: Type<unknown>;
  dismissible?: boolean;
}

export interface ModalInstance {
  id: string;
  title?: string;
  size: ModalSize;
  dismissible: boolean;
  data?: unknown;
  component?: Type<unknown>;
}
