import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PointSource, StudyGoalMetric, StudyGroupJoinPolicy, StudyGroupRole } from '@prisma/client';
import { NOTIFICATION_EVENTS, StudyGroupAddedEvent } from '../../notification/domain/events/notification-events';
import { RecordingRealtimePublisher } from '../../realtime/testing/recording-realtime.publisher';
import { FakeStudyGroupRepository } from '../testing/fake-study-group.repository';
import { StudyGroupActor } from '../domain/policies/study-group-access';
import { StudyGroupService } from './study-group.service';

const TENANT = 'tenant-1';
const OTHER_TENANT = 'tenant-2';
const NOW = new Date('2027-03-10T12:00:00.000Z');

const ADMIN = 'aaaaaaaa-0000-4000-8000-000000000001';
const OWNER = 'aaaaaaaa-0000-4000-8000-000000000002';
const MEMBER = 'aaaaaaaa-0000-4000-8000-000000000003';
const OUTSIDER = 'aaaaaaaa-0000-4000-8000-000000000004';
const FOREIGN = 'aaaaaaaa-0000-4000-8000-000000000005';

function actorFor(userId: string, overrides: Partial<StudyGroupActor> = {}): StudyGroupActor {
  return {
    userId,
    tenantId: TENANT,
    isTenantAdmin: userId === ADMIN,
    displayName: 'Admin Person',
    ...overrides,
  };
}

describe('StudyGroupService', () => {
  let repository: FakeStudyGroupRepository;
  let service: StudyGroupService;
  let added: StudyGroupAddedEvent[];
  let realtime: RecordingRealtimePublisher;
  let groupId: string;

  beforeEach(() => {
    repository = new FakeStudyGroupRepository();
    const emitter = new EventEmitter2();
    added = [];
    emitter.on(NOTIFICATION_EVENTS.STUDY_GROUP_ADDED, (event: StudyGroupAddedEvent) =>
      added.push(event),
    );
    realtime = new RecordingRealtimePublisher();
    service = new StudyGroupService(repository, emitter, realtime);
    const people: Array<[string, string, string | null]> = [
      [ADMIN, 'Ada', TENANT],
      [OWNER, 'Olu', TENANT],
      [MEMBER, 'Mia', TENANT],
      [OUTSIDER, 'Oz', TENANT],
      [FOREIGN, 'Fay', OTHER_TENANT],
    ];
    people.forEach(([id, firstName, tenantId]) =>
      repository.addUser({
        id,
        firstName,
        lastName: 'Test',
        email: `${firstName.toLowerCase()}@example.com`,
        tenantId,
        isTenantAdmin: id === ADMIN,
      }),
    );
    groupId = repository.seedGroup({ tenantId: TENANT, name: 'Cohort A' }).id;
    repository.seedMember(groupId, OWNER, StudyGroupRole.OWNER);
    repository.seedMember(groupId, MEMBER);
  });

  describe('organization scoping', () => {
    it('rejects users without an organization with a clear 403', async () => {
      await expect(service.list(actorFor(OUTSIDER, { tenantId: null }))).rejects.toThrow(
        ForbiddenException,
      );
      await expect(
        service.getDetail(actorFor(OUTSIDER, { tenantId: null }), groupId),
      ).rejects.toThrow(/organization/);
    });

    it('returns 404 for a group in another tenant, even for that tenant admin', async () => {
      await expect(
        service.getDetail(actorFor(FOREIGN, { tenantId: OTHER_TENANT, isTenantAdmin: true }), groupId),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.join(actorFor(FOREIGN, { tenantId: OTHER_TENANT }), groupId),
      ).rejects.toThrow(NotFoundException);
    });

    it('hides invite-only groups from non-members but shows them to admins', async () => {
      await expect(service.getDetail(actorFor(OUTSIDER), groupId)).rejects.toThrow(
        NotFoundException,
      );
      const detail = await service.getDetail(actorFor(ADMIN), groupId, NOW);
      expect(detail.access.canArchive).toBe(true);
      expect(detail.members.map((member) => member.userId)).toEqual([OWNER, MEMBER]);
    });
  });

  describe('list', () => {
    it('separates my groups from groups I can join and ranks me for the week', async () => {
      const openId = repository.seedGroup({
        tenantId: TENANT,
        name: 'Open group',
        joinPolicy: StudyGroupJoinPolicy.OPEN,
      }).id;
      repository.seedLedger({
        userId: MEMBER,
        source: PointSource.PROBLEM_SOLVED,
        delta: 20,
        createdAt: new Date('2027-03-09T00:00:00.000Z'),
      });

      const memberView = await service.list(actorFor(MEMBER), NOW);
      expect(memberView.canCreate).toBe(false);
      expect(memberView.groups.map((group) => [group.id, group.myRole, group.myWeeklyRank])).toEqual([
        [groupId, StudyGroupRole.MEMBER, 1],
      ]);
      expect(memberView.discoverable.map((group) => group.id)).toEqual([openId]);

      const adminView = await service.list(actorFor(ADMIN), NOW);
      expect(adminView.canCreate).toBe(true);
      expect(adminView.discoverable.map((group) => group.id).sort()).toEqual(
        [groupId, openId].sort(),
      );
    });
  });

  describe('create', () => {
    it('only lets tenant admins create groups', async () => {
      await expect(
        service.create(actorFor(OWNER), { name: 'New', joinPolicy: StudyGroupJoinPolicy.OPEN }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('makes the creator the owner by default', async () => {
      const detail = await service.create(
        actorFor(ADMIN),
        { name: 'New cohort', joinPolicy: StudyGroupJoinPolicy.OPEN },
        NOW,
      );
      expect(detail.members).toEqual([expect.objectContaining({ userId: ADMIN, role: 'OWNER' })]);
      expect(added).toHaveLength(0);
    });

    it('assigns chosen owners and notifies them', async () => {
      const detail = await service.create(actorFor(ADMIN), {
        name: 'Coached cohort',
        joinPolicy: StudyGroupJoinPolicy.INVITE_ONLY,
        ownerIds: [OUTSIDER],
      });
      expect(detail.members.map((member) => [member.userId, member.role])).toEqual([
        [OUTSIDER, 'OWNER'],
      ]);
      expect(added.map((event) => event.recipientId)).toEqual([OUTSIDER]);
    });

    it('rejects owners from another tenant', async () => {
      await expect(
        service.create(actorFor(ADMIN), {
          name: 'Bad',
          joinPolicy: StudyGroupJoinPolicy.OPEN,
          ownerIds: [FOREIGN],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('returns 409 for a duplicate name in the same tenant', async () => {
      await expect(
        service.create(actorFor(ADMIN), { name: 'Cohort A', joinPolicy: StudyGroupJoinPolicy.OPEN }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('membership', () => {
    it('lets anyone in the tenant join an open group but not an invite-only one', async () => {
      const openId = repository.seedGroup({
        tenantId: TENANT,
        name: 'Open',
        joinPolicy: StudyGroupJoinPolicy.OPEN,
      }).id;
      const detail = await service.join(actorFor(OUTSIDER), openId);
      expect(detail.access.isMember).toBe(true);
      await expect(service.join(actorFor(OUTSIDER), groupId)).rejects.toThrow(NotFoundException);
    });

    it('enforces the 200 member limit', async () => {
      for (let index = 0; index < 198; index += 1) {
        const id = `bbbbbbbb-0000-4000-8000-${String(index).padStart(12, '0')}`;
        repository.addUser({ id, firstName: 'U', lastName: `${index}`, email: `${id}@x.io`, tenantId: TENANT });
        repository.seedMember(groupId, id);
      }
      await expect(service.addMembers(actorFor(OWNER), groupId, [OUTSIDER])).rejects.toThrow(
        /at most 200 members/,
      );
    });

    it('adds tenant members and notifies everyone but the actor', async () => {
      await service.addMembers(actorFor(OWNER), groupId, [OUTSIDER, OUTSIDER]);
      expect(added.map((event) => [event.recipientId, event.groupName])).toEqual([
        [OUTSIDER, 'Cohort A'],
      ]);
      const today = new Date().toISOString().slice(0, 10);
      expect(added.map((event) => event.dedupeKey)).toEqual([
        `group-added:${groupId}:${OUTSIDER}:${today}`,
      ]);
      await expect(service.addMembers(actorFor(OWNER), groupId, [FOREIGN])).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.addMembers(actorFor(MEMBER), groupId, [OUTSIDER])).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('stops the last owner from leaving', async () => {
      await expect(service.leave(actorFor(OWNER), groupId)).rejects.toThrow(/at least one owner/);
      await service.updateMemberRole(actorFor(ADMIN), groupId, MEMBER, StudyGroupRole.OWNER);
      await expect(service.leave(actorFor(OWNER), groupId)).resolves.toBeUndefined();
      expect(realtime.evictions).toEqual([{ groupId, userId: OWNER }]);
    });

    it('lets only tenant admins change roles, including demoting the last owner', async () => {
      await expect(
        service.updateMemberRole(actorFor(OWNER), groupId, MEMBER, StudyGroupRole.OWNER),
      ).rejects.toThrow(ForbiddenException);
      const detail = await service.updateMemberRole(
        actorFor(ADMIN),
        groupId,
        OWNER,
        StudyGroupRole.MEMBER,
      );
      expect(detail.members.every((member) => member.role === 'MEMBER')).toBe(true);
    });

    it('lets owners remove members but not owners', async () => {
      repository.seedMember(groupId, OUTSIDER, StudyGroupRole.OWNER);
      await expect(service.removeMember(actorFor(OWNER), groupId, OUTSIDER)).rejects.toThrow(
        /remove a group owner/,
      );
      const detail = await service.removeMember(actorFor(OWNER), groupId, MEMBER);
      expect(detail.members.map((member) => member.userId)).not.toContain(MEMBER);
      expect(realtime.evictions).toEqual([{ groupId, userId: MEMBER }]);
    });

    it('searches only tenant members who are not in the group', async () => {
      const candidates = await service.rosterCandidates(actorFor(OWNER), groupId, '');
      expect(candidates.map((candidate) => candidate.userId).sort()).toEqual(
        [ADMIN, OUTSIDER].sort(),
      );
    });
  });

  describe('goals', () => {
    const goalInput = {
      title: 'Solve together',
      metric: StudyGoalMetric.PROBLEMS_SOLVED,
      scope: 'GROUP_TOTAL' as const,
      target: 2,
      startsAt: new Date('2027-03-01T00:00:00.000Z'),
      endsAt: new Date('2027-04-01T00:00:00.000Z'),
    };

    it('only lets owners and admins manage goals', async () => {
      await expect(service.createGoal(actorFor(MEMBER), groupId, goalInput, NOW)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('caps a group at five active goals', async () => {
      for (let index = 0; index < 5; index += 1) {
        await service.createGoal(actorFor(OWNER), groupId, goalInput, NOW);
      }
      await expect(service.createGoal(actorFor(OWNER), groupId, goalInput, NOW)).rejects.toThrow(
        /at most 5 active goals/,
      );
    });

    it('rejects goals that already ended or end before they start', async () => {
      await expect(
        service.createGoal(
          actorFor(OWNER),
          groupId,
          { ...goalInput, endsAt: new Date('2027-03-05T00:00:00.000Z') },
          NOW,
        ),
      ).rejects.toThrow(/in the future/);
      await expect(
        service.createGoal(
          actorFor(OWNER),
          groupId,
          { ...goalInput, startsAt: goalInput.endsAt },
          NOW,
        ),
      ).rejects.toThrow(/end after it starts/);
    });

    it('derives goal progress from member activity in the window', async () => {
      repository.seedLedger({ userId: MEMBER, source: PointSource.PROBLEM_SOLVED });
      repository.seedLedger({
        userId: MEMBER,
        source: PointSource.PROBLEM_SOLVED,
        createdAt: new Date('2027-01-01T00:00:00.000Z'),
      });
      const detail = await service.createGoal(actorFor(OWNER), groupId, goalInput, NOW);
      expect(detail.goals[0]?.progress).toEqual({
        scope: 'GROUP_TOTAL',
        current: 0,
        target: 2,
        percent: 0,
      });
      repository.seedLedger({
        userId: OWNER,
        source: PointSource.PROBLEM_SOLVED,
        createdAt: new Date('2027-03-02T00:00:00.000Z'),
      });
      repository.seedLedger({
        userId: MEMBER,
        source: PointSource.PROBLEM_SOLVED,
        createdAt: new Date('2027-03-03T00:00:00.000Z'),
      });
      const refreshed = await service.getDetail(actorFor(MEMBER), groupId, NOW);
      expect(refreshed.goals[0]?.progress).toMatchObject({ current: 2, percent: 100 });
      expect(refreshed.goals[0]?.status).toBe('ACTIVE');
    });

    it('returns 404 for a goal from another group', async () => {
      const otherId = repository.seedGroup({ tenantId: TENANT, name: 'Other' }).id;
      const goal = repository.seedGoal({ groupId: otherId });
      await expect(service.deleteGoal(actorFor(OWNER), groupId, goal.id)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('leaderboard', () => {
    it('ranks members within the requested window', async () => {
      repository.seedLedger({
        userId: OWNER,
        source: PointSource.PROBLEM_SOLVED,
        delta: 40,
        createdAt: new Date('2027-01-05T00:00:00.000Z'),
      });
      repository.seedLedger({
        userId: MEMBER,
        source: PointSource.DAILY_CHALLENGE,
        delta: 15,
        createdAt: new Date('2027-03-09T00:00:00.000Z'),
      });

      const week = await service.leaderboard(actorFor(MEMBER), groupId, 'week', NOW);
      expect(week.entries.map((entry) => [entry.userId, entry.points, entry.isViewer])).toEqual([
        [MEMBER, 15, true],
        [OWNER, 0, false],
      ]);

      const allTime = await service.leaderboard(actorFor(MEMBER), groupId, 'all', NOW);
      expect(allTime.entries[0]).toMatchObject({ userId: OWNER, points: 40, problemsSolved: 1 });

      const goal = await service.leaderboard(actorFor(MEMBER), groupId, 'goal', NOW);
      expect(goal.window).toBe('week');
    });
  });

  describe('archive and room access', () => {
    it('only lets tenant admins archive, then hides the group', async () => {
      await expect(service.archive(actorFor(OWNER), groupId, NOW)).rejects.toThrow(
        ForbiddenException,
      );
      expect(realtime.evictions).toEqual([]);
      await service.archive(actorFor(ADMIN), groupId, NOW);
      expect(realtime.evictions).toEqual([{ groupId, userId: null }]);
      await expect(service.getDetail(actorFor(MEMBER), groupId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('lets members and tenant admins join the live room, but not outsiders', async () => {
      await expect(service.canJoinRoom(MEMBER, TENANT, groupId)).resolves.toBe(true);
      await expect(service.canJoinRoom(ADMIN, TENANT, groupId)).resolves.toBe(true);
      await expect(service.canJoinRoom(OUTSIDER, TENANT, groupId)).resolves.toBe(false);
      await expect(service.canJoinRoom(FOREIGN, OTHER_TENANT, groupId)).resolves.toBe(false);
      await expect(service.canJoinRoom(MEMBER, null, groupId)).resolves.toBe(false);
    });
  });
});
