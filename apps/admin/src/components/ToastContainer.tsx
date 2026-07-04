'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';
import { useToastStore, Toast } from '../store/toast.store';

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  const getIcon = (type: Toast['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 shrink-0 text-(--color-success)" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 shrink-0 text-(--color-danger)" />;
      case 'info':
        return <Info className="h-5 w-5 shrink-0 text-(--color-accent)" />;
    }
  };

  const getStyles = (type: Toast['type']) => {
    switch (type) {
      case 'success':
        return 'border-(--color-border-subtle) border-l-(--color-success) bg-(--color-surface) text-(--color-text-primary)';
      case 'error':
        return 'border-(--color-border-subtle) border-l-(--color-danger) bg-(--color-surface) text-(--color-text-primary)';
      case 'info':
        return 'border-(--color-border-subtle) border-l-(--color-accent) bg-(--color-surface) text-(--color-text-primary)';
    }
  };

  return (
    <div className="pointer-events-none fixed top-4 right-4 z-50 flex w-full max-w-sm flex-col gap-3">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
            className={`pointer-events-auto flex gap-3 rounded-lg border border-l-4 p-4 shadow-lg ${getStyles(
              toast.type,
            )}`}
          >
            {getIcon(toast.type)}
            <p className="flex-1 text-sm leading-5 font-semibold">{toast.message}</p>
            <button
              onClick={() => removeToast(toast.id)}
              className="shrink-0 cursor-pointer hover:opacity-70"
            >
              <X className="h-4 w-4 text-zinc-400 dark:text-zinc-500" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
