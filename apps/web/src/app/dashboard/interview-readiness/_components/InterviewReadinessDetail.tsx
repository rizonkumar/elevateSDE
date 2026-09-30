'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowUpRight,
  CalendarClock,
  Check,
  Circle,
  Clock3,
  History,
  RefreshCw,
  Settings2,
  Sparkles,
  ShieldCheck,
  Target,
} from 'lucide-react';
import { Badge, Button, type BadgeVariant } from '@elevatesde/ui';
import type {
  AiReadinessExplanationDto,
  InterviewPreparationPlanDto,
  InterviewReadinessStatus,
  InterviewRoundReadinessDto,
  PreparationRoundDto,
} from '@elevatesde/shared-types';
import { PageContainer } from '@/components/dashboard/PageContainer';
import { ReadinessIndicator } from '@/components/dashboard/ReadinessIndicator';
import { useInterviewReadinessStore } from '@/store/interview-readiness.store';
import { PlanSettingsModal } from './PlanSettingsModal';
import { PeerPracticePanel } from './PeerPracticePanel';

interface InterviewReadinessDetailProps {
  planId: string;
}

const STATUS_VARIANTS: Record<InterviewReadinessStatus, BadgeVariant> = {
  INSUFFICIENT_EVIDENCE: 'neutral',
  NEEDS_WORK: 'danger',
  PROGRESSING: 'warning',
  READY: 'success',
};

const STATUS_LABELS: Record<InterviewReadinessStatus, string> = {
  INSUFFICIENT_EVIDENCE: 'Insufficient evidence',
  NEEDS_WORK: 'Needs work',
  PROGRESSING: 'Progressing',
  READY: 'Ready',
};

function targetLabel(targetAt: string, timeZone: string): string {
  return new Intl.DateTimeFormat(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone,
  }).format(new Date(targetAt));
}

function countdown(targetAt: string): { days: number; hours: number } {
  const remaining = Math.max(0, new Date(targetAt).getTime() - Date.now());
  return {
    days: Math.floor(remaining / 86_400_000),
    hours: Math.floor((remaining % 86_400_000) / 3_600_000),
  };
}

function EvidencePanel({ readiness }: { readiness: InterviewRoundReadinessDto | null }) {
  if (!readiness) {
    return (
      <div className="rounded-(--radius-md) border border-dashed border-(--color-border) p-5 text-sm text-(--color-text-muted)">
        Refresh readiness to inspect durable evidence for this round.
      </div>
    );
  }
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {readiness.evidence.map((item) => (
        <div key={item.source} className="rounded-(--radius-md) border border-(--color-border-subtle) bg-(--color-bg-soft) p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="text-sm font-semibold text-(--color-text-primary)">{item.label}</div>
            <span className="font-display text-lg font-semibold text-(--color-text-primary)">
              {item.score === null ? '—' : Math.round(item.score)}
            </span>
          </div>
          <p className="mb-0 mt-2 text-xs">{item.detail}</p>
          <div className="mt-3 flex items-center justify-between gap-2">
            <span className="text-[11px] text-(--color-text-muted)">
              {item.observedAt ? `Updated ${new Date(item.observedAt).toLocaleDateString()}` : 'Evidence needed'}
            </span>
            {item.deepLink && (
              <Link href={item.deepLink} className="inline-flex items-center gap-1 text-xs font-medium text-(--color-accent)">
                Improve
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function RoundWorkspace({ round }: { round: PreparationRoundDto }) {
  const setTaskCompletion = useInterviewReadinessStore((state) => state.setTaskCompletion);
  const readiness = round.readiness;
  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(18rem,0.8fr)]">
      <div className="flex flex-col gap-6">
        <section className="rounded-(--radius-lg) border border-(--color-border-subtle) bg-(--color-surface) p-5 shadow-(--shadow-card) sm:p-6">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-(--color-text-primary)">{round.title}</h2>
              <p className="mb-0 mt-1 text-xs">Evidence is normalized only across signals available for this round.</p>
            </div>
            <Badge variant={STATUS_VARIANTS[readiness?.status ?? 'INSUFFICIENT_EVIDENCE']}>
              {STATUS_LABELS[readiness?.status ?? 'INSUFFICIENT_EVIDENCE']}
            </Badge>
          </div>
          <EvidencePanel readiness={readiness} />
        </section>

        <section className="rounded-(--radius-lg) border border-(--color-border-subtle) bg-(--color-surface) p-5 shadow-(--shadow-card) sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-(--color-text-primary)">Next actions</h2>
              <p className="mb-0 mt-1 text-xs">Completing a task adds evidence; it does not guarantee an outcome.</p>
            </div>
            <span className="text-xs text-(--color-text-muted)">
              {round.tasks.filter((task) => task.status === 'COMPLETED').length}/{round.tasks.length}
            </span>
          </div>
          <div className="divide-y divide-(--color-border-subtle)">
            {round.tasks.map((task) => {
              const complete = task.status === 'COMPLETED';
              return (
                <div key={task.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                  <button
                    type="button"
                    aria-label={`${complete ? 'Reopen' : 'Complete'} ${task.title}`}
                    aria-pressed={complete}
                    onClick={() => void setTaskCompletion(task, !complete)}
                    className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-accent) ${
                      complete
                        ? 'border-(--color-success) bg-(--color-success) text-white'
                        : 'border-(--color-border) text-transparent hover:border-(--color-accent)'
                    }`}
                  >
                    <Check className="h-3.5 w-3.5" />
                  </button>
                  <div className="min-w-0 flex-1">
                    <div className={`text-sm font-medium ${complete ? 'text-(--color-text-muted) line-through' : 'text-(--color-text-primary)'}`}>
                      {task.title}
                    </div>
                    {task.description && <p className="mb-0 mt-1 text-xs">{task.description}</p>}
                  </div>
                  {task.deepLink && (
                    <Link href={task.deepLink} aria-label={`Open ${task.title}`} className="rounded-(--radius-sm) p-1.5 text-(--color-text-muted) hover:bg-(--color-badge-bg) hover:text-(--color-accent)">
                      <ArrowUpRight className="h-4 w-4" />
                    </Link>
                  )}
                </div>
              );
            })}
            {round.tasks.length === 0 && (
              <p className="mb-0 py-3 text-sm">No tasks are configured for this round.</p>
            )}
          </div>
        </section>
      </div>

      <aside className="flex flex-col gap-5">
        <div className="rounded-(--radius-lg) border border-(--color-border-subtle) bg-(--color-surface) p-5 shadow-(--shadow-card)">
          <ReadinessIndicator
            score={readiness?.score ?? null}
            status={readiness?.status ?? 'INSUFFICIENT_EVIDENCE'}
            confidence={readiness?.confidence ?? 0}
            size="lg"
          />
          <div className="mt-5 grid grid-cols-2 gap-3 border-t border-(--color-border-subtle) pt-4">
            <div>
              <div className="text-[11px] uppercase tracking-[0.1em] text-(--color-text-muted)">Coverage</div>
              <div className="mt-1 font-display text-xl font-semibold">{Math.round((readiness?.coverage ?? 0) * 100)}%</div>
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-[0.1em] text-(--color-text-muted)">Weight</div>
              <div className="mt-1 font-display text-xl font-semibold">{round.weight.toFixed(1)}×</div>
            </div>
          </div>
        </div>
        <div className="rounded-(--radius-lg) border border-(--color-border-subtle) bg-(--color-surface) p-5 shadow-(--shadow-card)">
          <div className="flex items-center gap-2 text-sm font-semibold text-(--color-text-primary)">
            <ShieldCheck className="h-4 w-4 text-(--color-accent)" />
            How to read this
          </div>
          <p className="mb-0 mt-3 text-xs leading-5">
            The indicator combines measured evidence for this round. Missing or stale signals lower confidence instead of becoming a failing score.
          </p>
        </div>
      </aside>
    </div>
  );
}

function ReadinessNarrative({
  planId,
  snapshot,
}: {
  planId: string;
  snapshot: InterviewPreparationPlanDto['snapshots'][number] | undefined;
}) {
  const generate = useInterviewReadinessStore((state) => state.generateExplanation);
  const isSaving = useInterviewReadinessStore((state) => state.isSaving);
  const [result, setResult] = React.useState<AiReadinessExplanationDto | null>(null);
  if (!snapshot) return null;
  const explanation = result?.explanation ?? snapshot.aiExplanation;
  const recommendations = result?.recommendations ?? snapshot.deterministicRecommendations;
  return (
    <section className="rounded-(--radius-lg) border border-(--color-accent)/25 bg-(--color-accent-soft) p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-(--color-text-primary)">
            <Sparkles className="h-4 w-4 text-(--color-accent)" />
            Readiness explanation
          </div>
          <p className="mb-0 mt-1 text-xs">AI can explain the evidence, but it cannot change scores or task state.</p>
        </div>
        <Button
          variant="secondary"
          disabled={isSaving}
          onClick={async () => setResult(await generate(planId, snapshot.id))}
        >
          {isSaving ? 'Generating…' : explanation ? 'Regenerate' : 'Explain readiness'}
        </Button>
      </div>
      {explanation && <p className="mb-0 mt-4 text-sm leading-6 text-(--color-text-primary)">{explanation}</p>}
      {recommendations.length > 0 && (
        <ul className="mt-4 grid gap-2 text-sm text-(--color-text-primary) sm:grid-cols-3">
          {recommendations.map((item) => (
            <li key={item} className="rounded-(--radius-sm) border border-(--color-border-subtle) bg-(--color-surface) p-3">{item}</li>
          ))}
        </ul>
      )}
      {result?.fallback && <div className="mt-3 text-xs text-(--color-text-muted)">Deterministic fallback shown.</div>}
    </section>
  );
}

export function InterviewReadinessDetail({ planId }: InterviewReadinessDetailProps) {
  const { plan, isLoading, error, loadPlan, refreshSnapshot, clearPlan } = useInterviewReadinessStore();
  const [activeRoundId, setActiveRoundId] = React.useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const initialRefresh = React.useRef(false);

  React.useEffect(() => {
    clearPlan();
    void loadPlan(planId);
  }, [clearPlan, loadPlan, planId]);

  React.useEffect(() => {
    if (!plan || plan.id !== planId) return;
    setActiveRoundId((current) => current ?? plan.rounds[0]?.id ?? null);
    if (plan.snapshots.length === 0 && !initialRefresh.current) {
      initialRefresh.current = true;
      void refreshSnapshot(plan.id);
    }
  }, [plan, planId, refreshSnapshot]);

  if (isLoading || !plan || plan.id !== planId) {
    if (error) {
      return (
        <PageContainer>
          <div className="rounded-(--radius-md) border border-(--color-danger)/20 bg-(--color-danger-soft) p-6">
            <h1 className="text-lg font-semibold text-(--color-text-primary)">Plan unavailable</h1>
            <p className="mt-2 text-sm">{error}</p>
            <Link href="/dashboard/interview-readiness" className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-(--color-accent)">
              <ArrowLeft className="h-4 w-4" />
              Back to plans
            </Link>
          </div>
        </PageContainer>
      );
    }
    return (
      <PageContainer>
        <div className="animate-pulse space-y-6" aria-label="Loading preparation plan">
          <div className="h-44 rounded-(--radius-lg) bg-(--color-badge-bg)" />
          <div className="h-96 rounded-(--radius-lg) bg-(--color-badge-bg)" />
        </div>
      </PageContainer>
    );
  }

  const activeRound = plan.rounds.find((round) => round.id === activeRoundId) ?? plan.rounds[0];
  const latest = plan.latestReadiness ? plan.snapshots[0] : undefined;
  const remaining = countdown(plan.targetAt);

  return (
    <PageContainer>
      <div className="flex flex-col gap-7">
        <Link href="/dashboard/interview-readiness" className="inline-flex items-center gap-2 self-start text-sm font-medium text-(--color-text-muted) hover:text-(--color-text-primary)">
          <ArrowLeft className="h-4 w-4" />
          All preparation plans
        </Link>

        <header className="relative overflow-hidden rounded-(--radius-lg) border border-(--color-border-subtle) bg-(--color-surface) p-5 shadow-(--shadow-card) sm:p-7">
          <div className="absolute inset-y-0 right-0 hidden w-1/3 bg-[radial-gradient(circle_at_center,var(--color-accent-soft),transparent_70%)] lg:block" />
          <div className="relative grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.12em] text-(--color-accent)">{plan.archetype.replace('_', ' ')} interview loop</div>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight text-(--color-text-primary) sm:text-3xl">{plan.company}</h1>
              <p className="mb-0 mt-1 text-sm">{plan.role}</p>
              <div className="mt-5 flex flex-wrap gap-4 text-xs text-(--color-text-muted)">
                <span className="inline-flex items-center gap-1.5"><CalendarClock className="h-4 w-4" />{targetLabel(plan.targetAt, plan.timeZone)}</span>
                <span className="inline-flex items-center gap-1.5"><Clock3 className="h-4 w-4" />{remaining.days}d {remaining.hours}h remaining</span>
              </div>
            </div>
            <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
              <ReadinessIndicator
                score={latest?.score ?? null}
                status={latest?.status ?? 'INSUFFICIENT_EVIDENCE'}
                confidence={latest?.confidence ?? 0}
              />
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => setSettingsOpen(true)}>
                  <Settings2 className="h-4 w-4" />
                  Edit plan
                </Button>
                <Button variant="secondary" onClick={() => void refreshSnapshot(plan.id)}>
                  <RefreshCw className="h-4 w-4" />
                  Refresh evidence
                </Button>
              </div>
            </div>
          </div>
        </header>

        <nav aria-label="Interview rounds" className="flex gap-2 overflow-x-auto pb-1">
          {plan.rounds.map((round) => {
            const active = round.id === activeRound?.id;
            const complete = round.readiness?.status === 'READY';
            return (
              <button
                key={round.id}
                type="button"
                aria-current={active ? 'page' : undefined}
                onClick={() => setActiveRoundId(round.id)}
                className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-accent) ${
                  active
                    ? 'border-(--color-text-primary) bg-(--color-text-primary) text-(--color-bg)'
                    : 'border-(--color-border) bg-(--color-surface) text-(--color-text-muted) hover:text-(--color-text-primary)'
                }`}
              >
                {complete ? <Check className="h-3.5 w-3.5" /> : <Circle className="h-3.5 w-3.5" />}
                {round.title}
              </button>
            );
          })}
        </nav>

        {activeRound && <RoundWorkspace round={activeRound} />}

        <PeerPracticePanel plan={plan} />

        <ReadinessNarrative planId={plan.id} snapshot={latest} />

        <section className="rounded-(--radius-lg) border border-(--color-border-subtle) bg-(--color-surface) p-5 shadow-(--shadow-card) sm:p-6">
          <div className="flex items-center gap-2 text-sm font-semibold text-(--color-text-primary)">
            <History className="h-4 w-4 text-(--color-accent)" />
            Readiness history
          </div>
          <div className="mt-4 flex gap-3 overflow-x-auto pb-1">
            {plan.snapshots.map((snapshot) => (
              <div key={snapshot.id} className="min-w-44 rounded-(--radius-md) border border-(--color-border-subtle) bg-(--color-bg-soft) p-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-display text-xl font-semibold">{snapshot.score === null ? '—' : Math.round(snapshot.score)}</span>
                  <Badge variant={STATUS_VARIANTS[snapshot.status]}>{STATUS_LABELS[snapshot.status]}</Badge>
                </div>
                <div className="mt-3 text-[11px] text-(--color-text-muted)">{new Date(snapshot.calculatedAt).toLocaleString()}</div>
              </div>
            ))}
            {plan.snapshots.length === 0 && <p className="mb-0 text-sm">No snapshots yet.</p>}
          </div>
        </section>

        <div className="flex items-start gap-3 rounded-(--radius-md) border border-(--color-border-subtle) bg-(--color-bg-soft) p-4 text-xs text-(--color-text-muted)">
          <Target className="mt-0.5 h-4 w-4 shrink-0 text-(--color-accent)" />
          Readiness summarizes available preparation evidence. It is not a hiring probability and cannot predict an interview outcome.
        </div>
      </div>
      <PlanSettingsModal plan={plan} open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </PageContainer>
  );
}
