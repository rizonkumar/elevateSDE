'use client';

import * as React from 'react';
import Link from 'next/link';
import { ArrowRight, BriefcaseBusiness, CalendarClock, Plus, RotateCcw, Target } from 'lucide-react';
import { Button } from '@elevatesde/ui';
import { PageContainer } from '@/components/dashboard/PageContainer';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { ReadinessIndicator } from '@/components/dashboard/ReadinessIndicator';
import { useInterviewReadinessStore } from '@/store/interview-readiness.store';
import { PlanSetupModal } from './PlanSetupModal';

interface InterviewReadinessOverviewProps {
  initialApplicationId?: string;
}

function dateLabel(value: string, timeZone: string): string {
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone,
  }).format(new Date(value));
}

function daysUntil(value: string): number {
  return Math.max(0, Math.ceil((new Date(value).getTime() - Date.now()) / 86_400_000));
}

export function InterviewReadinessOverview({
  initialApplicationId,
}: InterviewReadinessOverviewProps) {
  const { overview, isLoading, error, loadOverview, loadTemplates } = useInterviewReadinessStore();
  const [setupOpen, setSetupOpen] = React.useState(Boolean(initialApplicationId));

  React.useEffect(() => {
    void Promise.all([loadOverview(), loadTemplates()]);
  }, [loadOverview, loadTemplates]);

  const applications = overview?.unplannedApplications ?? [];

  if (isLoading && !overview) {
    return (
      <PageContainer>
        <div className="animate-pulse space-y-6" aria-label="Loading interview readiness">
          <div className="h-20 rounded-(--radius-md) bg-(--color-badge-bg)" />
          <div className="grid gap-5 lg:grid-cols-2">
            <div className="h-56 rounded-(--radius-md) bg-(--color-badge-bg)" />
            <div className="h-56 rounded-(--radius-md) bg-(--color-badge-bg)" />
          </div>
        </div>
      </PageContainer>
    );
  }

  if (error && !overview) {
    return (
      <PageContainer>
        <div className="rounded-(--radius-md) border border-(--color-danger)/20 bg-(--color-danger-soft) p-6">
          <h1 className="text-lg font-semibold text-(--color-text-primary)">Preparation plans are unavailable</h1>
          <p className="mt-2 text-sm">{error}</p>
          <Button className="mt-4" variant="secondary" onClick={() => void loadOverview()}>
            <RotateCcw className="h-4 w-4" />
            Try again
          </Button>
        </div>
      </PageContainer>
    );
  }

  const plans = overview?.plans ?? [];
  return (
    <PageContainer>
      <div className="flex flex-col gap-8">
        <PageHeader
          kicker="Interview mission control"
          title="Prepare for the role in front of you"
          description="Turn each tracked application into an editable plan with deadline-aware tasks and evidence you can inspect. Readiness is guidance, never a hiring prediction."
          actions={
            <Button onClick={() => setSetupOpen(true)} disabled={applications.length === 0}>
              <Plus className="h-4 w-4" />
              New plan
            </Button>
          }
        />

        {plans.length === 0 ? (
          <section className="relative overflow-hidden rounded-(--radius-lg) border border-(--color-border-subtle) bg-(--color-surface) p-7 shadow-(--shadow-card) sm:p-10">
            <div className="absolute inset-y-0 right-0 hidden w-2/5 bg-[radial-gradient(circle_at_center,var(--color-accent-soft),transparent_70%)] lg:block" />
            <div className="relative max-w-xl">
              <span className="flex h-11 w-11 items-center justify-center rounded-(--radius-md) bg-(--color-accent-soft) text-(--color-accent)">
                <Target className="h-5 w-5" />
              </span>
              <h2 className="mt-5 text-xl font-semibold text-(--color-text-primary)">Build your first readiness plan</h2>
              <p className="mt-2 text-sm">
                Confirm the expected interview rounds, review the generated tasks, and start collecting evidence against a real deadline.
              </p>
              {applications.length > 0 ? (
                <Button className="mt-5" onClick={() => setSetupOpen(true)}>
                  Choose an application
                  <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Link
                  href="/dashboard/job-tracker"
                  className="mt-5 inline-flex h-10 items-center gap-2 rounded-(--radius-sm) bg-(--color-text-primary) px-3 text-sm font-medium text-(--color-bg)"
                >
                  <BriefcaseBusiness className="h-4 w-4" />
                  Track an application first
                </Link>
              )}
            </div>
          </section>
        ) : (
          <section aria-labelledby="active-plans-title">
            <div className="mb-4 flex items-center justify-between">
              <h2 id="active-plans-title" className="text-sm font-semibold uppercase tracking-[0.12em] text-(--color-text-muted)">
                Upcoming interviews
              </h2>
              <span className="text-xs text-(--color-text-muted)">{plans.length} plans</span>
            </div>
            <div className="grid gap-5 lg:grid-cols-2">
              {plans.map((plan) => (
                <Link
                  key={plan.id}
                  href={`/dashboard/interview-readiness/${plan.id}`}
                  className="group rounded-(--radius-lg) border border-(--color-border-subtle) bg-(--color-surface) p-5 text-(--color-text-primary) shadow-(--shadow-card) transition hover:-translate-y-0.5 hover:border-(--color-accent) sm:p-6"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="text-xs font-semibold uppercase tracking-[0.12em] text-(--color-accent)">
                        {daysUntil(plan.targetAt)} days to interview
                      </div>
                      <h3 className="mt-2 truncate text-xl font-semibold">{plan.company}</h3>
                      <p className="mt-1 truncate text-sm">{plan.role}</p>
                    </div>
                    <ArrowRight className="mt-1 h-5 w-5 text-(--color-text-muted) transition group-hover:translate-x-1 group-hover:text-(--color-accent)" />
                  </div>
                  <div className="my-5 h-px bg-(--color-border-subtle)" />
                  <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                    <ReadinessIndicator
                      score={plan.latestReadiness?.score ?? null}
                      status={plan.latestReadiness?.status ?? 'INSUFFICIENT_EVIDENCE'}
                      confidence={plan.latestReadiness?.confidence ?? 0}
                    />
                    <div className="flex items-center gap-2 text-xs text-(--color-text-muted)">
                      <CalendarClock className="h-4 w-4" />
                      {dateLabel(plan.targetAt, plan.timeZone)}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
      <PlanSetupModal
        open={setupOpen}
        onClose={() => setSetupOpen(false)}
        applications={applications}
        initialApplicationId={initialApplicationId}
      />
    </PageContainer>
  );
}
