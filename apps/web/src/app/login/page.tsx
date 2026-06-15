'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Mail, Lock } from 'lucide-react';
import { Button, Input } from '@elevatesde/ui';
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
  const addToast = useToastStore((state) => state.addToast);

  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
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
      setAuth(user, accessToken, refreshToken);
      addToast('Welcome back! Successfully logged in.', 'success');
      router.push('/dashboard');
    } catch (err) {
      const axiosError = err as AxiosErrorResponse;
      addToast(
        axiosError.response?.data?.message || 'Failed to sign in. Please verify your credentials.',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)] px-4 transition-colors duration-200">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="w-full max-w-sm card bg-[var(--color-surface)] border border-[var(--color-border-subtle)] p-8 rounded-[var(--radius-lg)] shadow-lg"
      >
        <div className="text-center mb-8">
          <Link href="/" className="text-xl font-bold tracking-tight text-[var(--color-text-primary)] select-none">
            Elevate<span className="text-[var(--color-accent)]">SDE</span>
          </Link>
          <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mt-4">
            Sign in to your account
          </h2>
          <p className="text-xs text-[var(--color-text-muted)] mt-1.5">
            Continue your interview preparation journey
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <Input
            type="email"
            label="Email Address"
            placeholder="name@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            required
            autoComplete="email"
            icon={<Mail className="w-4 h-4 text-[var(--color-text-muted)]" />}
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
            icon={<Lock className="w-4 h-4 text-[var(--color-text-muted)]" />}
          />

          <Button type="submit" disabled={loading} className="w-full py-2.5 font-medium cursor-pointer">
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>

        <div className="text-center mt-6 text-xs text-[var(--color-text-muted)]">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="text-[var(--color-accent)] font-medium hover:underline">
            Create account
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
