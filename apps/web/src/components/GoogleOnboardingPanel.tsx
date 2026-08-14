'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2 } from 'lucide-react';
import { Button, Input } from '@elevatesde/ui';
import { RoleToggle } from './RoleToggle';
import { completeGoogleSignup } from '../lib/google-auth';
import { useToastStore } from '../store/toast.store';
import { AuthResponseDto } from '@elevatesde/shared-types';

interface AxiosErrorResponse {
  response?: {
    data?: {
      message?: string;
    };
  };
}

interface GoogleOnboardingPanelProps {
  email: string;
  firstName: string | null;
  lastName: string | null;
  onboardingToken: string;
  onComplete: (auth: AuthResponseDto) => void;
}

export function GoogleOnboardingPanel({
  email,
  firstName,
  lastName,
  onboardingToken,
  onComplete,
}: Readonly<GoogleOnboardingPanelProps>) {
  const addToast = useToastStore((state) => state.addToast);
  const [role, setRole] = React.useState<'USER' | 'TENANT_ADMIN'>('USER');
  const [companyName, setCompanyName] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const displayName = [firstName, lastName].filter(Boolean).join(' ');

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (role === 'TENANT_ADMIN' && !companyName.trim()) {
      addToast('Please enter your company name.', 'error');
      return;
    }
    setLoading(true);

    try {
      const auth = await completeGoogleSignup(
        onboardingToken,
        role,
        role === 'TENANT_ADMIN' ? companyName.trim() : undefined,
      );
      onComplete(auth);
    } catch (err) {
      const axiosError = err as AxiosErrorResponse;
      addToast(
        axiosError.response?.data?.message || 'Failed to complete sign-up. Please try again.',
        'error',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="w-full"
    >
      <div className="text-center lg:text-left mb-8">
        <h2 className="text-xl font-semibold text-(--color-text-primary)">One last step</h2>
        <p className="text-xs text-(--color-text-muted) mt-1.5">
          {displayName ? `Welcome, ${displayName}. ` : 'Welcome. '}
          Tell us how you will be using ElevateSDE, {email}.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <RoleToggle role={role} onChange={setRole} />

        <AnimatePresence initial={false}>
          {role === 'TENANT_ADMIN' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              <Input
                type="text"
                label="Company Name"
                placeholder="e.g. Acme Corp"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                disabled={loading}
                required
                icon={<Building2 className="w-4 h-4 text-(--color-text-muted)" />}
              />
            </motion.div>
          )}
        </AnimatePresence>

        <Button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 font-medium cursor-pointer mt-2"
        >
          {loading ? 'Finishing up...' : 'Continue'}
        </Button>
      </form>
    </motion.div>
  );
}
