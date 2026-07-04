'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  type TooltipContentProps,
} from 'recharts';
import { Mail, Users, TrendingUp, Copy, Check } from 'lucide-react';
import { Button, Input } from '@elevatesde/ui';
import { useAuthStore } from '@/store/auth.store';
import { useToastStore } from '@/store/toast.store';
import { useOrgDashboardStore } from '@/store/org-dashboard.store';
import { PageContainer } from '@/components/dashboard/PageContainer';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' as const } },
};

function ChartTooltip({ active, payload, label }: TooltipContentProps) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="rounded-lg border border-(--color-border-subtle) bg-(--color-surface) px-3 py-2 shadow-(--shadow-soft)">
      <div className="text-xs font-semibold text-(--color-text-primary)">{label}</div>
      <div className="text-xs text-(--color-text-muted)">Avg score: {payload[0]?.value}</div>
    </div>
  );
}

export default function OrgDashboardPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const addToast = useToastStore((state) => state.addToast);
  const {
    company,
    seats,
    members,
    teamPerformance,
    loadOrgDashboard,
    inviteMember,
    lastInviteUrl,
    clearInviteUrl,
  } = useOrgDashboardStore();

  const [mounted, setMounted] = React.useState(false);
  const [email, setEmail] = React.useState('');
  const [error, setError] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    loadOrgDashboard();
  }, [loadOrgDashboard]);

  React.useEffect(() => {
    if (mounted && user && user.role !== 'TENANT_ADMIN') {
      router.replace('/dashboard');
    }
  }, [mounted, user, router]);

  const seatData = [{ name: 'seats', value: seats.used }];
  const seatPercent = Math.round((seats.used / seats.total) * 100);

  const handleInvite = async (event: React.SyntheticEvent) => {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setCopied(false);
    const result = await inviteMember(email);
    setSubmitting(false);
    if (result.ok) {
      setError('');
      setEmail('');
      addToast(result.message, 'success');
    } else {
      setError(result.message);
      addToast(result.message, 'error');
    }
  };

  const handleCopyInviteUrl = async () => {
    if (!lastInviteUrl) return;
    try {
      await navigator.clipboard.writeText(lastInviteUrl);
      setCopied(true);
      addToast('Invite link copied.', 'success');
    } catch {
      addToast('Could not copy the link. Copy it manually.', 'error');
    }
  };

  if (user && user.role !== 'TENANT_ADMIN') {
    return null;
  }

  return (
    <PageContainer>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="flex flex-col gap-8 sm:gap-10"
      >
        <motion.section variants={itemVariants}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="mb-2 text-xs font-semibold tracking-[0.12em] text-(--color-accent) uppercase">
                Organization workspace
              </div>
              <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
                {company.name}
              </h1>
              <p className="mt-2 mb-0 text-(--color-text-muted)">
                Monitor seat usage, team performance, and member invitations.
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span className="rounded-full border border-(--color-border-subtle) bg-(--color-badge-bg) px-3 py-1.5 text-xs font-medium text-(--color-text-muted)">
                {company.plan} plan
              </span>
              <span className="rounded-full border border-(--color-border-subtle) bg-(--color-badge-bg) px-3 py-1.5 text-xs font-medium text-(--color-text-muted)">
                {seats.used} of {seats.total} seats
              </span>
            </div>
          </div>
        </motion.section>

        <motion.section variants={itemVariants}>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
            <div className="card flex flex-col lg:col-span-2">
              <div className="mb-2 flex items-center gap-2">
                <Users className="h-4 w-4 text-(--color-accent)" />
                <h2 className="text-sm font-semibold text-(--color-text-primary)">Seat usage</h2>
              </div>
              <div className="relative h-60 w-full">
                {mounted && (
                  <ResponsiveContainer width="100%" height="100%">
                    <RadialBarChart
                      innerRadius="72%"
                      outerRadius="100%"
                      data={seatData}
                      startAngle={90}
                      endAngle={-270}
                    >
                      <PolarAngleAxis
                        type="number"
                        domain={[0, seats.total]}
                        angleAxisId={0}
                        tick={false}
                      />
                      <RadialBar
                        background={{ fill: 'var(--color-badge-bg)' }}
                        dataKey="value"
                        cornerRadius={16}
                        angleAxisId={0}
                        fill="var(--color-accent)"
                      />
                    </RadialBarChart>
                  </ResponsiveContainer>
                )}
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <div className="font-display text-3xl font-bold text-(--color-text-primary)">
                    {seats.used} / {seats.total}
                  </div>
                  <div className="text-xs tracking-wider text-(--color-text-muted) uppercase">
                    Seats · {seatPercent}%
                  </div>
                </div>
              </div>
            </div>

            <div className="card flex flex-col lg:col-span-3">
              <div className="mb-2 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-(--color-accent)" />
                <h2 className="text-sm font-semibold text-(--color-text-primary)">
                  Team performance
                </h2>
              </div>
              <div className="h-60 w-full">
                {mounted && (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={teamPerformance}
                      margin={{ top: 12, right: 8, left: -16, bottom: 0 }}
                    >
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
                        domain={[0, 100]}
                        tickLine={false}
                        axisLine={false}
                        tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }}
                      />
                      <Tooltip
                        cursor={{ fill: 'var(--color-accent-soft)' }}
                        content={ChartTooltip}
                      />
                      <Bar
                        dataKey="score"
                        fill="var(--color-accent)"
                        radius={[6, 6, 0, 0]}
                        maxBarSize={48}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>
        </motion.section>

        <motion.section variants={itemVariants}>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
            <div className="card lg:col-span-2">
              <div className="mb-4 flex items-center gap-2">
                <Mail className="h-4 w-4 text-(--color-accent)" />
                <h2 className="text-sm font-semibold text-(--color-text-primary)">
                  Invite a member
                </h2>
              </div>
              <form onSubmit={handleInvite} className="flex flex-col gap-4">
                <Input
                  label="Work email"
                  type="email"
                  placeholder="teammate@company.com"
                  value={email}
                  error={error}
                  icon={<Mail className="h-4 w-4" />}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError('');
                  }}
                />
                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? 'Generating link…' : 'Generate invite link'}
                </Button>
                <p className="mb-0 text-xs text-(--color-text-muted)">
                  {seats.total - seats.used} seat{seats.total - seats.used === 1 ? '' : 's'}{' '}
                  remaining on your plan.
                </p>
              </form>

              {lastInviteUrl && (
                <div className="mt-4 rounded-lg border border-(--color-border-subtle) bg-(--color-badge-bg) p-3">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-(--color-text-primary)">
                      Share this invite link
                    </span>
                    <button
                      type="button"
                      onClick={clearInviteUrl}
                      className="text-xs text-(--color-text-muted) hover:text-(--color-text-primary)"
                    >
                      Dismiss
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="min-w-0 flex-1 truncate rounded-md bg-(--color-surface) px-2 py-1.5 text-xs text-(--color-text-muted)">
                      {lastInviteUrl}
                    </code>
                    <button
                      type="button"
                      onClick={handleCopyInviteUrl}
                      aria-label="Copy invite link"
                      className="shrink-0 rounded-md border border-(--color-border-subtle) p-1.5 text-(--color-text-muted) hover:text-(--color-accent)"
                    >
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="card lg:col-span-3">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-(--color-text-primary)">Members</h2>
                <span className="text-xs text-(--color-text-muted)">{members.length} total</span>
              </div>
              <div className="flex flex-col divide-y divide-(--color-border-subtle)">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium text-(--color-text-primary)">
                        {member.email}
                      </div>
                      <div className="text-xs text-(--color-text-muted)">
                        {member.status === 'active'
                          ? `Avg score ${member.avgScore}`
                          : 'Invitation pending'}
                      </div>
                    </div>
                    <span
                      className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase ${
                        member.status === 'active'
                          ? 'border-(--color-border-subtle) bg-(--color-badge-bg) text-(--color-text-muted)'
                          : 'border-(--color-accent) text-(--color-accent)'
                      }`}
                    >
                      {member.status}
                    </span>
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
