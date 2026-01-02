import { AlertTriangle, Info, X, XCircle } from 'lucide-react';

import { useToast } from '@hooks/useToast';

import type { Toast as ToastType } from './types';

const typeStyles = {
  error: {
    container: 'bg-red-900/90 border-red-700',
    icon: 'text-red-400',
    text: 'text-red-100',
  },
  warning: {
    container: 'bg-amber-900/90 border-amber-700',
    icon: 'text-amber-400',
    text: 'text-amber-100',
  },
  info: {
    container: 'bg-zinc-800/90 border-zinc-600',
    icon: 'text-cyan-400',
    text: 'text-zinc-100',
  },
};

const typeIcons = {
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

function ToastItem({ toast }: { toast: ToastType }) {
  const { removeToast } = useToast();
  const styles = typeStyles[toast.type];
  const Icon = typeIcons[toast.type];

  return (
    <div
      className={`flex items-start gap-3 px-4 py-3 rounded-lg border backdrop-blur shadow-lg
        animate-in slide-in-from-right-full duration-200 ${styles.container}`}
    >
      <Icon size={18} className={`shrink-0 mt-0.5 ${styles.icon}`} />
      <p className={`text-sm flex-1 ${styles.text}`}>{toast.message}</p>
      <button
        onClick={() => removeToast(toast.id)}
        className="shrink-0 p-0.5 rounded hover:bg-white/10 transition-colors"
      >
        <X size={14} className="text-zinc-400" />
      </button>
    </div>
  );
}

export default function ToastContainer() {
  const { toasts } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-100 flex flex-col gap-2 max-w-sm">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  );
}
