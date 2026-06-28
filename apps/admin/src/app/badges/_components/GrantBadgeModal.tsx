'use client';

import * as React from 'react';
import { Button, Modal } from '@elevatesde/ui';
import type { AdminBadgeDto, UserDto } from '@elevatesde/shared-types';
import { Select } from '../../../components/ui';
import { useBadgesStore } from '../../../store/badges.store';

function userLabel(user: UserDto): string {
  const name = [user.firstName, user.lastName].filter((part) => part && part.trim()).join(' ');
  return name.length > 0 ? `${name} · ${user.email}` : user.email;
}

function badgeLabel(badge: AdminBadgeDto): string {
  return `${badge.name} (${badge.key})`;
}

export function GrantBadgeModal() {
  const isGrantOpen = useBadgesStore((state) => state.isGrantOpen);
  const granting = useBadgesStore((state) => state.granting);
  const users = useBadgesStore((state) => state.users);
  const badges = useBadgesStore((state) => state.badges);
  const closeGrant = useBadgesStore((state) => state.closeGrant);
  const grant = useBadgesStore((state) => state.grant);
  const revoke = useBadgesStore((state) => state.revoke);

  const [userId, setUserId] = React.useState('');
  const [badgeId, setBadgeId] = React.useState('');

  React.useEffect(() => {
    if (!isGrantOpen) {
      return;
    }
    setUserId('');
    setBadgeId('');
  }, [isGrantOpen]);

  const userOptions = users.map((user) => ({ value: user.id, label: userLabel(user) }));
  const badgeOptions = badges.map((badge) => ({ value: badge.id, label: badgeLabel(badge) }));
  const canSubmit = userId !== '' && badgeId !== '' && !granting;

  return (
    <Modal
      open={isGrantOpen}
      onClose={closeGrant}
      title="Grant or revoke a badge"
      description="Manually award a badge to a candidate or remove one they already hold."
    >
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <span className="text-[13px] font-medium text-(--color-text-primary) select-none">
            Candidate
          </span>
          <Select value={userId} options={userOptions} onChange={setUserId} />
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-[13px] font-medium text-(--color-text-primary) select-none">
            Badge
          </span>
          <Select value={badgeId} options={badgeOptions} onChange={setBadgeId} />
        </div>

        <div className="flex items-center justify-end gap-2 pt-1">
          <Button
            type="button"
            variant="secondary"
            onClick={() => revoke(userId, badgeId)}
            disabled={!canSubmit}
          >
            Revoke
          </Button>
          <Button type="button" onClick={() => grant(userId, badgeId)} disabled={!canSubmit}>
            {granting ? 'Saving…' : 'Grant'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
