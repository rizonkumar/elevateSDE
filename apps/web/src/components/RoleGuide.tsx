'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { RoleList } from './RoleList';

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
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
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
            <div className="pt-4">
              <RoleList />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
