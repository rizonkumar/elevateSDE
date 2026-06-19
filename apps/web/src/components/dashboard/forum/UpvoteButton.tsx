'use client';

import { motion } from 'framer-motion';
import { ChevronUp } from 'lucide-react';

interface UpvoteButtonProps {
  count: number;
  active: boolean;
  onToggle: () => void;
  orientation?: 'vertical' | 'horizontal';
}

export function UpvoteButton({
  count,
  active,
  onToggle,
  orientation = 'vertical',
}: UpvoteButtonProps) {
  const isVertical = orientation === 'vertical';
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.88 }}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onToggle();
      }}
      aria-pressed={active}
      aria-label={active ? 'Remove upvote' : 'Upvote'}
      className={`inline-flex items-center justify-center gap-1 rounded-(--radius-sm) border font-semibold transition-colors cursor-pointer focus:outline-none focus-visible:shadow-[0_0_0_2px_var(--color-bg),0_0_0_4px_var(--color-accent)] ${
        isVertical ? 'flex-col px-2.5 py-2 text-sm w-12' : 'px-2.5 py-1.5 text-xs'
      } ${
        active
          ? 'border-(--color-accent) bg-(--color-accent-soft) text-(--color-accent)'
          : 'border-(--color-border-subtle) bg-(--color-bg) text-(--color-text-muted) hover:border-(--color-accent) hover:text-(--color-accent)'
      }`}
    >
      <ChevronUp className={isVertical ? 'h-4 w-4' : 'h-3.5 w-3.5'} />
      <span>{count}</span>
    </motion.button>
  );
}
