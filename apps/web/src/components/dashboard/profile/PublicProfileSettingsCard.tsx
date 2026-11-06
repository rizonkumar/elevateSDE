'use client';

import * as React from 'react';
import Link from 'next/link';
import { AlertTriangle, CheckCircle2, ExternalLink, Globe, Loader2, XCircle } from 'lucide-react';
import { Badge, Button, Input, Textarea } from '@elevatesde/ui';
import type {
  HandleAvailabilityDto,
  PublicProfileSettingsDto,
  UpdatePublicProfileRequest,
} from '@elevatesde/shared-types';
import { SwitchField } from '@/components/dashboard/SwitchField';
import { GitHubIcon, LinkedInIcon } from '@/components/public-profile/BrandIcons';
import { CopyProfileLinkButton } from '@/components/public-profile/CopyProfileLinkButton';
import { publicProfilePath } from '@/components/public-profile/ProfileNameLink';
import { checkHandleAvailability } from '@/lib/public-profile-api';
import { usePublicProfileSettingsStore } from '@/store/public-profile-settings.store';

const HANDLE_PATTERN = /^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$/;
const BIO_MAX_LENGTH = 280;
const AVAILABILITY_DEBOUNCE_MS = 400;

const cardClass =
  'rounded-md border border-(--color-border-subtle) bg-(--color-surface) p-5 shadow-(--shadow-card) sm:p-6';

interface FormState {
  handle: string;
  bio: string;
  location: string;
  githubUrl: string;
  linkedinUrl: string;
  websiteUrl: string;
  isPublic: boolean;
  showOrganization: boolean;
}

type HandleStatus =
  | { kind: 'idle' }
  | { kind: 'checking' }
  | { kind: 'result'; availability: HandleAvailabilityDto }
  | { kind: 'error' };

function toForm(settings: PublicProfileSettingsDto): FormState {
  return {
    handle: settings.handle ?? '',
    bio: settings.bio ?? '',
    location: settings.location ?? '',
    githubUrl: settings.githubUrl ?? '',
    linkedinUrl: settings.linkedinUrl ?? '',
    websiteUrl: settings.websiteUrl ?? '',
    isPublic: settings.profileVisibility === 'PUBLIC',
    showOrganization: settings.showOrganization,
  };
}

function nullable(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function buildRequest(form: FormState): UpdatePublicProfileRequest {
  return {
    handle: nullable(form.handle.toLowerCase()),
    bio: nullable(form.bio),
    location: nullable(form.location),
    githubUrl: nullable(form.githubUrl),
    linkedinUrl: nullable(form.linkedinUrl),
    websiteUrl: nullable(form.websiteUrl),
    profileVisibility: form.isPublic ? 'PUBLIC' : 'PRIVATE',
    showOrganization: form.showOrganization,
  };
}

function sameForm(left: FormState, right: FormState): boolean {
  return (Object.keys(left) as (keyof FormState)[]).every((key) => left[key] === right[key]);
}

function localHandleProblem(handle: string): string | null {
  if (handle.length === 0) {
    return null;
  }
  if (!HANDLE_PATTERN.test(handle) || handle.includes('--')) {
    return 'Use 3–30 lowercase letters, numbers or single hyphens. No hyphen at the start or end.';
  }
  return null;
}

function availabilityMessage(availability: HandleAvailabilityDto): string {
  if (availability.available) {
    return `@${availability.handle} is available.`;
  }
  if (availability.reason === 'TAKEN') {
    return `@${availability.handle} is already taken.`;
  }
  if (availability.reason === 'RESERVED') {
    return `@${availability.handle} is reserved.`;
  }
  return 'This handle is not valid.';
}

function HandleHint({
  problem,
  status,
  unchanged,
}: Readonly<{
  problem: string | null;
  status: HandleStatus;
  unchanged: boolean;
}>) {
  if (problem) {
    return (
      <p className="m-0 flex items-start gap-1.5 text-xs text-(--color-danger)">
        <XCircle className="mt-px h-3.5 w-3.5 shrink-0" />
        {problem}
      </p>
    );
  }
  if (unchanged) {
    return (
      <p className="m-0 text-xs text-(--color-text-muted)">
        Your profile lives at /u/your-handle. Changing it breaks old links.
      </p>
    );
  }
  if (status.kind === 'checking') {
    return (
      <p className="m-0 flex items-center gap-1.5 text-xs text-(--color-text-muted)">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        Checking availability…
      </p>
    );
  }
  if (status.kind === 'error') {
    return (
      <p className="m-0 text-xs text-(--color-text-muted)">
        Could not check availability right now.
      </p>
    );
  }
  if (status.kind === 'result') {
    const { availability } = status;
    const Icon = availability.available ? CheckCircle2 : XCircle;
    return (
      <p
        className={`m-0 flex items-center gap-1.5 text-xs ${
          availability.available ? 'text-(--color-success)' : 'text-(--color-danger)'
        }`}
      >
        <Icon className="h-3.5 w-3.5 shrink-0" />
        {availabilityMessage(availability)}
      </p>
    );
  }
  return null;
}

function useHandleAvailability(handle: string, savedHandle: string, problem: string | null) {
  const [status, setStatus] = React.useState<HandleStatus>({ kind: 'idle' });

  React.useEffect(() => {
    if (handle.length === 0 || handle === savedHandle || problem) {
      setStatus({ kind: 'idle' });
      return;
    }
    let cancelled = false;
    setStatus({ kind: 'checking' });
    const timer = window.setTimeout(() => {
      checkHandleAvailability(handle)
        .then((availability) => {
          if (!cancelled) {
            setStatus({ kind: 'result', availability });
          }
        })
        .catch(() => {
          if (!cancelled) {
            setStatus({ kind: 'error' });
          }
        });
    }, AVAILABILITY_DEBOUNCE_MS);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [handle, savedHandle, problem]);

  return status;
}

function SettingsSkeleton() {
  return (
    <div className={cardClass}>
      <div className="flex animate-pulse flex-col gap-4">
        <div className="h-4 w-40 rounded-(--radius-sm) bg-(--color-badge-bg)" />
        <div className="h-10 w-full rounded-(--radius-sm) bg-(--color-badge-bg)" />
        <div className="h-20 w-full rounded-(--radius-sm) bg-(--color-badge-bg)" />
      </div>
    </div>
  );
}

function SettingsForm({ settings }: Readonly<{ settings: PublicProfileSettingsDto }>) {
  const save = usePublicProfileSettingsStore((state) => state.save);
  const isSaving = usePublicProfileSettingsStore((state) => state.isSaving);
  const saved = React.useMemo(() => toForm(settings), [settings]);
  const [form, setForm] = React.useState<FormState>(saved);
  const handleInputId = React.useId();

  React.useEffect(() => {
    setForm(saved);
  }, [saved]);

  const normalizedHandle = form.handle.trim().toLowerCase();
  const handleProblem = localHandleProblem(normalizedHandle);
  const handleStatus = useHandleAvailability(normalizedHandle, saved.handle, handleProblem);
  const handleBlocked =
    handleProblem !== null ||
    handleStatus.kind === 'checking' ||
    (handleStatus.kind === 'result' && !handleStatus.availability.available);
  const needsHandle = form.isPublic && normalizedHandle.length === 0;
  const isDirty = !sameForm(form, saved);
  const canSave = isDirty && !handleBlocked && !needsHandle && !isSaving;
  const orgBlocks = !settings.organizationAllowsPublicProfiles;

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (canSave) {
      void save(buildRequest({ ...form, handle: normalizedHandle }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className={cardClass} noValidate>
      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="m-0 font-display text-sm font-semibold uppercase tracking-wider text-(--color-text-muted)">
              Public profile
            </h3>
            <Badge variant={settings.isPublic ? 'success' : 'neutral'}>
              {settings.isPublic ? 'Public' : 'Private'}
            </Badge>
          </div>
          <p className="mt-1.5 mb-0 text-sm text-(--color-text-muted)">
            Share a portfolio page with your solved stats, heatmap, badges and contest results. Your
            email, notes and job tracker are never shown.
          </p>
        </div>
      </div>

      {orgBlocks && (
        <div className="mt-4 flex items-start gap-2.5 rounded-md border border-(--color-warning)/30 bg-(--color-warning-soft) p-3 text-sm text-(--color-warning)">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            {settings.organizationName ?? 'Your organization'} has turned off public profiles. Your
            page stays hidden until an admin allows them again.
          </span>
        </div>
      )}

      <div className="mt-5 flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <label
            htmlFor={handleInputId}
            className="text-[13px] font-medium text-(--color-text-primary)"
          >
            Handle
          </label>
          <div
            className={`flex h-10 w-full items-center overflow-hidden rounded-(--radius-sm) border bg-(--color-bg) transition-all focus-within:border-(--color-accent) focus-within:shadow-[0_0_0_2px_var(--color-bg),0_0_0_4px_var(--color-accent)] ${
              handleProblem ? 'border-(--color-danger)' : 'border-(--color-border)'
            }`}
          >
            <span className="flex h-full items-center border-r border-(--color-border-subtle) bg-(--color-bg-soft) px-3 font-mono text-sm text-(--color-text-muted)">
              /u/
            </span>
            <input
              id={handleInputId}
              value={form.handle}
              onChange={(event) => update('handle', event.target.value)}
              placeholder="your-handle"
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
              maxLength={30}
              className="h-full min-w-0 flex-1 bg-transparent px-3 font-mono text-sm text-(--color-text-primary) placeholder-(--color-text-disabled) focus:outline-none"
            />
          </div>
          <HandleHint
            problem={handleProblem}
            status={handleStatus}
            unchanged={normalizedHandle === saved.handle}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Textarea
            label="Bio"
            value={form.bio}
            onChange={(event) => update('bio', event.target.value)}
            maxLength={BIO_MAX_LENGTH}
            rows={3}
            placeholder="What you are working on and what roles you are preparing for."
          />
          <span className="self-end text-[11px] tabular-nums text-(--color-text-disabled)">
            {form.bio.length}/{BIO_MAX_LENGTH}
          </span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Location"
            aria-label="Location"
            value={form.location}
            onChange={(event) => update('location', event.target.value)}
            maxLength={80}
            placeholder="City, Country"
          />
          <Input
            label="Website"
            aria-label="Website"
            type="url"
            inputMode="url"
            value={form.websiteUrl}
            onChange={(event) => update('websiteUrl', event.target.value)}
            placeholder="https://your-site.dev"
            icon={<Globe className="h-4 w-4" />}
          />
          <Input
            label="GitHub"
            aria-label="GitHub"
            type="url"
            inputMode="url"
            value={form.githubUrl}
            onChange={(event) => update('githubUrl', event.target.value)}
            placeholder="https://github.com/username"
            icon={<GitHubIcon className="h-4 w-4" />}
          />
          <Input
            label="LinkedIn"
            aria-label="LinkedIn"
            type="url"
            inputMode="url"
            value={form.linkedinUrl}
            onChange={(event) => update('linkedinUrl', event.target.value)}
            placeholder="https://www.linkedin.com/in/username"
            icon={<LinkedInIcon className="h-4 w-4" />}
          />
        </div>

        <div className="flex flex-col gap-4 rounded-md border border-(--color-border-subtle) bg-(--color-bg-soft) p-4">
          <SwitchField
            label="Make my profile public"
            description={
              needsHandle
                ? 'Claim a handle above to publish your profile.'
                : 'Anyone with the link can view it. Search engines may index it.'
            }
            checked={form.isPublic}
            onChange={(value) => update('isPublic', value)}
          />
          {settings.organizationName && (
            <SwitchField
              label="Show my organization"
              description={`Display ${settings.organizationName} on your public profile.`}
              checked={form.showOrganization}
              onChange={(value) => update('showOrganization', value)}
            />
          )}
        </div>
      </div>

      <div className="mt-6 flex flex-col-reverse gap-3 border-t border-(--color-border-subtle) pt-5 sm:flex-row sm:items-center sm:justify-between">
        {settings.isPublic && settings.handle ? (
          <div className="flex flex-wrap items-center gap-2">
            <CopyProfileLinkButton path={publicProfilePath(settings.handle)} />
            <Link
              href={publicProfilePath(settings.handle)}
              target="_blank"
              className="inline-flex h-9 items-center gap-1.5 rounded-(--radius-sm) px-3 text-sm font-medium text-(--color-accent) transition-colors hover:bg-(--color-accent-soft)"
            >
              View profile
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </div>
        ) : (
          <span className="text-xs text-(--color-text-muted)">
            Your profile is private. Only you can see your stats.
          </span>
        )}
        <div className="flex items-center gap-2 sm:justify-end">
          {isDirty && (
            <Button
              type="button"
              variant="tertiary"
              onClick={() => setForm(saved)}
              disabled={isSaving}
            >
              Discard
            </Button>
          )}
          <Button type="submit" disabled={!canSave} className="w-full sm:w-auto">
            {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
            Save changes
          </Button>
        </div>
      </div>
    </form>
  );
}

export function PublicProfileSettingsCard() {
  const settings = usePublicProfileSettingsStore((state) => state.settings);
  const hasLoaded = usePublicProfileSettingsStore((state) => state.hasLoaded);
  const load = usePublicProfileSettingsStore((state) => state.load);

  React.useEffect(() => {
    void load();
  }, [load]);

  if (!settings) {
    return hasLoaded ? null : <SettingsSkeleton />;
  }
  return <SettingsForm settings={settings} />;
}
