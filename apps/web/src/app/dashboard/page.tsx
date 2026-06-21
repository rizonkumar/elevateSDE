'use client';

import * as React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  type TooltipContentProps,
} from 'recharts';
import {
  Video,
  Code2,
  FileText,
  ArrowUpRight,
  CheckCircle2,
  Trophy,
  Briefcase,
  Flame,
  MessagesSquare,
  ThumbsUp,
  ClipboardCheck,
  AlertCircle,
  type LucideIcon,
} from 'lucide-react';
import type {
  AssessmentDifficulty,
  DashboardStatsDto,
  JobApplicationStatus,
  ResumeDto,
  UserDto,
} from '@elevatesde/shared-types';
import { useAuthStore } from '@/store/auth.store';
import { useResumeStore } from '@/store/resume.store';
import { useMockInterviewStore } from '@/store/mock-interview.store';
import { PageContainer } from '@/components/dashboard/PageContainer';
import { useDashboardStore, type QuickAction, type QuickActionKey } from '@/store/dashboard.store';

const quickActionIcons: Record<QuickActionKey, LucideIcon> = {
  'mock-interview': Video,
  'code-sandbox': Code2,
  'resume-analysis': FileText,
};

const PIPELINE_STAGES: { key: JobApplicationStatus; label: string }[] = [
  { key: 'APPLIED', label: 'Applied' },
  { key: 'OA', label: 'OA' },
  { key: 'INTERVIEW', label: 'Interview' },
  { key: 'OFFER', label: 'Offer' },
  { key: 'REJECTED', label: 'Rejected' },
];

const DIFFICULTIES: AssessmentDifficulty[] = ['EASY', 'MEDIUM', 'HARD'];

const EMPTY_STATS: DashboardStatsDto = {
  jobTracker: {
    total: 0,
    byStatus: { APPLIED: 0, OA: 0, INTERVIEW: 0, OFFER: 0, REJECTED: 0 },
    upcomingInterviews: 0,
  },
  assessments: {
    problemsSolved: 0,
    problemsAttempted: 0,
    totalSubmissions: 0,
    acceptanceRate: 0,
    byDifficulty: { EASY: 0, MEDIUM: 0, HARD: 0 },
  },
  leaderboard: { rank: null, points: 0, streakDays: 0, badges: [], assessmentsCompleted: 0 },
  forum: { postsCreated: 0, commentsPosted: 0, upvotesReceived: 0 },
  recentSubmissions: [],
};

interface StatCardData {
  label: string;
  value: string;
  hint: string;
  icon: LucideIcon;
  accent: boolean;
}

interface ActivityItem {
  id: string;
  label: string;
  detail: string;
  timestamp: string;
  icon: LucideIcon;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.07 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' as const } },
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

function greeting(name: string): string {
  const hour = new Date().getHours();
  if (hour < 12) return `Good morning, ${name}`;
  if (hour < 18) return `Good afternoon, ${name}`;
  return `Good evening, ${name}`;
}

function resolveDisplayName(user: UserDto | null): string {
  if (!user) return 'there';
  const first = user.firstName?.trim();
  if (first) return first;
  return user.email.split('@')[0] || 'there';
}

function formatInterviewHint(count: number): string {
  if (count <= 0) return 'No interviews scheduled';
  return `${count} upcoming interview${count === 1 ? '' : 's'}`;
}

function buildStatCards(data: DashboardStatsDto): StatCardData[] {
  const { assessments, leaderboard, jobTracker } = data;
  return [
    {
      label: 'Problems solved',
      value: `${assessments.problemsSolved}`,
      hint: `${assessments.acceptanceRate}% acceptance rate`,
      icon: CheckCircle2,
      accent: true,
    },
    {
      label: 'Leaderboard rank',
      value: leaderboard.rank === null ? '—' : `#${leaderboard.rank}`,
      hint: `${leaderboard.points} points`,
      icon: Trophy,
      accent: false,
    },
    {
      label: 'Job applications',
      value: `${jobTracker.total}`,
      hint: formatInterviewHint(jobTracker.upcomingInterviews),
      icon: Briefcase,
      accent: false,
    },
    {
      label: 'Day streak',
      value: `${leaderboard.streakDays}`,
      hint: leaderboard.streakDays > 0 ? 'Keep the momentum' : 'Start a streak today',
      icon: Flame,
      accent: false,
    },
  ];
}

function buildActivity(
  data: DashboardStatsDto,
  resumeAnalyses: ResumeDto[],
  includeClient: boolean,
): ActivityItem[] {
  const items: ActivityItem[] = data.recentSubmissions.map((submission) => ({
    id: `sub-${submission.createdAt}-${submission.problemTitle}`,
    label: submission.problemTitle,
    detail: `${submission.status.replaceAll('_', ' ').toLowerCase()} · ${submission.passedCount}/${submission.totalCount} tests`,
    timestamp: submission.createdAt,
    icon: ClipboardCheck,
  }));

  if (includeClient) {
    for (const analysis of resumeAnalyses) {
      if (analysis.status === 'COMPLETED') {
        items.push({
          id: `resume-${analysis.id}`,
          label: 'Resume analyzed',
          detail: analysis.atsScore === null ? analysis.fileName : `ATS score ${analysis.atsScore}`,
          timestamp: analysis.createdAt,
          icon: FileText,
        });
      }
    }
  }

  items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  return items.slice(0, 6);
}

function ChartTooltip({ active, payload, label }: Readonly<TooltipContentProps>) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="rounded-lg border border-(--color-border-subtle) bg-(--color-surface) px-3 py-2 shadow-(--shadow-soft)">
      <div className="text-xs font-semibold text-(--color-text-primary)">{label}</div>
      <div className="text-xs text-(--color-text-muted)">Solved: {payload[0]?.value}</div>
    </div>
  );
}

function StatCard({ label, value, hint, icon: Icon, accent }: Readonly<StatCardData>) {
  return (
    <div className="rounded-md border border-(--color-border-subtle) bg-(--color-surface) shadow-(--shadow-card) p-5 flex items-start justify-between gap-4">
      <div className="min-w-0">
        <div className="text-xs font-semibold uppercase tracking-wider text-(--color-text-muted)">
          {label}
        </div>
        <div className="font-display text-3xl font-semibold tracking-tight mt-2">{value}</div>
        <div className="text-xs text-(--color-text-muted) mt-1">{hint}</div>
      </div>
      <span
        className={`inline-flex items-center justify-center w-10 h-10 rounded-sm shrink-0 ${
          accent
            ? 'bg-(--color-accent) text-white'
            : 'bg-(--color-accent-soft) text-(--color-accent)'
        }`}
      >
        <Icon className="w-5 h-5" />
      </span>
    </div>
  );
}

function ProgressRow({ label, value }: Readonly<{ label: string; value: number }>) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm text-(--color-text-primary)">{label}</span>
        <span className="text-xs font-semibold text-(--color-text-muted)">{value}%</span>
      </div>
      <div className="h-2 rounded-full bg-(--color-badge-bg) overflow-hidden">
        <div
          className="h-full rounded-full bg-(--color-accent)"
          style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
        />
      </div>
    </div>
  );
}

function HeroHeader({ name, role, streakDays }: Readonly<{ name: string; role: string; streakDays: number }>) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <div className="text-xs font-semibold uppercase tracking-[0.12em] text-(--color-accent) mb-2">
          Your dashboard
        </div>
        <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight">
          {greeting(name)}
        </h1>
        <p className="text-(--color-text-muted) mt-2 mb-0">
          Track your preparation, launch a session, and review recent progress.
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-xs px-3 py-1.5 rounded-full border border-(--color-border-subtle) bg-(--color-badge-bg) text-(--color-text-muted) font-medium">
          {role}
        </span>
        {streakDays > 0 && (
          <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border border-(--color-border-subtle) bg-(--color-badge-bg) text-(--color-text-muted) font-medium">
            <Flame className="w-3.5 h-3.5 text-(--color-warning)" />
            {streakDays} day streak
          </span>
        )}
      </div>
    </div>
  );
}

function JobPipeline({ byStatus }: Readonly<{ byStatus: Record<JobApplicationStatus, number> }>) {
  return (
    <div className="rounded-md border border-(--color-border-subtle) bg-(--color-surface) shadow-(--shadow-card) p-5 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-(--color-text-primary)">Job pipeline</h2>
        <Link
          href="/dashboard/job-tracker"
          className="text-xs font-medium text-(--color-accent) hover:underline"
        >
          Open tracker
        </Link>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {PIPELINE_STAGES.map((stage) => (
          <div
            key={stage.key}
            className="rounded-sm border border-(--color-border-subtle) bg-(--color-bg-soft) px-4 py-3"
          >
            <div className="font-display text-2xl font-semibold tracking-tight">
              {byStatus[stage.key]}
            </div>
            <div className="text-xs text-(--color-text-muted) mt-0.5">{stage.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DifficultyChart({
  data,
  hasSolved,
  mounted,
}: Readonly<{ data: DashboardStatsDto; hasSolved: boolean; mounted: boolean }>) {
  const chartData = DIFFICULTIES.map((key) => ({
    key,
    label: key.charAt(0) + key.slice(1).toLowerCase(),
    value: data.assessments.byDifficulty[key],
  }));

  return (
    <div className="rounded-md border border-(--color-border-subtle) bg-(--color-surface) shadow-(--shadow-card) p-5 sm:p-6">
      <h2 className="text-sm font-semibold text-(--color-text-primary) mb-4">
        Problems solved by difficulty
      </h2>
      {hasSolved ? (
        <div className="h-64 w-full">
          {mounted && (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 12, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="var(--color-border-subtle)"
                />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }}
                />
                <YAxis
                  allowDecimals={false}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }}
                />
                <Tooltip cursor={{ fill: 'var(--color-accent-soft)' }} content={ChartTooltip} />
                <Bar
                  dataKey="value"
                  fill="var(--color-accent)"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={64}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      ) : (
        <div className="h-64 flex flex-col items-center justify-center text-center gap-2">
          <Code2 className="w-8 h-8 text-(--color-text-muted)" />
          <p className="text-sm text-(--color-text-muted) mb-0">
            No problems solved yet — start a code assessment to see your progress.
          </p>
          <Link
            href="/dashboard/assessment"
            className="text-sm font-medium text-(--color-accent) hover:underline"
          >
            Open code editor
          </Link>
        </div>
      )}
    </div>
  );
}

function RecentActivity({ items }: Readonly<{ items: ActivityItem[] }>) {
  return (
    <div className="rounded-md border border-(--color-border-subtle) bg-(--color-surface) shadow-(--shadow-card) p-5 sm:p-6">
      <h2 className="text-sm font-semibold text-(--color-text-primary) mb-5">Recent activity</h2>
      {items.length > 0 ? (
        <div className="flex flex-col divide-y divide-(--color-border-subtle)">
          {items.map((item) => {
            const Icon = item.icon;
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
                    <div className="text-xs text-(--color-text-muted) capitalize">{item.detail}</div>
                  </div>
                  <span className="text-xs text-(--color-text-muted) shrink-0">
                    {formatRelative(item.timestamp)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-(--color-text-muted) mb-0">
          No recent activity yet. Solve a problem or analyze your resume to get started.
        </p>
      )}
    </div>
  );
}

function PreparationInsights({
  acceptanceRate,
  resumeAts,
  interviewScore,
}: Readonly<{ acceptanceRate: number; resumeAts: number | null; interviewScore: number | null }>) {
  const hasReadinessSignal = resumeAts !== null || interviewScore !== null;
  return (
    <div className="rounded-md border border-(--color-border-subtle) bg-(--color-surface) shadow-(--shadow-card) p-5 sm:p-6">
      <h2 className="text-sm font-semibold text-(--color-text-primary) mb-5">Preparation insights</h2>
      <div className="flex flex-col gap-5">
        <ProgressRow label="Code acceptance rate" value={acceptanceRate} />
        {resumeAts !== null && <ProgressRow label="Resume ATS readiness" value={resumeAts} />}
        {interviewScore !== null && (
          <ProgressRow label="Last interview score" value={interviewScore} />
        )}
        {!hasReadinessSignal && (
          <p className="text-xs text-(--color-text-muted) mb-0">
            Analyze your resume or run a mock interview to unlock readiness signals.
          </p>
        )}
      </div>
    </div>
  );
}

function CommunityCard({
  forum,
}: Readonly<{ forum: DashboardStatsDto['forum'] }>) {
  const rows = [
    { label: 'Posts', value: forum.postsCreated, icon: MessagesSquare },
    { label: 'Comments', value: forum.commentsPosted, icon: MessagesSquare },
    { label: 'Upvotes', value: forum.upvotesReceived, icon: ThumbsUp },
  ];
  return (
    <div className="rounded-md border border-(--color-border-subtle) bg-(--color-surface) shadow-(--shadow-card) p-5 sm:p-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-sm font-semibold text-(--color-text-primary)">Community</h2>
        <Link
          href="/dashboard/forum"
          className="text-xs font-medium text-(--color-accent) hover:underline"
        >
          Visit forum
        </Link>
      </div>
      <div className="flex flex-col gap-3">
        {rows.map((row) => {
          const Icon = row.icon;
          return (
            <div key={row.label} className="flex items-center justify-between">
              <span className="inline-flex items-center gap-2 text-sm text-(--color-text-muted)">
                <Icon className="w-4 h-4" />
                {row.label}
              </span>
              <span className="font-display text-lg font-semibold text-(--color-text-primary)">
                {row.value}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function QuickStartActions({ actions }: Readonly<{ actions: QuickAction[] }>) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {actions.map((action) => {
        const Icon = quickActionIcons[action.key];
        return (
          <Link
            key={action.key}
            href={action.href}
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
              <p className="text-sm text-(--color-text-muted) mt-1 mb-0">{action.description}</p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-8 animate-pulse">
      <div className="h-20 rounded-md bg-(--color-badge-bg)" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[0, 1, 2, 3].map((key) => (
          <div key={key} className="h-28 rounded-md bg-(--color-badge-bg)" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="h-80 rounded-md bg-(--color-badge-bg) lg:col-span-2" />
        <div className="h-80 rounded-md bg-(--color-badge-bg)" />
      </div>
    </div>
  );
}

function DashboardError({ message, onRetry }: Readonly<{ message: string; onRetry: () => void }>) {
  return (
    <div className="rounded-md border border-(--color-border-subtle) bg-(--color-surface) shadow-(--shadow-card) p-8 flex flex-col items-center text-center gap-3">
      <span className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-(--color-danger-soft) text-(--color-danger)">
        <AlertCircle className="w-6 h-6" />
      </span>
      <h2 className="font-display text-xl font-semibold">Could not load your dashboard</h2>
      <p className="text-sm text-(--color-text-muted) max-w-sm mb-1">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="rounded-sm bg-(--color-accent) text-white px-4 py-2 text-sm font-medium transition-colors hover:bg-(--color-accent-hover)"
      >
        Try again
      </button>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { stats, quickActions, isLoading, error, loadDashboard } = useDashboardStore();
  const resumeAnalyses = useResumeStore((state) => state.analyses);
  const interviewFeedback = useMockInterviewStore((state) => state.feedback);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    void loadDashboard();
  }, [loadDashboard]);

  if (isLoading && !stats) {
    return (
      <PageContainer>
        <DashboardSkeleton />
      </PageContainer>
    );
  }

  if (error && !stats) {
    return (
      <PageContainer>
        <DashboardError message={error} onRetry={() => void loadDashboard()} />
      </PageContainer>
    );
  }

  const currentUser = mounted ? user : null;
  const data = stats ?? EMPTY_STATS;
  const statCards = buildStatCards(data);
  const activity = buildActivity(data, resumeAnalyses, mounted);
  const latestResume = mounted
    ? resumeAnalyses.find((analysis) => analysis.status === 'COMPLETED' && analysis.atsScore !== null)
    : undefined;
  const resumeAts = latestResume?.atsScore ?? null;
  const interviewScore = mounted ? (interviewFeedback?.overallScore ?? null) : null;

  return (
    <PageContainer>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="flex flex-col gap-8 sm:gap-10"
      >
        <motion.section variants={itemVariants}>
          <HeroHeader
            name={resolveDisplayName(currentUser)}
            role={currentUser?.role ?? 'Candidate'}
            streakDays={data.leaderboard.streakDays}
          />
        </motion.section>

        <motion.section variants={itemVariants}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {statCards.map((card) => (
              <StatCard key={card.label} {...card} />
            ))}
          </div>
        </motion.section>

        <motion.section variants={itemVariants}>
          <JobPipeline byStatus={data.jobTracker.byStatus} />
        </motion.section>

        <motion.section variants={itemVariants}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 flex flex-col gap-6">
              <DifficultyChart
                data={data}
                hasSolved={data.assessments.problemsSolved > 0}
                mounted={mounted}
              />
              <RecentActivity items={activity} />
            </div>

            <div className="flex flex-col gap-6">
              <PreparationInsights
                acceptanceRate={data.assessments.acceptanceRate}
                resumeAts={resumeAts}
                interviewScore={interviewScore}
              />
              <CommunityCard forum={data.forum} />
            </div>
          </div>
        </motion.section>

        <motion.section variants={itemVariants}>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-(--color-text-muted) mb-4">
            Quick start
          </h2>
          <QuickStartActions actions={quickActions} />
        </motion.section>
      </motion.div>
    </PageContainer>
  );
}
