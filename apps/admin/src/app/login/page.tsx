'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Mail, Lock, ShieldCheck } from 'lucide-react';
import { Button, Input } from '@elevatesde/ui';
import { AdminAuthLayout } from '../../components/AdminAuthLayout';
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

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const addToast = useToastStore((state) => state.addToast);

  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!email || !password) {
      addToast('Please fill in all fields.', 'error');
      return;
    }
    setLoading(true);

    try {
      const response = await api.post<AuthResponseDto>('/api/v1/auth/login', {
        email,
        password,
      });
      const { user, accessToken, refreshToken } = response.data;
      if (user.role !== 'ADMIN') {
        clearAuth();
        addToast('Access Denied: Administrative permissions required.', 'error');
        return;
      }
      setAuth(user, accessToken, refreshToken);
      addToast('Successfully authenticated admin console.', 'success');
      router.push('/');
    } catch (err) {
      const axiosError = err as AxiosErrorResponse;
      addToast(
        axiosError.response?.data?.message || 'Authentication failed. Please verify credentials.',
        'error',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminAuthLayout>
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="w-full"
      >
        <div className="mb-8">
          <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-(--color-accent-soft) text-(--color-accent) lg:hidden">
            <ShieldCheck className="h-6 w-6" />
          </span>
          <div className="mb-4 flex items-center gap-2 select-none lg:hidden">
            <span className="text-lg font-bold tracking-tight text-(--color-text-primary)">
              Elevate<span className="text-(--color-accent)">SDE</span>
            </span>
            <span className="inline-flex items-center rounded-full border border-(--color-border-subtle) bg-(--color-badge-bg) px-2 py-0.5 text-[10px] font-bold tracking-widest text-(--color-text-muted) uppercase">
              Admin
            </span>
          </div>
          <h2 className="text-xl font-semibold text-(--color-text-primary)">
            Sign in to Admin Console
          </h2>
          <p className="mt-1.5 text-xs text-(--color-text-muted)">
            System administration & backoffice operations
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <Input
            type="email"
            label="Email Address"
            placeholder="admin@elevatesde.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            required
            autoComplete="email"
            className="bg-(--color-surface)"
            icon={<Mail className="h-4 w-4 text-(--color-text-muted)" />}
          />

          <Input
            type="password"
            label="Password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            required
            autoComplete="current-password"
            className="bg-(--color-surface)"
            icon={<Lock className="h-4 w-4 text-(--color-text-muted)" />}
          />

          <Button
            type="submit"
            disabled={loading}
            className="mt-1 w-full cursor-pointer py-2.5 font-medium"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </Button>
        </form>

        <div className="mt-6 border-t border-(--color-border-subtle) pt-4 text-center text-xs text-(--color-text-muted)">
          Not an administrator?{' '}
          <a
            href="/login"
            className="font-semibold text-(--color-text-primary) underline decoration-(--color-border-subtle) underline-offset-4 transition-colors hover:decoration-(--color-text-primary)"
          >
            Back to standard sign in
          </a>
        </div>
      </motion.div>
    </AdminAuthLayout>
  );
}
