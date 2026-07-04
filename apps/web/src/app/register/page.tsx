'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, Building2, User } from 'lucide-react';
import { Button, Input } from '@elevatesde/ui';
import { AuthLayout } from '../../components/AuthLayout';
import { RoleGuide } from '../../components/RoleGuide';
import { useAuthStore } from '../../store/auth.store';
import { useToastStore } from '../../store/toast.store';
import { api } from '../../lib/api';
import { AuthResponseDto } from '@elevatesde/shared-types';

interface AxiosErrorResponse {
  response?: {
    data?: {
      message?: string;
    };
  };
}

export default function RegisterPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const addToast = useToastStore((state) => state.addToast);

  const [role, setRole] = React.useState<'USER' | 'TENANT_ADMIN'>('USER');
  const [firstName, setFirstName] = React.useState('');
  const [lastName, setLastName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [companyName, setCompanyName] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [redirectTo, setRedirectTo] = React.useState('/dashboard');

  React.useEffect(() => {
    if (globalThis.window === undefined) return;
    const target = new URLSearchParams(globalThis.location.search).get('redirect');
    if (target?.startsWith('/') && !target.startsWith('//')) {
      setRedirectTo(target);
    }
  }, []);

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email || !password || (role === 'TENANT_ADMIN' && !companyName)) {
      addToast('Please fill in all required fields.', 'error');
      return;
    }
    if (password.length < 8) {
      addToast('Password must be at least 8 characters long.', 'error');
      return;
    }
    setLoading(true);

    try {
      const payload: {
        email: string;
        password?: string;
        role: string;
        companyName?: string;
        firstName?: string;
        lastName?: string;
      } = {
        email,
        password,
        role,
      };
      if (firstName.trim()) {
        payload.firstName = firstName.trim();
      }
      if (lastName.trim()) {
        payload.lastName = lastName.trim();
      }
      if (role === 'TENANT_ADMIN') {
        payload.companyName = companyName;
      }

      const response = await api.post<AuthResponseDto>('/api/v1/auth/register', payload);
      const { user, accessToken, refreshToken } = response.data;
      setAuth(user, accessToken, refreshToken);
      addToast('Welcome to ElevateSDE! Account created.', 'success');
      router.push(redirectTo);
    } catch (err) {
      const axiosError = err as AxiosErrorResponse;
      addToast(
        axiosError.response?.data?.message ||
          'Failed to create account. Email may already be registered.',
        'error',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="w-full"
      >
        <div className="mb-8 text-center lg:text-left">
          <Link
            href="/"
            className="text-xl font-bold tracking-tight text-(--color-text-primary) select-none lg:hidden"
          >
            Elevate<span className="text-(--color-accent)">SDE</span>
          </Link>
          <h2 className="mt-4 text-xl font-semibold text-(--color-text-primary) lg:mt-0">
            Create your account
          </h2>
          <p className="mt-1.5 text-xs text-(--color-text-muted)">
            Start preparing with enterprise-grade AI mock interviews
          </p>
        </div>

        <div className="relative mb-6 flex rounded-full border border-(--color-border-subtle) bg-(--color-tab-bg) p-1 select-none">
          <button
            type="button"
            className={`relative z-10 flex-1 cursor-pointer py-1.5 text-xs font-semibold tracking-wider uppercase transition-colors duration-200 ${
              role === 'USER'
                ? 'text-(--color-text-primary)'
                : 'text-(--color-text-muted) hover:text-(--color-text-primary)'
            }`}
            onClick={() => setRole('USER')}
          >
            {role === 'USER' && (
              <motion.div
                layoutId="active-tab"
                className="animate-fade-in absolute inset-0 rounded-full border border-(--color-border-subtle) bg-(--color-tab-active) shadow-sm"
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              />
            )}
            <span className="relative z-20">Candidate</span>
          </button>
          <button
            type="button"
            className={`relative z-10 flex-1 cursor-pointer py-1.5 text-xs font-semibold tracking-wider uppercase transition-colors duration-200 ${
              role === 'TENANT_ADMIN'
                ? 'text-(--color-text-primary)'
                : 'text-(--color-text-muted) hover:text-(--color-text-primary)'
            }`}
            onClick={() => setRole('TENANT_ADMIN')}
          >
            {role === 'TENANT_ADMIN' && (
              <motion.div
                layoutId="active-tab"
                className="animate-fade-in absolute inset-0 rounded-full border border-(--color-border-subtle) bg-(--color-tab-active) shadow-sm"
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              />
            )}
            <span className="relative z-20">Organization</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              type="text"
              label="First Name"
              placeholder="Ada"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              disabled={loading}
              autoComplete="given-name"
              icon={<User className="h-4 w-4 text-(--color-text-muted)" />}
            />
            <Input
              type="text"
              label="Last Name"
              placeholder="Lovelace"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              disabled={loading}
              autoComplete="family-name"
              icon={<User className="h-4 w-4 text-(--color-text-muted)" />}
            />
          </div>

          <Input
            type="email"
            label="Email Address"
            placeholder="name@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            required
            autoComplete="email"
            icon={<Mail className="h-4 w-4 text-(--color-text-muted)" />}
          />

          <Input
            type="password"
            label="Password"
            placeholder="Min. 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            required
            autoComplete="new-password"
            icon={<Lock className="h-4 w-4 text-(--color-text-muted)" />}
          />

          <AnimatePresence initial={false}>
            {role === 'TENANT_ADMIN' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2, ease: 'easeInOut' }}
                className="overflow-hidden"
              >
                <div className="pt-1.5">
                  <Input
                    type="text"
                    label="Company Name"
                    placeholder="e.g. Acme Corp"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    disabled={loading}
                    required
                    icon={<Building2 className="h-4 w-4 text-(--color-text-muted)" />}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <Button
            type="submit"
            disabled={loading}
            className="mt-2 w-full cursor-pointer py-2.5 font-medium"
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </Button>
        </form>

        <div className="mt-6 flex flex-col gap-2.5 text-center text-xs text-(--color-text-muted)">
          <div>
            Already have an account?{' '}
            <Link href="/login" className="font-medium text-(--color-accent) hover:underline">
              Sign In
            </Link>
          </div>
          <div className="mt-1 border-t border-(--color-border-subtle) pt-3">
            Are you a system administrator?{' '}
            <a href="/admin/login" className="font-semibold text-(--color-accent) hover:underline">
              Sign in to Admin Console
            </a>
          </div>
          <div className="lg:hidden">
            <RoleGuide />
          </div>
        </div>
      </motion.div>
    </AuthLayout>
  );
}
