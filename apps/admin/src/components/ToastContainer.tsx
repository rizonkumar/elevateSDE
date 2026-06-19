'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';
import { useToastStore, Toast } from '../store/toast.store';

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  const getIcon = (type: Toast['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-(--color-success) shrink-0" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-(--color-danger) shrink-0" />;
      case 'info':
        return <Info className="w-5 h-5 text-(--color-accent) shrink-0" />;
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
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-3 w-full max-w-sm pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
            className={`pointer-events-auto flex gap-3 p-4 rounded-lg border border-l-4 shadow-lg ${getStyles(
              toast.type,
            )}`}
          >
            {getIcon(toast.type)}
            <p className="text-sm font-semibold leading-5 flex-1">{toast.message}</p>
            <button
              onClick={() => removeToast(toast.id)}
              className="hover:opacity-70 shrink-0 cursor-pointer"
            >
              <X className="w-4 h-4 text-zinc-400 dark:text-zinc-500" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
