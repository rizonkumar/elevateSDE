'use client';

import * as React from 'react';
import { RadialBar, RadialBarChart, PolarAngleAxis, ResponsiveContainer } from 'recharts';
import { Award, Flame, Trophy, Zap } from 'lucide-react';
import { Badge } from '@elevatesde/ui';
import type { AssessmentDifficulty, UserDto } from '@elevatesde/shared-types';
import { PageContainer } from '@/components/dashboard/PageContainer';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { ContributionHeatmap } from '@/components/dashboard/profile/ContributionHeatmap';
import { ProfileAchievements } from '@/components/dashboard/profile/ProfileAchievements';
import { useProfileStore } from '@/store/profile.store';

const DIFFICULTIES: { key: AssessmentDifficulty; label: string; tone: string }[] = [
  { key: 'EASY', label: 'Easy', tone: 'text-(--color-success)' },
  { key: 'MEDIUM', label: 'Medium', tone: 'text-(--color-warning)' },
  { key: 'HARD', label: 'Hard', tone: 'text-(--color-danger)' },
];

const cardClass =
  'rounded-md border border-(--color-border-subtle) bg-(--color-surface) p-6 shadow-(--shadow-card)';

function initials(user: UserDto): string {
  const first = user.firstName?.trim()?.[0];
  const last = user.lastName?.trim()?.[0];
  if (first || last) {
    return `${first ?? ''}${last ?? ''}`.toUpperCase();
  }
  return user.email.slice(0, 2).toUpperCase();
}

function displayName(user: UserDto): string {
  const name = [user.firstName, user.lastName].filter((part) => part && part.trim()).join(' ');
  return name.length > 0 ? name : user.email;
}

function joinedLabel(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}

function submissionDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default function ProfilePage() {
  const user = useProfileStore((state) => state.user);
  const stats = useProfileStore((state) => state.stats);
  const streak = useProfileStore((state) => state.streak);
  const heatmap = useProfileStore((state) => state.heatmap);
  const hasLoaded = useProfileStore((state) => state.hasLoaded);
  const loadProfile = useProfileStore((state) => state.loadProfile);

  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    void loadProfile();
  }, [loadProfile]);

  if (!hasLoaded || !user || !stats) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center py-24 text-sm text-(--color-text-muted)">
          {hasLoaded ? 'Could not load your profile.' : 'Loading…'}
        </div>
      </PageContainer>
    );
  }

  const { assessments, leaderboard } = stats;
  const tiles = [
    { icon: Zap, label: 'Points', value: leaderboard.points.toLocaleString() },
    { icon: Trophy, label: 'Global rank', value: leaderboard.rank ? `#${leaderboard.rank}` : '—' },
    { icon: Flame, label: 'Current streak', value: `${streak?.current ?? leaderboard.streakDays} d` },
    { icon: Award, label: 'Longest streak', value: `${streak?.longest ?? 0} d` },
  ];

  return (
    <PageContainer>
      <div className="flex flex-col gap-6 sm:gap-8">
        <PageHeader kicker="Profile" title="Your coding profile" />

        <div className={cardClass}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <span className="inline-flex h-16 w-16 shrink-0 items-center justify-center rounded-(--radius-full) bg-(--color-accent-soft) font-display text-xl font-semibold text-(--color-accent)">
              {initials(user)}
            </span>
            <div className="min-w-0">
              <h2 className="m-0 font-display text-xl font-semibold tracking-tight">
                {displayName(user)}
              </h2>
              {user.headline && (
                <p className="mt-1 mb-0 text-sm text-(--color-text-muted)">{user.headline}</p>
              )}
              <p className="mt-1 mb-0 text-xs text-(--color-text-muted)">
                Joined {joinedLabel(user.createdAt)}
              </p>
            </div>
          </div>
        </div>

        <ProfileAchievements />

        <div className="grid gap-6 lg:grid-cols-2">
          <div className={cardClass}>
            <h3 className="m-0 mb-4 font-display text-sm font-semibold uppercase tracking-wider text-(--color-text-muted)">
              Solved
            </h3>
            <div className="flex items-center gap-6">
              <div className="relative h-36 w-36 shrink-0">
                {mounted && (
                  <ResponsiveContainer width="100%" height="100%">
                    <RadialBarChart
                      innerRadius="78%"
                      outerRadius="100%"
                      data={[{ name: 'acceptance', value: assessments.acceptanceRate }]}
                      startAngle={90}
                      endAngle={-270}
                    >
                      <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                      <RadialBar
                        background={{ fill: 'var(--color-badge-bg)' }}
                        dataKey="value"
                        cornerRadius={20}
                        angleAxisId={0}
                        fill="var(--color-accent)"
                      />
                    </RadialBarChart>
                  </ResponsiveContainer>
                )}
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <div className="font-display text-3xl font-semibold leading-none">
                    {assessments.problemsSolved}
                  </div>
                  <div className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-(--color-text-muted)">
                    Solved
                  </div>
                </div>
              </div>
              <div className="flex flex-1 flex-col gap-3">
                {DIFFICULTIES.map((difficulty) => (
                  <div key={difficulty.key} className="flex items-center justify-between text-sm">
                    <span className={`font-medium ${difficulty.tone}`}>{difficulty.label}</span>
                    <span className="tabular-nums">{assessments.byDifficulty[difficulty.key]}</span>
                  </div>
                ))}
                <div className="mt-1 flex items-center justify-between border-t border-(--color-border-subtle) pt-2 text-sm">
                  <span className="text-(--color-text-muted)">Acceptance</span>
                  <span className="font-semibold tabular-nums">{assessments.acceptanceRate}%</span>
                </div>
              </div>
            </div>
          </div>

          <div className={cardClass}>
            <h3 className="m-0 mb-4 font-display text-sm font-semibold uppercase tracking-wider text-(--color-text-muted)">
              Standing
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {tiles.map((tile) => {
                const Icon = tile.icon;
                return (
                  <div
                    key={tile.label}
                    className="flex items-center gap-3 rounded-md border border-(--color-border-subtle) bg-(--color-bg-soft) p-3"
                  >
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-(--radius-full) bg-(--color-accent-soft) text-(--color-accent)">
                      <Icon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <div className="font-display text-lg font-semibold leading-none">
                        {tile.value}
                      </div>
                      <div className="mt-1 text-[11px] text-(--color-text-muted)">{tile.label}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className={cardClass}>
          <h3 className="m-0 mb-4 font-display text-sm font-semibold uppercase tracking-wider text-(--color-text-muted)">
            Activity
          </h3>
          {heatmap ? (
            <ContributionHeatmap cells={heatmap.cells} />
          ) : (
            <p className="m-0 text-sm text-(--color-text-muted)">No activity yet.</p>
          )}
        </div>

        <div className={cardClass}>
          <h3 className="m-0 mb-4 font-display text-sm font-semibold uppercase tracking-wider text-(--color-text-muted)">
            Recent submissions
          </h3>
          {stats.recentSubmissions.length > 0 ? (
            <ul className="m-0 flex list-none flex-col gap-2 p-0">
              {stats.recentSubmissions.map((submission, index) => (
                <li
                  key={`${submission.problemTitle}-${index}`}
                  className="flex items-center justify-between gap-3 border-b border-(--color-border-subtle) pb-2 last:border-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{submission.problemTitle}</div>
                    <div className="text-xs text-(--color-text-muted)">
                      {submission.passedCount}/{submission.totalCount} passed ·{' '}
                      {submissionDate(submission.createdAt)}
                    </div>
                  </div>
                  <Badge variant={submission.status === 'ACCEPTED' ? 'success' : 'neutral'}>
                    {submission.status}
                  </Badge>
                </li>
              ))}
            </ul>
          ) : (
            <p className="m-0 text-sm text-(--color-text-muted)">No submissions yet.</p>
          )}
        </div>
      </div>
    </PageContainer>
  );
}
