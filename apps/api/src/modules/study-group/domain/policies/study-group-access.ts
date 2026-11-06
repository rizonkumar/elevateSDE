import { StudyGroupJoinPolicy, StudyGroupRole } from '@prisma/client';

export interface StudyGroupActor {
  userId: string;
  tenantId: string | null;
  isTenantAdmin: boolean;
  displayName: string;
}

export interface TenantActor extends StudyGroupActor {
  tenantId: string;
}

export interface GroupAccessTarget {
  tenantId: string;
  joinPolicy: StudyGroupJoinPolicy;
  archivedAt: Date | null;
}

export interface GroupAccess {
  canView: boolean;
  role: StudyGroupRole | null;
  isMember: boolean;
  isTenantAdmin: boolean;
  canEdit: boolean;
  canArchive: boolean;
  canManageMembers: boolean;
  canAssignRoles: boolean;
  canManageGoals: boolean;
  canJoin: boolean;
  canLeave: boolean;
}

const NO_ACCESS: GroupAccess = {
  canView: false,
  role: null,
  isMember: false,
  isTenantAdmin: false,
  canEdit: false,
  canArchive: false,
  canManageMembers: false,
  canAssignRoles: false,
  canManageGoals: false,
  canJoin: false,
  canLeave: false,
};

export function hasTenant(actor: StudyGroupActor): actor is TenantActor {
  return actor.tenantId !== null;
}

export function resolveGroupAccess(
  actor: StudyGroupActor,
  group: GroupAccessTarget,
  role: StudyGroupRole | null,
): GroupAccess {
  if (actor.tenantId === null || actor.tenantId !== group.tenantId || group.archivedAt !== null) {
    return NO_ACCESS;
  }
  const isMember = role !== null;
  const isOwner = role === StudyGroupRole.OWNER;
  const isOpen = group.joinPolicy === StudyGroupJoinPolicy.OPEN;
  const manages = actor.isTenantAdmin || isOwner;
  return {
    canView: isMember || actor.isTenantAdmin || isOpen,
    role,
    isMember,
    isTenantAdmin: actor.isTenantAdmin,
    canEdit: manages,
    canArchive: actor.isTenantAdmin,
    canManageMembers: manages,
    canAssignRoles: actor.isTenantAdmin,
    canManageGoals: manages,
    canJoin: !isMember && isOpen,
    canLeave: isMember,
  };
}

export interface OwnershipChange {
  targetRole: StudyGroupRole;
  nextRole: StudyGroupRole | null;
  ownerCount: number;
  actorIsTenantAdmin: boolean;
}

export function wouldLeaveGroupWithoutOwner(change: OwnershipChange): boolean {
  if (change.actorIsTenantAdmin || change.targetRole !== StudyGroupRole.OWNER) {
    return false;
  }
  if (change.nextRole === StudyGroupRole.OWNER) {
    return false;
  }
  return change.ownerCount <= 1;
}

export function canRemoveMember(
  access: GroupAccess,
  actorId: string,
  targetUserId: string,
  targetRole: StudyGroupRole,
): boolean {
  if (actorId === targetUserId) {
    return access.canLeave;
  }
  if (!access.canManageMembers) {
    return false;
  }
  return targetRole !== StudyGroupRole.OWNER || access.isTenantAdmin;
}
