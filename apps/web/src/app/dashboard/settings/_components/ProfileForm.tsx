'use client';

import * as React from 'react';
import { Check, X } from 'lucide-react';
import { Button, Input, Textarea, Toggle } from '@elevatesde/ui';
import type { UserDto } from '@elevatesde/shared-types';
import { useSettingsStore } from '@/store/settings.store';

interface ProfileFormProps {
  profile: UserDto;
}

const HANDLE_DEBOUNCE_MS = 400;

export function ProfileForm({ profile }: Readonly<ProfileFormProps>) {
  const isSaving = useSettingsStore((state) => state.isSaving);
  const handleStatus = useSettingsStore((state) => state.handleStatus);
  const checkHandle = useSettingsStore((state) => state.checkHandle);
  const resetHandleStatus = useSettingsStore((state) => state.resetHandleStatus);
  const saveProfile = useSettingsStore((state) => state.saveProfile);

  const [handle, setHandle] = React.useState(profile.handle);
  const [firstName, setFirstName] = React.useState(profile.firstName ?? '');
  const [lastName, setLastName] = React.useState(profile.lastName ?? '');
  const [headline, setHeadline] = React.useState(profile.headline ?? '');
  const [bio, setBio] = React.useState(profile.bio ?? '');
  const [githubUrl, setGithubUrl] = React.useState(profile.githubUrl ?? '');
  const [linkedinUrl, setLinkedinUrl] = React.useState(profile.linkedinUrl ?? '');
  const [websiteUrl, setWebsiteUrl] = React.useState(profile.websiteUrl ?? '');
  const [isProfilePublic, setIsProfilePublic] = React.useState(profile.isProfilePublic);

  React.useEffect(() => {
    if (handle === profile.handle) {
      resetHandleStatus();
      return;
    }
    const timer = setTimeout(() => {
      void checkHandle(handle);
    }, HANDLE_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [handle, profile.handle, checkHandle, resetHandleStatus]);

  const handleInvalid = handle.length > 0 && !/^[a-z0-9](?:[a-z0-9-]{1,28}[a-z0-9])$/.test(handle);
  const canSubmit = !isSaving && !handleInvalid && handleStatus !== 'taken';

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void saveProfile({
      handle,
      firstName: firstName || undefined,
      lastName: lastName || undefined,
      headline: headline || undefined,
      bio: bio || undefined,
      githubUrl: githubUrl || undefined,
      linkedinUrl: linkedinUrl || undefined,
      websiteUrl: websiteUrl || undefined,
      isProfilePublic,
    });
  };

  return (
    <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
      <div>
        <Input
          label="Handle"
          value={handle}
          onChange={(event) => setHandle(event.target.value.toLowerCase())}
          maxLength={30}
          error={handleInvalid ? 'Use 3-30 lowercase letters, numbers and single hyphens.' : undefined}
        />
        {!handleInvalid && handle !== profile.handle && handleStatus !== 'idle' && (
          <p
            className={`mt-1.5 flex items-center gap-1 text-xs ${
              handleStatus === 'available' ? 'text-(--color-success)' : 'text-(--color-danger)'
            }`}
          >
            {handleStatus === 'checking' && 'Checking availability…'}
            {handleStatus === 'available' && (
              <>
                <Check className="h-3.5 w-3.5" /> Available
              </>
            )}
            {handleStatus === 'taken' && (
              <>
                <X className="h-3.5 w-3.5" /> Already taken
              </>
            )}
          </p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="First name"
          value={firstName}
          onChange={(event) => setFirstName(event.target.value)}
          maxLength={60}
        />
        <Input
          label="Last name"
          value={lastName}
          onChange={(event) => setLastName(event.target.value)}
          maxLength={60}
        />
      </div>

      <Input
        label="Headline"
        placeholder="e.g. Staff Engineer at Acme"
        value={headline}
        onChange={(event) => setHeadline(event.target.value)}
        maxLength={120}
      />

      <Textarea
        label="Bio"
        placeholder="A short description for your public profile."
        value={bio}
        onChange={(event) => setBio(event.target.value)}
        maxLength={280}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Input
          label="GitHub"
          placeholder="https://github.com/you"
          value={githubUrl}
          onChange={(event) => setGithubUrl(event.target.value)}
        />
        <Input
          label="LinkedIn"
          placeholder="https://linkedin.com/in/you"
          value={linkedinUrl}
          onChange={(event) => setLinkedinUrl(event.target.value)}
        />
        <Input
          label="Website"
          placeholder="https://you.dev"
          value={websiteUrl}
          onChange={(event) => setWebsiteUrl(event.target.value)}
        />
      </div>

      <label className="flex items-center justify-between gap-3 rounded-md border border-(--color-border-subtle) bg-(--color-bg-soft) p-4">
        <span>
          <span className="block text-sm font-medium text-(--color-text-primary)">
            Public profile
          </span>
          <span className="mt-0.5 block text-xs text-(--color-text-muted)">
            Let anyone view your stats, badges and public lists at /u/{handle || profile.handle}.
          </span>
        </span>
        <Toggle
          checked={isProfilePublic}
          onChange={setIsProfilePublic}
          label="Toggle public profile"
        />
      </label>

      <div className="flex justify-end">
        <Button type="submit" disabled={!canSubmit}>
          {isSaving ? 'Saving…' : 'Save changes'}
        </Button>
      </div>
    </form>
  );
}
