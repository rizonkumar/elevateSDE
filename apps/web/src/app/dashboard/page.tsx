'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import {
  Video,
  Code2,
  FileText,
  Target,
  ClipboardCheck,
  ArrowUpRight,
  TrendingUp,
  Trophy,
  Flag,
  type LucideIcon,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { useToastStore } from '@/store/toast.store';
import { PageContainer } from '@/components/dashboard/PageContainer';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { useDashboardStore, type QuickActionKey, type ActivityType } from '@/store/dashboard.store';

const quickActionIcons: Record<QuickActionKey, LucideIcon> = {
  'mock-interview': Video,
  'code-sandbox': Code2,
  'resume-analysis': FileText,
};

const activityIcons: Record<ActivityType, LucideIcon> = {
  interview: Video,
  assessment: ClipboardCheck,
  resume: FileText,
  goal: Target,
};

function formatRelative(timestamp: string): string {
  const then = new Date(timestamp).getTime();
  const now = Date.now();
  const diffDays = Math.round((now - then) / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  const weeks = Math.round(diffDays / 7);
  return weeks === 1 ? '1 week ago' : `${weeks} weeks ago`;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.07 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' as const } },
};

export default function DashboardPage() {
  const { user } = useAuthStore();
  const addToast = useToastStore((state) => state.addToast);
  const { stats, quickActions, activityLog, focusAreas, loadDashboard } = useDashboardStore();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    loadDashboard();
  }, [loadDashboard]);

  const currentUser = mounted ? user : null;

  const statCards: {
    label: string;
    value: string;
    hint: string;
    icon: LucideIcon;
    accent: boolean;
  }[] = [
    {
      label: 'Interviews completed',
      value: `${stats.interviewsCompleted}`,
      hint: 'Across all tracks',
      icon: Trophy,
      accent: false,
    },
    {
      label: 'Average AI score',
      value: `${stats.avgAiScore}%`,
      hint: 'Last 30 days',
      icon: TrendingUp,
      accent: true,
    },
    {
      label: 'Active goals',
      value: `${stats.activeGoals}`,
      hint: 'In progress',
      icon: Flag,
      accent: false,
    },
  ];

  return (
    <PageContainer>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="flex flex-col gap-8 sm:gap-10"
      >
        <motion.section variants={itemVariants}>
          <PageHeader
            kicker="Welcome back"
            title={currentUser?.email ?? 'Your dashboard'}
            description="Track your preparation, launch a session, and review recent progress."
            actions={
              <>
                <span className="rounded-(--radius-full) border border-(--color-border-subtle) bg-(--color-badge-bg) px-3 py-1.5 text-xs font-medium text-(--color-text-muted)">
                  {currentUser?.role ?? 'Candidate'}
                </span>
                <span className="rounded-(--radius-full) border border-(--color-border-subtle) bg-(--color-badge-bg) px-3 py-1.5 text-xs font-medium text-(--color-text-muted)">
                  Active session
                </span>
              </>
            }
          />
        </motion.section>

        <motion.section variants={itemVariants}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {statCards.map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.label}
                  className="rounded-md border border-(--color-border-subtle) bg-(--color-surface) shadow-(--shadow-card) p-5 flex items-start justify-between gap-4"
                >
                  <div className="min-w-0">
                    <div className="text-xs font-semibold uppercase tracking-wider text-(--color-text-muted)">
                      {card.label}
                    </div>
                    <div className="font-display text-3xl font-semibold tracking-tight mt-2">
                      {card.value}
                    </div>
                    <div className="text-xs text-(--color-text-muted) mt-1">{card.hint}</div>
                  </div>
                  <span
                    className={`inline-flex items-center justify-center w-10 h-10 rounded-sm shrink-0 ${
                      card.accent
                        ? 'bg-(--color-accent) text-white'
                        : 'bg-(--color-accent-soft) text-(--color-accent)'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </span>
                </div>
              );
            })}
          </div>
        </motion.section>

        <motion.section variants={itemVariants}>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-(--color-text-muted) mb-4">
            Quick start
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {quickActions.map((action) => {
              const Icon = quickActionIcons[action.key];
              return (
                <button
                  key={action.key}
                  type="button"
                  onClick={() => addToast(`${action.title} is coming soon.`, 'info')}
                  className="group text-left rounded-md border border-(--color-border-subtle) bg-(--color-surface) shadow-(--shadow-card) p-5 flex flex-col gap-4 cursor-pointer transition-all hover:-translate-y-0.5 hover:border-(--color-accent)"
                >
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center justify-center w-11 h-11 rounded-sm bg-(--color-accent-soft) text-(--color-accent)">
                      <Icon className="w-5 h-5" />
                    </span>
                    <ArrowUpRight className="w-4 h-4 text-(--color-text-muted) transition-colors group-hover:text-(--color-accent)" />
                  </div>
                  <div>
                    <div className="font-semibold text-(--color-text-primary)">{action.title}</div>
                    <p className="text-sm text-(--color-text-muted) mt-1 mb-0">
                      {action.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </motion.section>

        <motion.section variants={itemVariants}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 rounded-md border border-(--color-border-subtle) bg-(--color-surface) shadow-(--shadow-card) p-5 sm:p-6">
              <h2 className="text-sm font-semibold text-(--color-text-primary) mb-5">
                Recent activity
              </h2>
              <div className="flex flex-col divide-y divide-(--color-border-subtle)">
                {activityLog.map((item) => {
                  const Icon = activityIcons[item.type];
                  return (
                    <div key={item.id} className="py-4 first:pt-0 last:pb-0 flex items-start gap-4">
                      <span className="mt-0.5 inline-flex items-center justify-center w-9 h-9 shrink-0 rounded-full bg-(--color-badge-bg) text-(--color-text-muted)">
                        <Icon className="w-4 h-4" />
                      </span>
                      <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-(--color-text-primary) truncate">
                            {item.label}
                          </div>
                          <div className="text-xs text-(--color-text-muted)">{item.detail}</div>
                        </div>
                        <span className="text-xs text-(--color-text-muted) shrink-0">
                          {formatRelative(item.timestamp)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-md border border-(--color-border-subtle) bg-(--color-surface) shadow-(--shadow-card) p-5 sm:p-6">
              <h2 className="text-sm font-semibold text-(--color-text-primary) mb-5">
                Focus areas
              </h2>
              <div className="flex flex-col gap-5">
                {focusAreas.map((area) => (
                  <div key={area.id}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm text-(--color-text-primary)">{area.label}</span>
                      <span className="text-xs font-semibold text-(--color-text-muted)">
                        {area.progress}%
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-(--color-badge-bg) overflow-hidden">
                      <div
                        className="h-full rounded-full bg-(--color-accent)"
                        style={{ width: `${area.progress}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.section>
      </motion.div>
    </PageContainer>
  );
}
