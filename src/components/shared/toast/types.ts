import { createContext } from 'react';

export interface Toast {
  id: string;
  message: string;
  type: 'error' | 'warning' | 'info';
  duration?: number;
}

export interface ToastContextValue {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}

export const ToastContext = createContext<ToastContextValue | null>(null);
