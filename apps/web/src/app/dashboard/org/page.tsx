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
import { Mail, Users, TrendingUp } from 'lucide-react';
import { Button, Input } from '@elevatesde/ui';
import { useAuthStore } from '@/store/auth.store';
import { useToastStore } from '@/store/toast.store';
import { useOrgDashboardStore } from '@/store/org-dashboard.store';

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
  const { company, seats, members, teamPerformance, loadOrgDashboard, inviteMember } =
    useOrgDashboardStore();

  const [mounted, setMounted] = React.useState(false);
  const [email, setEmail] = React.useState('');
  const [error, setError] = React.useState('');

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

  const handleInvite = (event: React.FormEvent) => {
    event.preventDefault();
    const result = inviteMember(email);
    if (result.ok) {
      setError('');
      setEmail('');
      addToast(result.message, 'success');
    } else {
      setError(result.message);
      addToast(result.message, 'error');
    }
  };

  if (user && user.role !== 'TENANT_ADMIN') {
    return null;
  }

  return (
    <motion.main
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="w-full max-w-350 mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 flex flex-col gap-8 sm:gap-10"
    >
        <motion.section variants={itemVariants}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.12em] text-(--color-accent) mb-2">
                Organization workspace
              </div>
              <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight">
                {company.name}
              </h1>
              <p className="text-(--color-text-muted) mt-2 mb-0">
                Monitor seat usage, team performance, and member invitations.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs px-3 py-1.5 rounded-full border border-(--color-border-subtle) bg-(--color-badge-bg) text-(--color-text-muted) font-medium">
                {company.plan} plan
              </span>
              <span className="text-xs px-3 py-1.5 rounded-full border border-(--color-border-subtle) bg-(--color-badge-bg) text-(--color-text-muted) font-medium">
                {seats.used} of {seats.total} seats
              </span>
            </div>
          </div>
        </motion.section>

        <motion.section variants={itemVariants}>
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="card lg:col-span-2 flex flex-col">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-(--color-accent)" />
                <h2 className="text-sm font-semibold text-(--color-text-primary)">
                  Seat usage
                </h2>
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
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <div className="font-display text-3xl font-bold text-(--color-text-primary)">
                    {seats.used} / {seats.total}
                  </div>
                  <div className="text-xs text-(--color-text-muted) uppercase tracking-wider">
                    Seats · {seatPercent}%
                  </div>
                </div>
              </div>
            </div>

            <div className="card lg:col-span-3 flex flex-col">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-(--color-accent)" />
                <h2 className="text-sm font-semibold text-(--color-text-primary)">
                  Team performance
                </h2>
              </div>
              <div className="h-60 w-full">
                {mounted && (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={teamPerformance} margin={{ top: 12, right: 8, left: -16, bottom: 0 }}>
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
                      <Tooltip cursor={{ fill: 'var(--color-accent-soft)' }} content={ChartTooltip} />
                      <Bar dataKey="score" fill="var(--color-accent)" radius={[6, 6, 0, 0]} maxBarSize={48} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>
        </motion.section>

        <motion.section variants={itemVariants}>
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="card lg:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <Mail className="w-4 h-4 text-(--color-accent)" />
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
                  icon={<Mail className="w-4 h-4" />}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError('');
                  }}
                />
                <Button type="submit" className="w-full">
                  Send invitation
                </Button>
                <p className="text-xs text-(--color-text-muted) mb-0">
                  {seats.total - seats.used} seat{seats.total - seats.used === 1 ? '' : 's'} remaining
                  on your plan.
                </p>
              </form>
            </div>

            <div className="card lg:col-span-3">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-(--color-text-primary)">Members</h2>
                <span className="text-xs text-(--color-text-muted)">{members.length} total</span>
              </div>
              <div className="flex flex-col divide-y divide-(--color-border-subtle)">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-(--color-text-primary) truncate">
                        {member.email}
                      </div>
                      <div className="text-xs text-(--color-text-muted)">
                        {member.status === 'active'
                          ? `Avg score ${member.avgScore}`
                          : 'Invitation pending'}
                      </div>
                    </div>
                    <span
                      className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border shrink-0 ${
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
    </motion.main>
  );
}
