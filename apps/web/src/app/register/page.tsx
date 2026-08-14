'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, Building2, User } from 'lucide-react';
import { Button, Input, GoogleSignInButton } from '@elevatesde/ui';
import { AuthLayout } from '../../components/AuthLayout';
import { RoleGuide } from '../../components/RoleGuide';
import { RoleToggle } from '../../components/RoleToggle';
import { GoogleOnboardingPanel } from '../../components/GoogleOnboardingPanel';
import { useAuthStore } from '../../store/auth.store';
import { useToastStore } from '../../store/toast.store';
import { api } from '../../lib/api';
import { signInWithGoogle } from '../../lib/google-auth';
import { AuthResponseDto, GoogleOnboardingDto } from '@elevatesde/shared-types';

interface AxiosErrorResponse {
  response?: {
    data?: {
      message?: string;
    };
  };
}

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';

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
  const [onboarding, setOnboarding] = React.useState<GoogleOnboardingDto | null>(null);

  React.useEffect(() => {
    if (globalThis.window === undefined) return;
    const target = new URLSearchParams(globalThis.location.search).get('redirect');
    if (target?.startsWith('/') && !target.startsWith('//')) {
      setRedirectTo(target);
    }
  }, []);

  const handleAuthenticated = (auth: AuthResponseDto, message: string) => {
    setAuth(auth.user, auth.accessToken, auth.refreshToken);
    addToast(message, 'success');
    router.push(redirectTo);
  };

  const handleGoogleCredential = async (idToken: string) => {
    try {
      const result = await signInWithGoogle(idToken);
      if (result.status === 'AUTHENTICATED' && result.auth) {
        handleAuthenticated(result.auth, 'Welcome back! Successfully logged in.');
        return;
      }
      if (result.status === 'ONBOARDING_REQUIRED' && result.onboarding) {
        setOnboarding(result.onboarding);
      }
    } catch (err) {
      const axiosError = err as AxiosErrorResponse;
      addToast(axiosError.response?.data?.message || 'Google sign-in failed.', 'error');
    }
  };

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
      handleAuthenticated(response.data, 'Welcome to ElevateSDE! Account created.');
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

  if (onboarding) {
    return (
      <AuthLayout>
        <GoogleOnboardingPanel
          email={onboarding.email}
          firstName={onboarding.firstName}
          lastName={onboarding.lastName}
          onboardingToken={onboarding.onboardingToken}
          onComplete={(auth) =>
            handleAuthenticated(auth, 'Welcome to ElevateSDE! Account created.')
          }
        />
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="w-full"
      >
        <div className="text-center lg:text-left mb-8">
          <Link
            href="/"
            className="lg:hidden text-xl font-bold tracking-tight text-(--color-text-primary) select-none"
          >
            Elevate<span className="text-(--color-accent)">SDE</span>
          </Link>
          <h2 className="text-xl font-semibold text-(--color-text-primary) mt-4 lg:mt-0">
            Create your account
          </h2>
          <p className="text-xs text-(--color-text-muted) mt-1.5">
            Start preparing with enterprise-grade AI mock interviews
          </p>
        </div>

        <RoleToggle role={role} onChange={setRole} />

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              type="text"
              label="First Name"
              placeholder="Ada"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              disabled={loading}
              autoComplete="given-name"
              icon={<User className="w-4 h-4 text-(--color-text-muted)" />}
            />
            <Input
              type="text"
              label="Last Name"
              placeholder="Lovelace"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              disabled={loading}
              autoComplete="family-name"
              icon={<User className="w-4 h-4 text-(--color-text-muted)" />}
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
            icon={<Mail className="w-4 h-4 text-(--color-text-muted)" />}
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
            icon={<Lock className="w-4 h-4 text-(--color-text-muted)" />}
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
                    icon={<Building2 className="w-4 h-4 text-(--color-text-muted)" />}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <Button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 font-medium cursor-pointer mt-2"
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </Button>
        </form>

        {GOOGLE_CLIENT_ID && (
          <>
            <div className="flex items-center gap-3 my-6">
              <div className="h-px flex-1 bg-(--color-border-subtle)" />
              <span className="text-[11px] uppercase tracking-wider text-(--color-text-muted)">
                Or
              </span>
              <div className="h-px flex-1 bg-(--color-border-subtle)" />
            </div>
            <GoogleSignInButton
              clientId={GOOGLE_CLIENT_ID}
              text="signup_with"
              disabled={loading}
              onCredential={handleGoogleCredential}
            />
          </>
        )}

        <div className="text-center mt-6 flex flex-col gap-2.5 text-xs text-(--color-text-muted)">
          <div>
            Already have an account?{' '}
            <Link href="/login" className="text-(--color-accent) font-medium hover:underline">
              Sign In
            </Link>
          </div>
          <div className="border-t border-(--color-border-subtle) pt-3 mt-1">
            Are you a system administrator?{' '}
            <a href="/admin/login" className="text-(--color-accent) font-semibold hover:underline">
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
