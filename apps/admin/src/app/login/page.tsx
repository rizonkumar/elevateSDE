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
          <span className="lg:hidden flex items-center justify-center w-12 h-12 rounded-full bg-(--color-accent-soft) text-(--color-accent) mb-4">
            <ShieldCheck className="w-6 h-6" />
          </span>
          <div className="lg:hidden flex items-center gap-2 select-none mb-4">
            <span className="text-lg font-bold tracking-tight text-(--color-text-primary)">
              Elevate<span className="text-(--color-accent)">SDE</span>
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-(--color-badge-bg) border border-(--color-border-subtle) text-[10px] font-bold uppercase tracking-widest text-(--color-text-muted)">
              Admin
            </span>
          </div>
          <h2 className="text-xl font-semibold text-(--color-text-primary)">
            Sign in to Admin Console
          </h2>
          <p className="text-xs text-(--color-text-muted) mt-1.5">
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
            icon={<Mail className="w-4 h-4 text-(--color-text-muted)" />}
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
            icon={<Lock className="w-4 h-4 text-(--color-text-muted)" />}
          />

          <Button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 font-medium cursor-pointer mt-1"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </Button>
        </form>

        <div className="border-t border-(--color-border-subtle) mt-6 pt-4 text-center text-xs text-(--color-text-muted)">
          Not an administrator?{' '}
          <a
            href="/login"
            className="font-semibold text-(--color-text-primary) underline underline-offset-4 decoration-(--color-border-subtle) hover:decoration-(--color-text-primary) transition-colors"
          >
            Back to standard sign in
          </a>
        </div>
      </motion.div>
    </AdminAuthLayout>
  );
}
