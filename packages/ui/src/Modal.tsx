import * as React from 'react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
}

export function Modal({ open, onClose, title, description, children }: ModalProps) {
  const panelRef = React.useRef<HTMLDivElement>(null);
  const onCloseRef = React.useRef(onClose);

  React.useEffect(() => {
    onCloseRef.current = onClose;
  });

  React.useEffect(() => {
    if (!open) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCloseRef.current();
    };
    document.addEventListener('keydown', handleKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panelRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <button
        type="button"
        aria-label="Close dialog"
        onClick={onClose}
        className="absolute inset-0 bg-black/40 motion-safe:animate-[fadeIn_150ms_ease-out]"
      />
      <div
        ref={panelRef}
        tabIndex={-1}
        className="relative w-full sm:max-w-lg max-h-[92vh] overflow-y-auto bg-(--color-surface) border border-(--color-border-subtle) rounded-t-(--radius-md) sm:rounded-(--radius-md) shadow-(--shadow-modal) focus:outline-none"
      >
        <div className="flex items-start justify-between gap-4 px-5 sm:px-6 pt-5 pb-4 border-b border-(--color-border-subtle)">
          <div className="flex flex-col gap-1">
            <h2 className="text-lg font-semibold tracking-tight text-(--color-text-primary)">
              {title}
            </h2>
            {description && (
              <p className="text-sm text-(--color-text-muted)">{description}</p>
            )}
          </div>
          <button
            type="button"
            aria-label="Close dialog"
            onClick={onClose}
            className="shrink-0 -mr-1 -mt-1 p-2 rounded-full text-(--color-text-muted) hover:bg-(--color-badge-bg) hover:text-(--color-text-primary) transition cursor-pointer"
          >
            <svg viewBox="0 0 20 20" fill="none" className="w-4 h-4">
              <path
                d="M5 5l10 10M15 5L5 15"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
        <div className="px-5 sm:px-6 py-5">{children}</div>
      </div>
    </div>
  );
}
