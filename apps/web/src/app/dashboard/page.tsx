'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { Navbar } from '../../components/Navbar';
import { useAuthStore } from '../../store/auth.store';

export default function DashboardPage() {
  const { user } = useAuthStore();

  const formattedDate = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '';

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' as const } },
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-bg)] text-[var(--color-text-primary)] transition-colors duration-200">
      <Navbar />

      <motion.main
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="flex-1 page"
      >
        <motion.section variants={itemVariants} className="section">
          <div className="hero">
            <div>
              <div className="hero-kicker">Welcome back</div>
              <h1 className="h1">{user?.email}</h1>
              <p className="text-base text-[var(--color-text-muted)] mt-1">
                Role:{' '}
                <span className="text-[var(--color-text-primary)] font-semibold">{user?.role}</span>
              </p>
              {user?.tenantId && (
                <p className="text-sm text-[var(--color-text-muted)]">
                  Tenant Workspace:{' '}
                  <span className="text-[var(--color-text-primary)] font-mono">
                    {user.tenantId}
                  </span>
                </p>
              )}
              <p className="text-xs text-[var(--color-text-muted)] mt-2">
                Member since {formattedDate}
              </p>
            </div>

            <aside className="hero-meta border-l border-[var(--color-border-subtle)] pl-6 md:pl-8">
              <div className="hero-meta-row">
                <span className="hero-chip">Active Session</span>
              </div>
              <div className="hero-meta-row">
                <span className="text-xs">Secure JWT Rotation</span>
              </div>
            </aside>
          </div>
        </motion.section>

        <motion.section variants={itemVariants} className="section">
          <h2 className="h2 mb-8">Selected Wins & Metrics</h2>
          <div className="metrics">
            <div className="metric">
              <div className="metric-value">3</div>
              <div className="metric-label">Completed mock interviews</div>
            </div>
            <div className="metric">
              <div className="metric-value">85%</div>
              <div className="metric-label">Average assessment score</div>
            </div>
            <div className="metric">
              <div className="metric-value">12</div>
              <div className="metric-label">Practice questions solved</div>
            </div>
          </div>
        </motion.section>

        <motion.section variants={itemVariants} className="section border-none">
          <h2 className="h2 mb-6">Upcoming Practice Tasks</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card">
              <div className="card-header">
                <div className="card-title">AI Mock Interview: System Design</div>
                <div className="card-meta">Scheduled</div>
              </div>
              <div className="card-body mt-2">
                <p>
                  Practice designing a rate limiter or real-time notification engine. Submit
                  responses and receive instant feedback.
                </p>
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <div className="card-title">DSA Assessment: Dynamic Programming</div>
                <div className="card-meta">Ready</div>
              </div>
              <div className="card-body mt-2">
                <p>
                  Solve 3 standard algorithmic challenges in 60 minutes with isolated test case
                  execution environment.
                </p>
              </div>
            </div>
          </div>
        </motion.section>
      </motion.main>
    </div>
  );
}
