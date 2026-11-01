'use client';

import * as React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Clock } from 'lucide-react';

interface PendingApprovalPanelProps {
  email: string;
  title?: string;
}

export function PendingApprovalPanel({
  email,
  title = 'Registration received',
}: Readonly<PendingApprovalPanelProps>) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="flex w-full flex-col items-center gap-5 text-center lg:items-start lg:text-left"
      role="status"
    >
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-(--color-warning-soft) text-(--color-warning)">
        <Clock className="h-5 w-5" />
      </span>
      <div className="flex flex-col gap-2">
        <h2 className="text-xl font-semibold text-(--color-text-primary)">{title}</h2>
        <p className="text-sm leading-6 text-(--color-text-muted)">
          Your account for <span className="font-medium text-(--color-text-primary)">{email}</span>{' '}
          is waiting for admin approval. You will be able to sign in as soon as it is approved.
        </p>
      </div>
      <Link
        href="/login"
        className="text-sm font-medium text-(--color-accent) hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-accent)"
      >
        Back to sign in
      </Link>
    </motion.div>
  );
}
