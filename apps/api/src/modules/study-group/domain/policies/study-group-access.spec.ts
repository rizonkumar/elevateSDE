import { StudyGroupJoinPolicy, StudyGroupRole } from '@prisma/client';
import {
  StudyGroupActor,
  canRemoveMember,
  resolveGroupAccess,
  wouldLeaveGroupWithoutOwner,
} from './study-group-access';

const TENANT = 'tenant-1';
const inviteOnly = { tenantId: TENANT, joinPolicy: StudyGroupJoinPolicy.INVITE_ONLY, archivedAt: null };
const open = { ...inviteOnly, joinPolicy: StudyGroupJoinPolicy.OPEN };

const actor = (overrides: Partial<StudyGroupActor> = {}): StudyGroupActor => ({
  userId: 'user-1',
  tenantId: TENANT,
  isTenantAdmin: false,
  displayName: 'Ada',
  ...overrides,
});

describe('resolveGroupAccess', () => {
  it.each([
    ['tenant admin, not a member', actor({ isTenantAdmin: true }), null, inviteOnly,
      { canView: true, canEdit: true, canArchive: true, canManageMembers: true, canAssignRoles: true, canManageGoals: true, canJoin: false, canLeave: false }],
    ['owner', actor(), StudyGroupRole.OWNER, inviteOnly,
      { canView: true, canEdit: true, canArchive: false, canManageMembers: true, canAssignRoles: false, canManageGoals: true, canJoin: false, canLeave: true }],
    ['member', actor(), StudyGroupRole.MEMBER, inviteOnly,
      { canView: true, canEdit: false, canArchive: false, canManageMembers: false, canAssignRoles: false, canManageGoals: false, canJoin: false, canLeave: true }],
    ['outsider of an open group', actor(), null, open,
      { canView: true, canEdit: false, canArchive: false, canManageMembers: false, canAssignRoles: false, canManageGoals: false, canJoin: true, canLeave: false }],
    ['outsider of an invite-only group', actor(), null, inviteOnly,
      { canView: false, canEdit: false, canArchive: false, canManageMembers: false, canAssignRoles: false, canManageGoals: false, canJoin: false, canLeave: false }],
  ])('grants the %s the expected capabilities', (_label, viewer, role, group, expected) => {
    expect(resolveGroupAccess(viewer, group, role)).toMatchObject(expected);
  });

  it('hides groups from other tenants even for admins and members', () => {
    const access = resolveGroupAccess(
      actor({ tenantId: 'tenant-2', isTenantAdmin: true }),
      open,
      StudyGroupRole.OWNER,
    );
    expect(access.canView).toBe(false);
    expect(access.canEdit).toBe(false);
  });

  it('hides archived groups', () => {
    const access = resolveGroupAccess(
      actor({ isTenantAdmin: true }),
      { ...open, archivedAt: new Date() },
      StudyGroupRole.OWNER,
    );
    expect(access.canView).toBe(false);
  });

  it('gives users without an organization no access', () => {
    expect(resolveGroupAccess(actor({ tenantId: null }), open, null).canView).toBe(false);
  });
});

describe('wouldLeaveGroupWithoutOwner', () => {
  const base = {
    targetRole: StudyGroupRole.OWNER,
    nextRole: null,
    ownerCount: 1,
    actorIsTenantAdmin: false,
  };

  it('blocks the last owner from leaving', () => {
    expect(wouldLeaveGroupWithoutOwner(base)).toBe(true);
  });

  it('blocks demoting the last owner', () => {
    expect(wouldLeaveGroupWithoutOwner({ ...base, nextRole: StudyGroupRole.MEMBER })).toBe(true);
  });

  it('allows it when another owner remains', () => {
    expect(wouldLeaveGroupWithoutOwner({ ...base, ownerCount: 2 })).toBe(false);
  });

  it('allows tenant admins to override', () => {
    expect(wouldLeaveGroupWithoutOwner({ ...base, actorIsTenantAdmin: true })).toBe(false);
  });

  it('ignores members and owner-to-owner changes', () => {
    expect(wouldLeaveGroupWithoutOwner({ ...base, targetRole: StudyGroupRole.MEMBER })).toBe(false);
    expect(wouldLeaveGroupWithoutOwner({ ...base, nextRole: StudyGroupRole.OWNER })).toBe(false);
  });
});

describe('canRemoveMember', () => {
  const ownerAccess = resolveGroupAccess(actor(), inviteOnly, StudyGroupRole.OWNER);
  const adminAccess = resolveGroupAccess(actor({ isTenantAdmin: true }), inviteOnly, null);
  const memberAccess = resolveGroupAccess(actor(), inviteOnly, StudyGroupRole.MEMBER);

  it('lets owners remove members but not other owners', () => {
    expect(canRemoveMember(ownerAccess, 'user-1', 'user-2', StudyGroupRole.MEMBER)).toBe(true);
    expect(canRemoveMember(ownerAccess, 'user-1', 'user-2', StudyGroupRole.OWNER)).toBe(false);
  });

  it('lets tenant admins remove owners', () => {
    expect(canRemoveMember(adminAccess, 'user-1', 'user-2', StudyGroupRole.OWNER)).toBe(true);
  });

  it('lets members remove only themselves', () => {
    expect(canRemoveMember(memberAccess, 'user-1', 'user-1', StudyGroupRole.MEMBER)).toBe(true);
    expect(canRemoveMember(memberAccess, 'user-1', 'user-2', StudyGroupRole.MEMBER)).toBe(false);
  });
});
