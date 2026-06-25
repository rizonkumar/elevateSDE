'use client';

import * as React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button, ConfirmDialog, DatePicker, Modal } from '@elevatesde/ui';
import type { AssessmentDifficulty } from '@elevatesde/shared-types';
import { AdminLayout } from '../../components/AdminLayout';
import { Badge, Select, type BadgeVariant } from '../../components/ui';
import { useDailyChallengesStore } from '../../store/daily-challenges.store';

const DIFFICULTY_VARIANT: Record<AssessmentDifficulty, BadgeVariant> = {
  EASY: 'success',
  MEDIUM: 'warning',
  HARD: 'danger',
};

function toLocalDateKey(isoValue: string): string {
  const date = new Date(isoValue);
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export default function DailyChallengesPage() {
  const schedule = useDailyChallengesStore((state) => state.schedule);
  const problemOptions = useDailyChallengesStore((state) => state.problemOptions);
  const loading = useDailyChallengesStore((state) => state.loading);
  const isModalOpen = useDailyChallengesStore((state) => state.isModalOpen);
  const saving = useDailyChallengesStore((state) => state.saving);
  const pendingDeleteId = useDailyChallengesStore((state) => state.pendingDeleteId);
  const deletingId = useDailyChallengesStore((state) => state.deletingId);
  const loadSchedule = useDailyChallengesStore((state) => state.loadSchedule);
  const loadProblemOptions = useDailyChallengesStore((state) => state.loadProblemOptions);
  const openModal = useDailyChallengesStore((state) => state.openModal);
  const closeModal = useDailyChallengesStore((state) => state.closeModal);
  const createChallenge = useDailyChallengesStore((state) => state.createChallenge);
  const requestDelete = useDailyChallengesStore((state) => state.requestDelete);
  const cancelDelete = useDailyChallengesStore((state) => state.cancelDelete);
  const confirmDelete = useDailyChallengesStore((state) => state.confirmDelete);

  const [date, setDate] = React.useState<string | null>(null);
  const [problemId, setProblemId] = React.useState('');

  React.useEffect(() => {
    void loadSchedule();
    void loadProblemOptions();
  }, [loadSchedule, loadProblemOptions]);

  React.useEffect(() => {
    if (isModalOpen) {
      setDate(null);
      setProblemId('');
    }
  }, [isModalOpen]);

  const selectOptions = React.useMemo(
    () => [{ value: '', label: 'Select a problem' }, ...problemOptions],
    [problemOptions],
  );

  const handleSave = async () => {
    if (!date || !problemId) {
      return;
    }
    await createChallenge(toLocalDateKey(date), problemId);
  };

  return (
    <AdminLayout>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-(--color-text-muted)">
            Schedule a published problem as the daily challenge candidates solve to build streaks.
          </p>
          <Button type="button" onClick={openModal}>
            <Plus className="w-4 h-4 shrink-0" />
            Schedule a day
          </Button>
        </div>

        {loading && schedule.length === 0 ? (
          <div className="flex items-center justify-center min-h-[300px]">
            <span className="text-sm text-(--color-text-muted) animate-pulse">
              Loading schedule...
            </span>
          </div>
        ) : schedule.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <p className="m-0 text-sm font-medium">No daily challenges scheduled</p>
            <p className="m-0 max-w-sm text-sm text-(--color-text-muted)">
              Schedule a published problem for a date to start the daily challenge.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-md border border-(--color-border-subtle) bg-(--color-surface)">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-(--color-border-subtle) bg-(--color-bg-soft) text-xs font-semibold uppercase tracking-wider text-(--color-text-muted)">
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-left">Problem</th>
                  <th className="px-4 py-3 text-left">Difficulty</th>
                  <th className="px-4 py-3 text-right">Completions</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {schedule.map((entry) => (
                  <tr key={entry.id} className="border-b border-(--color-border-subtle) last:border-0">
                    <td className="px-4 py-3 font-medium">{entry.challengeDate}</td>
                    <td className="px-4 py-3">{entry.problemTitle}</td>
                    <td className="px-4 py-3">
                      <Badge variant={DIFFICULTY_VARIANT[entry.difficulty]}>{entry.difficulty}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">{entry.completionCount}</td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        type="button"
                        variant="secondary"
                        className="px-2.5"
                        disabled={deletingId === entry.id}
                        onClick={() => requestDelete(entry.id)}
                      >
                        <Trash2 className="w-4 h-4 shrink-0" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        open={isModalOpen}
        onClose={closeModal}
        title="Schedule daily challenge"
        description="Pick a date and a published problem."
      >
        <div className="flex flex-col gap-4">
          <DatePicker value={date} onChange={setDate} label="Challenge date" />
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-(--color-text-muted)">Problem</span>
            <Select value={problemId} options={selectOptions} onChange={setProblemId} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={closeModal} disabled={saving}>
              Cancel
            </Button>
            <Button type="button" onClick={handleSave} disabled={saving || !date || !problemId}>
              Schedule
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={pendingDeleteId !== null}
        title="Remove daily challenge"
        description="This removes the scheduled challenge for that date. Recorded completions are kept."
        confirmLabel="Remove"
        tone="danger"
        loading={deletingId !== null}
        onConfirm={confirmDelete}
        onClose={cancelDelete}
      />
    </AdminLayout>
  );
}
