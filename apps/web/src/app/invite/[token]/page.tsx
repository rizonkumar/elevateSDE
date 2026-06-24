'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Building2, MailCheck } from 'lucide-react';
import { Button } from '@elevatesde/ui';
import type { InvitePreviewDto } from '@elevatesde/shared-types';
import { AuthLayout } from '@/components/AuthLayout';
import { useAuthStore } from '@/store/auth.store';
import { useToastStore } from '@/store/toast.store';
import { acceptInvite, previewInvite } from '@/lib/org-api';

interface AxiosErrorResponse {
  response?: { data?: { message?: string } };
}

function InviteNotFound() {
  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-xl font-semibold text-(--color-text-primary)">Invitation not found</h2>
      <p className="text-sm text-(--color-text-muted)">
        This invite link is invalid or has been removed.
      </p>
      <Link href="/login" className="text-sm text-(--color-accent) font-medium hover:underline">
        Go to sign in
      </Link>
    </div>
  );
}

function InactiveNotice() {
  return (
    <div className="rounded-lg border border-(--color-border-subtle) bg-(--color-badge-bg) p-4 text-sm text-(--color-text-muted)">
      This invitation is no longer active. Ask your organization admin for a new link.
    </div>
  );
}

interface AcceptBlockProps {
  email: string;
  accepting: boolean;
  onAccept: () => void;
}

function AcceptBlock({ email, accepting, onAccept }: Readonly<AcceptBlockProps>) {
  return (
    <div className="flex flex-col gap-3">
      <Button onClick={onAccept} disabled={accepting} className="w-full">
        <span className="inline-flex items-center gap-2">
          <MailCheck className="h-4 w-4" />
          {accepting ? 'Joining…' : 'Accept & join'}
        </span>
      </Button>
      <p className="text-xs text-(--color-text-muted) mb-0">
        Make sure you are signed in as {email} to accept.
      </p>
    </div>
  );
}

interface SignInBlockProps {
  loginHref: string;
  onRegister: () => void;
}

function SignInBlock({ loginHref, onRegister }: Readonly<SignInBlockProps>) {
  return (
    <div className="flex flex-col gap-3">
      <Button className="w-full" onClick={onRegister}>
        Create an account to join
      </Button>
      <Link
        href={loginHref}
        className="text-center text-sm text-(--color-accent) font-medium hover:underline"
      >
        Already have an account? Sign in
      </Link>
    </div>
  );
}

interface InviteDetailsProps {
  preview: InvitePreviewDto;
  isAuthenticated: boolean;
  accepting: boolean;
  loginHref: string;
  onAccept: () => void;
  onRegister: () => void;
}

function InviteActions({
  preview,
  isAuthenticated,
  accepting,
  loginHref,
  onAccept,
  onRegister,
}: Readonly<InviteDetailsProps>) {
  if (preview.valid && isAuthenticated) {
    return <AcceptBlock email={preview.email} accepting={accepting} onAccept={onAccept} />;
  }
  if (preview.valid) {
    return <SignInBlock loginHref={loginHref} onRegister={onRegister} />;
  }
  return <InactiveNotice />;
}

function InviteDetails(props: Readonly<InviteDetailsProps>) {
  const { preview } = props;
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-(--color-border-subtle) bg-(--color-badge-bg) text-(--color-accent)">
          <Building2 className="h-5 w-5" />
        </span>
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.12em] text-(--color-accent)">
            Team invitation
          </div>
          <h2 className="text-xl font-semibold text-(--color-text-primary)">
            Join {preview.tenantName}
          </h2>
        </div>
      </div>

      <p className="text-sm text-(--color-text-muted) mb-0">
        This invitation was sent to{' '}
        <span className="font-medium text-(--color-text-primary)">{preview.email}</span>.
      </p>

      <InviteActions {...props} />
    </div>
  );
}

export default function InviteAcceptPage() {
  const params = useParams<{ token: string }>();
  const token = Array.isArray(params.token) ? params.token[0] : params.token;
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const addToast = useToastStore((state) => state.addToast);

  const [preview, setPreview] = React.useState<InvitePreviewDto | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [accepting, setAccepting] = React.useState(false);

  React.useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    let active = true;
    previewInvite(token)
      .then((result) => {
        if (active) setPreview(result);
      })
      .catch(() => undefined)
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [token]);

  const invitePath = `/invite/${token ?? ''}`;
  const loginHref = `/login?redirect=${encodeURIComponent(invitePath)}`;
  const registerHref = `/register?redirect=${encodeURIComponent(invitePath)}`;

  const handleAccept = async () => {
    if (!token || accepting) return;
    setAccepting(true);
    try {
      await acceptInvite(token);
      addToast('You have joined the organization.', 'success');
      router.push('/dashboard');
    } catch (err) {
      const message =
        (err as AxiosErrorResponse).response?.data?.message ?? 'Could not accept this invitation.';
      addToast(message, 'error');
      setAccepting(false);
    }
  };

  const renderBody = () => {
    if (loading) {
      return <p className="text-sm text-(--color-text-muted)">Loading invitation…</p>;
    }
    if (preview) {
      return (
        <InviteDetails
          preview={preview}
          isAuthenticated={isAuthenticated}
          accepting={accepting}
          loginHref={loginHref}
          onAccept={handleAccept}
          onRegister={() => router.push(registerHref)}
        />
      );
    }
    return <InviteNotFound />;
  };

  return (
    <AuthLayout>
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="w-full"
      >
        {renderBody()}
      </motion.div>
    </AuthLayout>
  );
}
