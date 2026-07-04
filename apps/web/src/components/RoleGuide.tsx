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
    <div className="mt-1 border-t border-(--color-border-subtle) pt-3">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        className="flex w-full cursor-pointer items-center justify-center gap-1.5 text-xs font-medium text-(--color-text-muted) transition-colors hover:text-(--color-text-primary)"
      >
        Which account is right for me?
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
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
