'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Archive, ArrowLeft, Lock, LogOut, Pencil, Plus, Target, Users } from 'lucide-react';
import { Badge, Button, ConfirmDialog, Tabs, type TabItem } from '@elevatesde/ui';
import {
  STUDY_GROUP_LIMITS,
  type StudyGroupDetailDto,
  type StudyGroupGoalDto,
  type StudyGroupGoalInput,
} from '@elevatesde/shared-types';
import { PageContainer } from '@/components/dashboard/PageContainer';
import { useRealtimeEvent, useRealtimeRoom } from '@/hooks/use-realtime';
import { formatShortDate } from '@/lib/study-group-labels';
import { useStudyGroupsStore } from '@/store/study-groups.store';
import { AddMembersModal } from '../_components/AddMembersModal';
import { EmptyState } from '../_components/EmptyState';
import { GoalCard } from '../_components/GoalCard';
import { GoalFormModal } from '../_components/GoalFormModal';
import { GroupActivityFeed } from '../_components/GroupActivityFeed';
import { GroupFormModal, type GroupFormValues } from '../_components/GroupFormModal';
import { GroupLeaderboard } from '../_components/GroupLeaderboard';
import { GroupMembers } from '../_components/GroupMembers';
import { GroupMonogram } from '../_components/GroupMonogram';

type DetailTab = 'overview' | 'leaderboard' | 'members' | 'activity';

type PendingConfirm = 'leave' | 'archive' | null;

function DetailSkeleton() {
  return (
    <div className="flex animate-pulse flex-col gap-6" aria-label="Loading study group">
      <div className="h-36 rounded-md bg-(--color-badge-bg)" />
      <div className="h-10 w-72 max-w-full rounded-md bg-(--color-badge-bg)" />
      <div className="grid items-start gap-5 md:grid-cols-2">
        <div className="h-52 rounded-md bg-(--color-badge-bg)" />
        <div className="h-52 rounded-md bg-(--color-badge-bg)" />
      </div>
    </div>
  );
}

function BackLink() {
  return (
    <Link
      href="/dashboard/groups"
      className="inline-flex w-fit items-center gap-1.5 text-sm text-(--color-text-muted) transition-colors hover:text-(--color-text-primary)"
    >
      <ArrowLeft className="h-4 w-4" />
      All groups
    </Link>
  );
}

interface GroupHeaderProps {
  group: StudyGroupDetailDto;
  busy: boolean;
  onJoin: () => void;
  onEdit: () => void;
  onLeave: () => void;
  onArchive: () => void;
}

function GroupHeader({ group, busy, onJoin, onEdit, onLeave, onArchive }: Readonly<GroupHeaderProps>) {
  const { viewer } = group;
  return (
    <section className="flex flex-col gap-5 rounded-md border border-(--color-border-subtle) bg-(--color-surface) p-5 shadow-(--shadow-card) sm:p-6 lg:flex-row lg:items-start lg:justify-between">
      <div className="flex min-w-0 items-start gap-4">
        <GroupMonogram name={group.name} size="lg" />
        <div className="min-w-0">
          <h1 className="m-0 break-words font-display text-2xl font-semibold tracking-tight sm:text-3xl">
            {group.name}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {viewer.role === 'OWNER' && <Badge variant="accent">Owner</Badge>}
            {viewer.role === 'MEMBER' && <Badge variant="neutral">Member</Badge>}
            {group.joinPolicy === 'INVITE_ONLY' ? (
              <Badge variant="neutral">
                <Lock className="h-3 w-3" />
                Invite only
              </Badge>
            ) : (
              <Badge variant="success">Open</Badge>
            )}
          </div>
          {group.description && (
            <p className="mb-0 mt-3 max-w-2xl text-sm text-(--color-text-muted)">
              {group.description}
            </p>
          )}
          <p className="mb-0 mt-3 text-xs text-(--color-text-muted)">
            {group.memberCount} {group.memberCount === 1 ? 'member' : 'members'} · Created{' '}
            {formatShortDate(group.createdAt)}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2 lg:shrink-0 lg:justify-end">
        {viewer.canJoin && (
          <Button type="button" onClick={onJoin} disabled={busy}>
            <Plus className="h-4 w-4" />
            Join group
          </Button>
        )}
        {viewer.canEdit && (
          <Button type="button" variant="secondary" onClick={onEdit}>
            <Pencil className="h-4 w-4" />
            Edit
          </Button>
        )}
        {viewer.canLeave && (
          <Button type="button" variant="secondary" onClick={onLeave}>
            <LogOut className="h-4 w-4" />
            Leave
          </Button>
        )}
        {viewer.canArchive && (
          <Button
            type="button"
            variant="tertiary"
            className="text-(--color-danger)"
            onClick={onArchive}
          >
            <Archive className="h-4 w-4" />
            Archive
          </Button>
        )}
      </div>
    </section>
  );
}

interface OverviewProps {
  group: StudyGroupDetailDto;
  onAdd: () => void;
  onEdit: (goal: StudyGroupGoalDto) => void;
  onDelete: (goal: StudyGroupGoalDto) => void;
}

function Overview({ group, onAdd, onEdit, onDelete }: Readonly<OverviewProps>) {
  const canManage = group.viewer.canManageGoals;
  const openGoals = group.goals.filter(
    (goal) => goal.status === 'ACTIVE' || goal.status === 'UPCOMING',
  );
  const finishedGoals = group.goals.filter(
    (goal) => goal.status === 'COMPLETED' || goal.status === 'ENDED',
  );
  const atLimit = openGoals.length >= STUDY_GROUP_LIMITS.maxActiveGoals;

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="m-0 font-display text-sm font-semibold uppercase tracking-wider text-(--color-text-muted)">
            Goals
          </h2>
          {canManage && (
            <Button
              type="button"
              variant="secondary"
              onClick={onAdd}
              disabled={atLimit}
              title={atLimit ? `Up to ${STUDY_GROUP_LIMITS.maxActiveGoals} active goals` : undefined}
            >
              <Plus className="h-4 w-4" />
              Add goal
            </Button>
          )}
        </div>
        {openGoals.length === 0 ? (
          <EmptyState
            compact
            icon={Target}
            title="No active goals"
            description={
              canManage
                ? 'Set a shared target, such as 200 problems this month, to give the group something to aim for.'
                : 'When an owner sets a goal, the group progress will show up here.'
            }
            action={
              canManage ? (
                <Button type="button" onClick={onAdd}>
                  <Plus className="h-4 w-4" />
                  Add the first goal
                </Button>
              ) : undefined
            }
          />
        ) : (
          <div className="grid items-start gap-5 md:grid-cols-2">
            {openGoals.map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                canManage={canManage}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </div>
        )}
      </section>

      {finishedGoals.length > 0 && (
        <section className="flex flex-col gap-4">
          <h2 className="m-0 font-display text-sm font-semibold uppercase tracking-wider text-(--color-text-muted)">
            Past goals
          </h2>
          <div className="grid items-start gap-5 md:grid-cols-2">
            {finishedGoals.map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                canManage={canManage}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export default function StudyGroupDetailPage() {
  const params = useParams<{ id: string }>();
  const groupId = params.id;
  const router = useRouter();

  const detail = useStudyGroupsStore((state) => state.detail);
  const detailState = useStudyGroupsStore((state) => state.detailState);
  const detailError = useStudyGroupsStore((state) => state.detailError);
  const leaderboard = useStudyGroupsStore((state) => state.leaderboard);
  const leaderboardWindow = useStudyGroupsStore((state) => state.leaderboardWindow);
  const isLeaderboardLoading = useStudyGroupsStore((state) => state.isLeaderboardLoading);
  const activity = useStudyGroupsStore((state) => state.activity);
  const isActivityLoading = useStudyGroupsStore((state) => state.isActivityLoading);
  const isMutating = useStudyGroupsStore((state) => state.isMutating);
  const store = useStudyGroupsStore.getState;
  const loadDetail = useStudyGroupsStore((state) => state.loadDetail);
  const loadLeaderboard = useStudyGroupsStore((state) => state.loadLeaderboard);
  const loadActivity = useStudyGroupsStore((state) => state.loadActivity);
  const pushActivity = useStudyGroupsStore((state) => state.pushActivity);
  const resetDetail = useStudyGroupsStore((state) => state.resetDetail);

  const [tab, setTab] = React.useState<DetailTab>('overview');
  const [editingGroup, setEditingGroup] = React.useState(false);
  const [goalModal, setGoalModal] = React.useState<{ goal: StudyGroupGoalDto | null } | null>(
    null,
  );
  const [deletingGoal, setDeletingGoal] = React.useState<StudyGroupGoalDto | null>(null);
  const [addingMembers, setAddingMembers] = React.useState(false);
  const [confirm, setConfirm] = React.useState<PendingConfirm>(null);

  React.useEffect(() => {
    resetDetail();
    void loadDetail(groupId);
    return () => resetDetail();
  }, [groupId, loadDetail, resetDetail]);

  React.useEffect(() => {
    if (tab === 'leaderboard') {
      void loadLeaderboard(groupId);
    }
    if (tab === 'activity') {
      void loadActivity(groupId);
    }
  }, [tab, groupId, loadLeaderboard, loadActivity]);

  const group = detail?.id === groupId ? detail : null;
  const isLive = useRealtimeRoom(group ? `group:${group.id}` : null);
  useRealtimeEvent('group:activity', (payload) => pushActivity(payload.groupId, payload.item));

  const groupFormInitial = React.useMemo<GroupFormValues | undefined>(
    () =>
      group
        ? {
            name: group.name,
            description: group.description ?? '',
            joinPolicy: group.joinPolicy,
          }
        : undefined,
    [group],
  );

  if (!group) {
    return (
      <PageContainer>
        <div className="flex flex-col gap-6">
          <BackLink />
          {detailState === 'error' ? (
            <EmptyState
              icon={Users}
              title="Group unavailable"
              description={
                detailError ??
                'This group does not exist, was archived, or is not visible to you.'
              }
              action={
                <Button type="button" variant="secondary" onClick={() => router.push('/dashboard/groups')}>
                  Back to groups
                </Button>
              }
            />
          ) : (
            <DetailSkeleton />
          )}
        </div>
      </PageContainer>
    );
  }

  const tabs: TabItem[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'leaderboard', label: 'Leaderboard' },
    { id: 'members', label: 'Members', count: group.memberCount },
    { id: 'activity', label: 'Activity' },
  ];

  const handleGroupSave = (values: GroupFormValues) =>
    store().update(group.id, {
      name: values.name,
      description: values.description.length > 0 ? values.description : null,
      joinPolicy: values.joinPolicy,
    });

  const handleGoalSave = (input: StudyGroupGoalInput) =>
    store().saveGoal(group.id, input, goalModal?.goal?.id);

  const handleConfirm = async () => {
    if (confirm === 'leave') {
      if (await store().leave(group.id)) {
        router.push('/dashboard/groups');
      }
    } else if (confirm === 'archive') {
      if (await store().archive(group.id)) {
        router.push('/dashboard/groups');
      }
    }
    setConfirm(null);
  };

  const handleDeleteGoal = async () => {
    if (deletingGoal && (await store().deleteGoal(group.id, deletingGoal.id))) {
      setDeletingGoal(null);
    }
  };

  return (
    <PageContainer>
      <div className="flex flex-col gap-6">
        <BackLink />
        <GroupHeader
          group={group}
          busy={isMutating}
          onJoin={() => void store().join(group.id)}
          onEdit={() => setEditingGroup(true)}
          onLeave={() => setConfirm('leave')}
          onArchive={() => setConfirm('archive')}
        />

        <div className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] sm:mx-0 sm:px-0">
          <Tabs items={tabs} value={tab} onChange={(id) => setTab(id as DetailTab)} />
        </div>

        {tab === 'overview' && (
          <Overview
            group={group}
            onAdd={() => setGoalModal({ goal: null })}
            onEdit={(goal) => setGoalModal({ goal })}
            onDelete={setDeletingGoal}
          />
        )}
        {tab === 'leaderboard' && (
          <GroupLeaderboard
            leaderboard={leaderboard}
            window={leaderboardWindow}
            loading={isLeaderboardLoading}
            onWindowChange={(window) => void loadLeaderboard(group.id, window)}
          />
        )}
        {tab === 'members' && (
          <GroupMembers
            members={group.members}
            viewer={group.viewer}
            saving={isMutating}
            onAdd={() => setAddingMembers(true)}
            onChangeRole={(member, role) => void store().changeRole(group.id, member.userId, role)}
            onRemove={(member) => store().removeMember(group.id, member.userId)}
          />
        )}
        {tab === 'activity' && (
          <GroupActivityFeed items={activity} loading={isActivityLoading} live={isLive} />
        )}
      </div>

      <GroupFormModal
        open={editingGroup}
        mode="edit"
        initial={groupFormInitial}
        saving={isMutating}
        onClose={() => setEditingGroup(false)}
        onSubmit={handleGroupSave}
      />
      <GoalFormModal
        open={goalModal !== null}
        goal={goalModal?.goal ?? null}
        saving={isMutating}
        onClose={() => setGoalModal(null)}
        onSubmit={handleGoalSave}
      />
      <AddMembersModal
        open={addingMembers}
        groupId={group.id}
        saving={isMutating}
        onClose={() => setAddingMembers(false)}
        onSubmit={(userIds) => store().addMembers(group.id, userIds)}
      />
      <ConfirmDialog
        open={deletingGoal !== null}
        title="Delete this goal?"
        description={
          deletingGoal
            ? `"${deletingGoal.title}" and its progress view will be removed. Member activity is not affected.`
            : undefined
        }
        confirmLabel="Delete goal"
        tone="danger"
        loading={isMutating}
        onConfirm={() => void handleDeleteGoal()}
        onClose={() => setDeletingGoal(null)}
      />
      <ConfirmDialog
        open={confirm !== null}
        title={confirm === 'archive' ? 'Archive this group?' : 'Leave this group?'}
        description={
          confirm === 'archive'
            ? 'The group, its goals and leaderboard will be hidden for everyone. Member activity is kept.'
            : group.joinPolicy === 'OPEN'
              ? 'You can join again at any time.'
              : 'An owner will need to add you back.'
        }
        confirmLabel={confirm === 'archive' ? 'Archive group' : 'Leave group'}
        tone="danger"
        loading={isMutating}
        onConfirm={() => void handleConfirm()}
        onClose={() => setConfirm(null)}
      />
    </PageContainer>
  );
}
