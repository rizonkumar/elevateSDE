import * as React from 'react';
import { Modal } from '@elevatesde/ui';
import { Flame } from 'lucide-react';

interface StreakCelebrationModalProps {
  open: boolean;
  streak: number;
  onClose: () => void;
}

export function StreakCelebrationModal({ open, streak, onClose }: StreakCelebrationModalProps) {
  return (
    <Modal open={open} onClose={onClose} title="Daily Coding Challenge Completed!">
      <div className="flex flex-col items-center gap-5 py-2 text-center">
        <span className="inline-flex h-20 w-20 items-center justify-center rounded-(--radius-full) bg-(--color-accent-soft) text-(--color-accent)">
          <Flame className="h-9 w-9" />
        </span>
        <div>
          <div className="text-sm text-(--color-text-muted)">Completion Streak</div>
          <div className="mt-1 font-display text-4xl font-semibold tracking-tight">
            {streak}{' '}
            <span className="text-lg font-medium text-(--color-text-muted)">
              {streak === 1 ? 'Day' : 'Days'}
            </span>
          </div>
        </div>
        <p className="m-0 max-w-xs text-sm text-(--color-text-muted)">
          Consistency is key, see you tomorrow!
        </p>
      </div>
    </Modal>
  );
}
