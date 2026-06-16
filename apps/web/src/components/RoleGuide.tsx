'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, GraduationCap, Building2, Shield, type LucideIcon } from 'lucide-react';

interface RoleInfo {
  name: string;
  icon: LucideIcon;
  summary: string;
}

const ROLES: RoleInfo[] = [
  {
    name: 'Candidate',
    icon: GraduationCap,
    summary: 'Practice AI mock interviews, track job applications, and analyze your resume.',
  },
  {
    name: 'Organization',
    icon: Building2,
    summary: "Everything a candidate gets, plus manage your team's seats and performance.",
  },
  {
    name: 'Admin',
    icon: Shield,
    summary: 'Platform staff. Manage users, tenants, and feature flags from the Admin Console.',
  },
];

interface RoleGuideProps {
  defaultOpen?: boolean;
}

export function RoleGuide({ defaultOpen = false }: RoleGuideProps) {
  const [open, setOpen] = React.useState(defaultOpen);

  return (
    <div className="border-t border-[var(--color-border-subtle)] pt-3 mt-1">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        className="flex items-center justify-center gap-1.5 w-full text-xs font-medium text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors cursor-pointer"
      >
        Which account is right for me?
        <ChevronDown
          className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <ul className="flex flex-col gap-2.5 pt-3 text-left">
              {ROLES.map((role) => {
                const Icon = role.icon;
                return (
                  <li
                    key={role.name}
                    className="flex items-start gap-3 rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-soft)] p-3"
                  >
                    <span className="flex items-center justify-center w-8 h-8 shrink-0 rounded-full bg-[var(--color-accent-soft)] text-[var(--color-accent)]">
                      <Icon className="w-4 h-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-[var(--color-text-primary)]">
                        {role.name}
                      </p>
                      <p className="text-xs text-[var(--color-text-muted)] mt-0.5 leading-relaxed">
                        {role.summary}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
            <p className="text-[11px] text-[var(--color-text-muted)] mt-3 leading-relaxed">
              Your role is set when you register. Candidates and organizations sign in here; admins
              use the Admin Console.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
