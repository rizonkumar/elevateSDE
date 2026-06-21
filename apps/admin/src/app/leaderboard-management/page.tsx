'use client';

import * as React from 'react';
import { AdminLayout } from '../../components/AdminLayout';
import { Badge } from '../../components/ui';
import { useToastStore } from '../../store/toast.store';
import { BADGE_KEYS, adjustStanding, getStandings } from '../../lib/leaderboard-management-data';
import { getNameInitials } from '../../lib/relative-time';
import { Button, Input, Modal } from '@elevatesde/ui';
import type { LeaderboardEntryDto } from '@elevatesde/shared-types';
import { Award, Flame, Search, Trophy, Users } from 'lucide-react';

function rerank(entries: LeaderboardEntryDto[]): LeaderboardEntryDto[] {
  return [...entries]
    .sort((a, b) => b.points - a.points)
    .map((entry, index) => ({ ...entry, rank: index + 1 }));
}

export default function LeaderboardManagementPage() {
  const addToast = useToastStore((state) => state.addToast);
  const [entries, setEntries] = React.useState<LeaderboardEntryDto[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [query, setQuery] = React.useState('');

  const [adjustTarget, setAdjustTarget] = React.useState<LeaderboardEntryDto | null>(null);
  const [draftPoints, setDraftPoints] = React.useState('');
  const [draftBadges, setDraftBadges] = React.useState<string[]>([]);
  const [saving, setSaving] = React.useState(false);

  const loadStandings = React.useCallback(async () => {
    try {
      const data = await getStandings();
      setEntries(rerank(data));
    } catch {
      addToast('Failed to retrieve leaderboard standings.', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  React.useEffect(() => {
    loadStandings();
  }, [loadStandings]);

  const openAdjust = (entry: LeaderboardEntryDto) => {
    setAdjustTarget(entry);
    setDraftPoints(String(entry.points));
    setDraftBadges(entry.badges);
  };

  const closeAdjust = () => {
    setAdjustTarget(null);
    setDraftPoints('');
    setDraftBadges([]);
  };

  const toggleBadge = (badge: string) => {
    setDraftBadges((prev) =>
      prev.includes(badge) ? prev.filter((item) => item !== badge) : [...prev, badge],
    );
  };

  const handleSave = async () => {
    if (!adjustTarget) return;
    const nextPoints = Number(draftPoints);
    if (!Number.isFinite(nextPoints) || nextPoints < 0) {
      addToast('Enter a valid points value.', 'error');
      return;
    }
    const targetId = adjustTarget.userId;
    setSaving(true);
    try {
      const standings = await adjustStanding(targetId, Math.round(nextPoints), draftBadges);
      setEntries(rerank(standings));
      addToast('Member standing updated.', 'success');
      closeAdjust();
    } catch {
      addToast('Could not update the member standing.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const normalizedQuery = query.trim().toLowerCase();
  const matched = entries.filter(
    (entry) =>
      normalizedQuery.length === 0 || entry.name.toLowerCase().includes(normalizedQuery),
  );

  const topContributor = entries[0] ?? null;

  return (
    <AdminLayout>
      {loading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <span className="text-sm text-(--color-text-muted) animate-pulse">
            Retrieving leaderboard standings...
          </span>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-xl border border-(--color-border-subtle) bg-(--color-surface) shadow-sm p-5 flex items-center gap-4">
              <div className="shrink-0 w-11 h-11 rounded-lg bg-(--color-accent-soft) text-(--color-accent) flex items-center justify-center">
                <Trophy className="w-5 h-5 shrink-0" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-(--color-text-muted) uppercase tracking-wider">
                  Top contributor
                </span>
                <span className="text-sm font-semibold text-(--color-text-primary)">
                  {topContributor ? topContributor.name : '—'}
                </span>
                {topContributor && (
                  <span className="text-xs text-(--color-text-muted) font-mono">
                    {topContributor.points.toLocaleString()} pts
                  </span>
                )}
              </div>
            </div>
            <div className="rounded-xl border border-(--color-border-subtle) bg-(--color-surface) shadow-sm p-5 flex items-center gap-4">
              <div className="shrink-0 w-11 h-11 rounded-lg bg-(--color-badge-bg) text-(--color-text-muted) flex items-center justify-center">
                <Users className="w-5 h-5 shrink-0" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-(--color-text-muted) uppercase tracking-wider">
                  Active members
                </span>
                <span className="text-sm font-semibold text-(--color-text-primary)">
                  {entries.length}
                </span>
              </div>
            </div>
          </div>

          <div className="sm:max-w-xs">
            <Input
              type="text"
              placeholder="Search members"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              icon={<Search className="w-4 h-4 text-(--color-text-muted)" />}
            />
          </div>

          <div className="hidden md:block overflow-x-auto rounded-xl border border-(--color-border-subtle) bg-(--color-surface) shadow-sm">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-(--color-border-subtle) bg-(--color-bg-soft) text-xs font-semibold text-(--color-text-muted) uppercase tracking-wider">
                  <th className="px-6 py-4 w-16">Rank</th>
                  <th className="px-6 py-4">Member</th>
                  <th className="px-6 py-4 text-right">Points</th>
                  <th className="px-6 py-4 text-right">Assessments</th>
                  <th className="px-6 py-4 text-right">Streak</th>
                  <th className="px-6 py-4">Badges</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-(--color-border-subtle)">
                {matched.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-xs text-(--color-text-muted)">
                      No members match your search.
                    </td>
                  </tr>
                ) : (
                  matched.map((entry) => (
                    <tr
                      key={entry.userId}
                      className={`transition-colors ${
                        entry.isCurrentUser
                          ? 'bg-(--color-accent-soft)/40'
                          : 'hover:bg-(--color-bg-soft)/50'
                      }`}
                    >
                      <td className="px-6 py-4 font-mono text-xs font-semibold text-(--color-text-primary)">
                        #{entry.rank}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="shrink-0 w-8 h-8 rounded-full bg-(--color-badge-bg) text-(--color-text-muted) flex items-center justify-center text-[11px] font-semibold">
                            {getNameInitials(entry.name)}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-semibold text-(--color-text-primary)">{entry.name}</span>
                            {entry.headline && (
                              <span className="text-xs text-(--color-text-muted)">{entry.headline}</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right font-mono text-xs font-semibold text-(--color-text-primary)">
                        {entry.points.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-right font-mono text-xs text-(--color-text-primary)">
                        {entry.assessmentsCompleted}
                      </td>
                      <td className="px-6 py-4 text-right font-mono text-xs text-(--color-text-muted)">
                        {entry.streakDays}d
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1.5">
                          {entry.badges.length === 0 ? (
                            <span className="text-xs text-(--color-text-muted)">—</span>
                          ) : (
                            entry.badges.map((badge) => (
                              <Badge key={badge} variant="accent">
                                {badge}
                              </Badge>
                            ))
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button type="button" variant="secondary" onClick={() => openAdjust(entry)}>
                          Adjust
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="md:hidden flex flex-col gap-4">
            {matched.length === 0 ? (
              <div className="rounded-xl border border-(--color-border-subtle) bg-(--color-surface) shadow-sm px-6 py-10 text-center text-xs text-(--color-text-muted)">
                No members match your search.
              </div>
            ) : (
              matched.map((entry) => (
                <div
                  key={entry.userId}
                  className={`rounded-xl border shadow-sm p-4 flex flex-col gap-3 ${
                    entry.isCurrentUser
                      ? 'border-(--color-accent) bg-(--color-accent-soft)/30'
                      : 'border-(--color-border-subtle) bg-(--color-surface)'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-semibold text-(--color-text-muted)">#{entry.rank}</span>
                    <div className="shrink-0 w-8 h-8 rounded-full bg-(--color-badge-bg) text-(--color-text-muted) flex items-center justify-center text-[11px] font-semibold">
                      {getNameInitials(entry.name)}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="font-semibold text-sm text-(--color-text-primary) truncate">{entry.name}</span>
                      {entry.headline && (
                        <span className="text-xs text-(--color-text-muted) truncate">{entry.headline}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-(--color-text-muted)">
                    <span className="inline-flex items-center gap-1 font-mono font-semibold text-(--color-text-primary)">
                      {entry.points.toLocaleString()} pts
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Award className="w-3.5 h-3.5 shrink-0" />
                      {entry.assessmentsCompleted}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Flame className="w-3.5 h-3.5 shrink-0" />
                      {entry.streakDays}d
                    </span>
                  </div>
                  {entry.badges.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {entry.badges.map((badge) => (
                        <Badge key={badge} variant="accent">
                          {badge}
                        </Badge>
                      ))}
                    </div>
                  )}
                  <Button type="button" variant="secondary" onClick={() => openAdjust(entry)} className="w-full">
                    Adjust
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      <Modal
        open={adjustTarget !== null}
        onClose={closeAdjust}
        title="Adjust standing"
        description={adjustTarget ? adjustTarget.name : undefined}
      >
        {adjustTarget && (
          <div className="flex flex-col gap-5">
            <Input
              type="number"
              label="Points"
              value={draftPoints}
              min={0}
              onChange={(e) => setDraftPoints(e.target.value)}
            />

            <div className="flex flex-col gap-2">
              <span className="text-[13px] font-medium text-(--color-text-primary)">Badges</span>
              <div className="flex flex-wrap gap-2">
                {BADGE_KEYS.map((badge) => {
                  const active = draftBadges.includes(badge);
                  return (
                    <button
                      key={badge}
                      type="button"
                      onClick={() => toggleBadge(badge)}
                      className={`px-2.5 py-1 rounded-(--radius-full) border text-[11px] font-medium transition-colors cursor-pointer ${
                        active
                          ? 'bg-(--color-accent-soft) text-(--color-accent) border-transparent'
                          : 'bg-(--color-bg) text-(--color-text-muted) border-(--color-border-subtle) hover:text-(--color-text-primary)'
                      }`}
                    >
                      {badge}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-(--color-border-subtle)">
              <Button type="button" variant="secondary" onClick={closeAdjust} disabled={saving}>
                Cancel
              </Button>
              <Button type="button" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving…' : 'Save changes'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </AdminLayout>
  );
}
