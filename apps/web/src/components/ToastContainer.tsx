'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';
import { useToastStore, Toast } from '../store/toast.store';

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  const getIcon = (type: Toast['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />;
      case 'info':
        return <Info className="w-5 h-5 text-sky-500 shrink-0" />;
    }
  };

  const getStyles = (type: Toast['type']) => {
    switch (type) {
      case 'success':
        return 'border-emerald-500/20 bg-emerald-50/50 text-emerald-900 dark:bg-emerald-950/20 dark:text-emerald-300';
      case 'error':
        return 'border-rose-500/20 bg-rose-50/50 text-rose-900 dark:bg-rose-950/20 dark:text-rose-300';
      case 'info':
        return 'border-sky-500/20 bg-sky-50/50 text-sky-900 dark:bg-sky-950/20 dark:text-sky-300';
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
            className={`pointer-events-auto flex gap-3 p-4 rounded-lg border shadow-lg backdrop-blur-sm ${getStyles(
              toast.type
            )}`}
          >
            {getIcon(toast.type)}
            <p className="text-sm font-medium leading-5 flex-1">{toast.message}</p>
            <button
              onClick={() => removeToast(toast.id)}
              className="hover:opacity-70 shrink-0 cursor-pointer"
            >
              <X className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
