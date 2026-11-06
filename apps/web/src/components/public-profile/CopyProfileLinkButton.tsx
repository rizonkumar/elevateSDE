'use client';

import * as React from 'react';
import { Check, Link2 } from 'lucide-react';

interface CopyProfileLinkButtonProps {
  path: string;
  label?: string;
  className?: string;
}

const RESET_DELAY_MS = 2000;

export function CopyProfileLinkButton({
  path,
  label = 'Copy link',
  className = '',
}: Readonly<CopyProfileLinkButtonProps>) {
  const [copied, setCopied] = React.useState(false);

  React.useEffect(() => {
    if (!copied) {
      return;
    }
    const timer = window.setTimeout(() => setCopied(false), RESET_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [copied]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}${path}`);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  const Icon = copied ? Check : Link2;

  return (
    <button
      type="button"
      onClick={() => void handleCopy()}
      aria-live="polite"
      className={`inline-flex h-9 items-center justify-center gap-2 rounded-(--radius-sm) border border-(--color-border) bg-(--color-bg) px-3 text-sm font-medium text-(--color-text-primary) transition-colors hover:bg-(--color-badge-bg) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-accent) cursor-pointer ${className}`.trim()}
    >
      <Icon className={`h-4 w-4 ${copied ? 'text-(--color-success)' : ''}`} />
      {copied ? 'Copied' : label}
    </button>
  );
}
