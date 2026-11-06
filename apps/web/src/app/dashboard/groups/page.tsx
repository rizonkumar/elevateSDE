'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Building2, Plus, UsersRound } from 'lucide-react';
import { Button } from '@elevatesde/ui';
import type { StudyGroupListDto, StudyGroupSummaryDto } from '@elevatesde/shared-types';
import { PageContainer } from '@/components/dashboard/PageContainer';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { useSessionTenantStatus } from '@/hooks/use-session-role';
import { useStudyGroupsStore } from '@/store/study-groups.store';
import { EmptyState } from './_components/EmptyState';
import { GroupCard } from './_components/GroupCard';
import { GroupFormModal, type GroupFormValues } from './_components/GroupFormModal';

function GroupGridSkeleton() {
  return (
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3" aria-label="Loading study groups">
      {[0, 1, 2].map((index) => (
        <div
          key={index}
          className="flex h-48 animate-pulse flex-col gap-4 rounded-md border border-(--color-border-subtle) bg-(--color-surface) p-6"
        >
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-(--radius-md) bg-(--color-badge-bg)" />
            <div className="h-4 w-1/2 rounded-(--radius-sm) bg-(--color-badge-bg)" />
          </div>
          <div className="h-3 w-full rounded-(--radius-sm) bg-(--color-badge-bg)" />
          <div className="h-3 w-2/3 rounded-(--radius-sm) bg-(--color-badge-bg)" />
        </div>
      ))}
    </div>
  );
}

interface SectionProps {
  title: string;
  count: number;
  children: React.ReactNode;
}

function Section({ title, count, children }: Readonly<SectionProps>) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-baseline gap-2">
        <h2 className="m-0 font-display text-sm font-semibold uppercase tracking-wider text-(--color-text-muted)">
          {title}
        </h2>
        <span className="text-xs text-(--color-text-muted)">{count}</span>
      </div>
      {children}
    </section>
  );
}

function NoOrganization() {
  return (
    <EmptyState
      icon={Building2}
      title="Study groups belong to organizations"
      description="Groups let teams and cohorts practice together with shared goals and a group leaderboard. Join your organization through an invite link to take part."
      action={
        <Link
          href="/dashboard/leaderboard"
          className="inline-flex h-10 items-center rounded-(--radius-sm) border border-(--color-border) bg-(--color-bg) px-3 text-sm font-medium text-(--color-text-primary) transition-colors hover:bg-(--color-badge-bg)"
        >
          See the global leaderboard
        </Link>
      }
    />
  );
}

type GroupsView = 'no-organization' | 'loading' | 'error' | 'ready';

type TenantStatus = ReturnType<typeof useSessionTenantStatus>;
type ListState = ReturnType<typeof useStudyGroupsStore.getState>['listState'];

function resolveGroupsView(
  tenantStatus: TenantStatus,
  listState: ListState,
  list: StudyGroupListDto | null,
): GroupsView {
  if (tenantStatus === 'none') {
    return 'no-organization';
  }
  if (tenantStatus === 'pending') {
    return 'loading';
  }
  if (list) {
    return 'ready';
  }
  if (listState === 'error') {
    return 'error';
  }
  return 'loading';
}

function emptyGroupsDescription(canCreate: boolean, hasDiscoverable: boolean): string {
  if (canCreate) {
    return 'Create a group for a team or cohort, then add members and set a shared goal.';
  }
  if (hasDiscoverable) {
    return 'Join an open group below, or ask an owner to add you.';
  }
  return 'When an owner adds you to a group, it will show up here.';
}

function CreateGroupButton({ onClick }: Readonly<{ onClick: () => void }>) {
  return (
    <Button type="button" onClick={onClick}>
      <Plus className="h-4 w-4" />
      Create group
    </Button>
  );
}

function GroupsLoadError({ onRetry }: Readonly<{ onRetry: () => void }>) {
  return (
    <EmptyState
      icon={UsersRound}
      title="Groups could not be loaded"
      description="Something went wrong while loading your groups. Try again in a moment."
      action={
        <Button type="button" variant="secondary" onClick={onRetry}>
          Try again
        </Button>
      }
    />
  );
}

interface GroupsListProps {
  list: StudyGroupListDto;
  joiningId: string | null;
  onCreate: () => void;
  onJoin: (group: StudyGroupSummaryDto) => void;
}

function YourGroupsSection({ list, onCreate }: Readonly<Pick<GroupsListProps, 'list' | 'onCreate'>>) {
  const canCreate = list.canCreate;
  return (
    <Section title="Your groups" count={list.groups.length}>
      {list.groups.length === 0 ? (
        <EmptyState
          compact
          icon={UsersRound}
          title="You are not in a group yet"
          description={emptyGroupsDescription(canCreate, list.discoverable.length > 0)}
          action={canCreate ? <CreateGroupButton onClick={onCreate} /> : undefined}
        />
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {list.groups.map((group) => (
            <GroupCard key={group.id} group={group} />
          ))}
        </div>
      )}
    </Section>
  );
}

function DiscoverableSection({
  list,
  joiningId,
  onJoin,
}: Readonly<Pick<GroupsListProps, 'list' | 'joiningId' | 'onJoin'>>) {
  if (list.discoverable.length === 0) {
    return null;
  }
  return (
    <Section
      title={list.canCreate ? 'Other groups in your organization' : 'Open groups'}
      count={list.discoverable.length}
    >
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {list.discoverable.map((group) => (
          <GroupCard
            key={group.id}
            group={group}
            onJoin={onJoin}
            joining={joiningId === group.id}
          />
        ))}
      </div>
    </Section>
  );
}

function GroupsList(props: Readonly<GroupsListProps>) {
  return (
    <>
      <YourGroupsSection list={props.list} onCreate={props.onCreate} />
      <DiscoverableSection list={props.list} joiningId={props.joiningId} onJoin={props.onJoin} />
    </>
  );
}

function useGroupActions() {
  const router = useRouter();
  const create = useStudyGroupsStore((state) => state.create);
  const join = useStudyGroupsStore((state) => state.join);
  const [joiningId, setJoiningId] = React.useState<string | null>(null);

  const handleCreate = async (values: GroupFormValues): Promise<boolean> => {
    const detail = await create({
      name: values.name,
      description: values.description.length > 0 ? values.description : null,
      joinPolicy: values.joinPolicy,
    });
    if (!detail) {
      return false;
    }
    router.push(`/dashboard/groups/${detail.id}`);
    return true;
  };

  const handleJoin = async (group: StudyGroupSummaryDto) => {
    setJoiningId(group.id);
    const joined = await join(group.id);
    setJoiningId(null);
    if (joined) {
      router.push(`/dashboard/groups/${group.id}`);
    }
  };

  return { joiningId, handleCreate, handleJoin };
}

export default function StudyGroupsPage() {
  const tenantStatus = useSessionTenantStatus();
  const hasTenant = tenantStatus === 'tenant';
  const list = useStudyGroupsStore((state) => state.list);
  const listState = useStudyGroupsStore((state) => state.listState);
  const loadList = useStudyGroupsStore((state) => state.loadList);
  const isMutating = useStudyGroupsStore((state) => state.isMutating);
  const [creating, setCreating] = React.useState(false);
  const { joiningId, handleCreate, handleJoin } = useGroupActions();

  React.useEffect(() => {
    if (hasTenant) {
      void loadList();
    }
  }, [hasTenant, loadList]);

  const view = resolveGroupsView(tenantStatus, listState, list);
  const openCreate = () => setCreating(true);

  return (
    <PageContainer>
      <div className="flex flex-col gap-8">
        <PageHeader
          kicker="Community"
          title="Study groups"
          description="Practice alongside your team with shared goals, a group leaderboard and a live activity feed."
          actions={list?.canCreate ? <CreateGroupButton onClick={openCreate} /> : undefined}
        />

        {view === 'no-organization' && <NoOrganization />}
        {view === 'loading' && <GroupGridSkeleton />}
        {view === 'error' && <GroupsLoadError onRetry={() => void loadList()} />}
        {view === 'ready' && list && (
          <GroupsList
            list={list}
            joiningId={joiningId}
            onCreate={openCreate}
            onJoin={(group) => void handleJoin(group)}
          />
        )}
      </div>

      <GroupFormModal
        open={creating}
        mode="create"
        saving={isMutating}
        onClose={() => setCreating(false)}
        onSubmit={handleCreate}
      />
    </PageContainer>
  );
}
