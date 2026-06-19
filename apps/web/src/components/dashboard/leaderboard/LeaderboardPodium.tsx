'use client';

import { motion } from 'framer-motion';
import { Crown } from 'lucide-react';
import { Badge } from '@elevatesde/ui';
import type { LeaderboardEntryDto } from '@elevatesde/shared-types';
import { AuthorAvatar } from '@/components/dashboard/AuthorAvatar';
import { RankBadge } from '@/components/dashboard/leaderboard/RankBadge';

interface LeaderboardPodiumProps {
  entries: LeaderboardEntryDto[];
}

export function LeaderboardPodium({ entries }: LeaderboardPodiumProps) {
  if (entries.length === 0) {
    return null;
  }
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {entries.map((entry) => {
        const leader = entry.rank === 1;
        const topBadge = entry.badges[0];
        return (
          <motion.div
            key={entry.userId}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut', delay: entry.rank * 0.05 }}
            className={`flex flex-col items-center gap-3 rounded-md border bg-(--color-surface) p-5 text-center shadow-(--shadow-card) ${
              leader ? 'border-(--color-accent)' : 'border-(--color-border-subtle)'
            }`}
          >
            <div className="relative">
              <AuthorAvatar name={entry.name} size="lg" />
              {leader && (
                <Crown className="absolute -top-3 left-1/2 h-5 w-5 -translate-x-1/2 text-(--color-warning)" />
              )}
            </div>
            <div className="flex items-center gap-2">
              <RankBadge rank={entry.rank} />
              <span className="text-sm font-semibold text-(--color-text-primary)">{entry.name}</span>
            </div>
            {entry.headline && (
              <span className="text-xs text-(--color-text-muted)">{entry.headline}</span>
            )}
            <div className="font-display text-2xl font-semibold tracking-tight text-(--color-text-primary)">
              {entry.points.toLocaleString()}
              <span className="ml-1 text-xs font-medium text-(--color-text-muted)">pts</span>
            </div>
            {topBadge && <Badge variant="accent">{topBadge}</Badge>}
          </motion.div>
        );
      })}
    </div>
  );
}
