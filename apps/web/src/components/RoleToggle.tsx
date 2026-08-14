'use client';

import * as React from 'react';
import { motion } from 'framer-motion';

interface RoleToggleProps {
  role: 'USER' | 'TENANT_ADMIN';
  onChange: (role: 'USER' | 'TENANT_ADMIN') => void;
}

export function RoleToggle({ role, onChange }: Readonly<RoleToggleProps>) {
  return (
    <div className="relative flex p-1 bg-(--color-tab-bg) border border-(--color-border-subtle) rounded-full mb-6 select-none">
      <button
        type="button"
        className={`relative flex-1 py-1.5 text-xs font-semibold tracking-wider uppercase transition-colors duration-200 z-10 cursor-pointer ${
          role === 'USER'
            ? 'text-(--color-text-primary)'
            : 'text-(--color-text-muted) hover:text-(--color-text-primary)'
        }`}
        onClick={() => onChange('USER')}
      >
        {role === 'USER' && (
          <motion.div
            layoutId="active-tab"
            className="absolute inset-0 bg-(--color-tab-active) border border-(--color-border-subtle) rounded-full shadow-sm animate-fade-in"
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
          />
        )}
        <span className="relative z-20">Candidate</span>
      </button>
      <button
        type="button"
        className={`relative flex-1 py-1.5 text-xs font-semibold tracking-wider uppercase transition-colors duration-200 z-10 cursor-pointer ${
          role === 'TENANT_ADMIN'
            ? 'text-(--color-text-primary)'
            : 'text-(--color-text-muted) hover:text-(--color-text-primary)'
        }`}
        onClick={() => onChange('TENANT_ADMIN')}
      >
        {role === 'TENANT_ADMIN' && (
          <motion.div
            layoutId="active-tab"
            className="absolute inset-0 bg-(--color-tab-active) border border-(--color-border-subtle) rounded-full shadow-sm animate-fade-in"
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
          />
        )}
        <span className="relative z-20">Organization</span>
      </button>
    </div>
  );
}
