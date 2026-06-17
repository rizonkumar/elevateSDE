'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { useToastStore, Toast } from '../store/toast.store';

const TOAST_CONFIG: Record<
  Toast['type'],
  { Icon: typeof Info; chip: string }
> = {
  success: { Icon: CheckCircle2, chip: 'bg-emerald-500/15 text-emerald-500' },
  error: { Icon: AlertCircle, chip: 'bg-rose-500/15 text-rose-500' },
  info: { Icon: Info, chip: 'bg-teal-500/15 text-teal-500' },
};

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  return (
    <div className="pointer-events-none fixed top-4 right-4 z-[70] flex w-full max-w-sm flex-col gap-2.5">
      <AnimatePresence>
        {toasts.map((toast) => {
          const { Icon, chip } = TOAST_CONFIG[toast.type];
          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.15 } }}
              className="pointer-events-auto flex items-center gap-3 rounded-(--radius-lg) border border-(--color-border-subtle) bg-(--color-surface) p-3.5 shadow-(--shadow-soft)"
            >
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${chip}`}
              >
                <Icon className="h-4 w-4" />
              </span>
              <p className="flex-1 text-sm font-medium leading-snug text-(--color-text-primary)">
                {toast.message}
              </p>
              <button
                type="button"
                aria-label="Dismiss"
                onClick={() => removeToast(toast.id)}
                className="-mr-1 shrink-0 rounded-md p-1 text-(--color-text-muted) transition-colors hover:bg-(--color-badge-bg) hover:text-(--color-text-primary) cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
