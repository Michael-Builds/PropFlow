export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

export interface ToastOptions {
  title?: string;
  message: string;
  variant?: ToastVariant;
  durationMs?: number;
}

export interface Toast extends Required<Pick<ToastOptions, 'message' | 'variant' | 'durationMs'>> {
  id: string;
  title?: string;
  createdAt: number;
}
