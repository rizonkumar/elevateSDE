'use client';

import * as React from 'react';
import { UserMinus, UserPlus, Users } from 'lucide-react';
import { Badge, Button, ConfirmDialog, Select } from '@elevatesde/ui';
import type {
  StudyGroupMemberDto,
  StudyGroupRole,
  StudyGroupViewerDto,
} from '@elevatesde/shared-types';
import { AuthorAvatar } from '@/components/dashboard/AuthorAvatar';
import { ProfileNameLink } from '@/components/public-profile/ProfileNameLink';
import { formatShortDate } from '@/lib/study-group-labels';
import { EmptyState } from './EmptyState';

const ROLE_OPTIONS: { value: StudyGroupRole; label: string }[] = [
  { value: 'OWNER', label: 'Owner' },
  { value: 'MEMBER', label: 'Member' },
];

interface GroupMembersProps {
  members: StudyGroupMemberDto[];
  viewer: StudyGroupViewerDto;
  saving: boolean;
  onAdd: () => void;
  onChangeRole: (member: StudyGroupMemberDto, role: StudyGroupRole) => void;
  onRemove: (member: StudyGroupMemberDto) => Promise<boolean>;
}

function canRemove(viewer: StudyGroupViewerDto, member: StudyGroupMemberDto): boolean {
  if (member.isViewer || !viewer.canManageMembers) {
    return false;
  }
  return member.role !== 'OWNER' || viewer.isTenantAdmin;
}

export function GroupMembers({
  members,
  viewer,
  saving,
  onAdd,
  onChangeRole,
  onRemove,
}: Readonly<GroupMembersProps>) {
  const [removing, setRemoving] = React.useState<StudyGroupMemberDto | null>(null);
  const ownerCount = members.filter((member) => member.role === 'OWNER').length;

  const confirmRemove = async () => {
    if (!removing) {
      return;
    }
    const removed = await onRemove(removing);
    if (removed) {
      setRemoving(null);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="m-0 text-sm text-(--color-text-muted)">
          {members.length} {members.length === 1 ? 'member' : 'members'} · {ownerCount}{' '}
          {ownerCount === 1 ? 'owner' : 'owners'}
        </p>
        {viewer.canManageMembers && (
          <Button type="button" variant="secondary" onClick={onAdd}>
            <UserPlus className="h-4 w-4" />
            Add members
          </Button>
        )}
      </div>

      {members.length === 0 ? (
        <EmptyState
          compact
          icon={Users}
          title="No members yet"
          description="Add people from your organization to start tracking progress together."
        />
      ) : (
        <ul className="m-0 flex list-none flex-col divide-y divide-(--color-border-subtle) rounded-md border border-(--color-border-subtle) bg-(--color-surface) p-0 shadow-(--shadow-card)">
          {members.map((member) => (
            <li
              key={member.userId}
              className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex min-w-0 items-center gap-3">
                <AuthorAvatar name={member.displayName} />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <ProfileNameLink
                      name={member.displayName}
                      publicHandle={member.publicHandle}
                      className="truncate text-sm font-medium text-(--color-text-primary)"
                    />
                    {member.isViewer && <Badge variant="neutral">You</Badge>}
                    {!viewer.canAssignRoles && member.role === 'OWNER' && (
                      <Badge variant="accent">Owner</Badge>
                    )}
                  </div>
                  <div className="truncate text-xs text-(--color-text-muted)">
                    {member.headline ? `${member.headline} · ` : ''}Joined{' '}
                    {formatShortDate(member.joinedAt)}
                  </div>
                </div>
              </div>
              {(viewer.canAssignRoles || canRemove(viewer, member)) && (
                <div className="flex items-center gap-2 pl-12 sm:pl-0">
                  {viewer.canAssignRoles && (
                    <div className="w-32">
                      <Select
                        value={member.role}
                        options={ROLE_OPTIONS}
                        disabled={saving}
                        onChange={(value) => {
                          if (value !== member.role) {
                            onChangeRole(member, value as StudyGroupRole);
                          }
                        }}
                      />
                    </div>
                  )}
                  {canRemove(viewer, member) ? (
                    <Button
                      type="button"
                      variant="tertiary"
                      className="px-2.5 text-(--color-text-muted)"
                      aria-label={`Remove ${member.displayName}`}
                      title="Remove from group"
                      onClick={() => setRemoving(member)}
                    >
                      <UserMinus className="h-4 w-4" />
                    </Button>
                  ) : (
                    viewer.canManageMembers && <span aria-hidden="true" className="w-9" />
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={removing !== null}
        title="Remove member?"
        description={
          removing
            ? `${removing.displayName} will leave the group. Their progress stays on their own profile.`
            : undefined
        }
        confirmLabel="Remove"
        tone="danger"
        loading={saving}
        onConfirm={() => void confirmRemove()}
        onClose={() => setRemoving(null)}
      />
    </div>
  );
}
