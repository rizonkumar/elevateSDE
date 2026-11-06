import { randomUUID } from 'node:crypto';
import {
  ContestStatus,
  PointSource,
  StudyGoalMetric,
  StudyGoalScope,
  StudyGroupJoinPolicy,
  StudyGroupRole,
} from '@prisma/client';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { StudyGroupNameTakenError } from '../../domain/interfaces/study-group-repository.interface';
import { StudyGroupRepository } from './study-group.repository';

const gatedDescribe = process.env.RUN_DATABASE_INTEGRATION ? describe : describe.skip;

const NOW = new Date('2027-03-10T12:00:00.000Z');
const WINDOW = {
  from: new Date('2027-03-01T00:00:00.000Z'),
  to: new Date('2027-04-01T00:00:00.000Z'),
};

gatedDescribe('StudyGroupRepository (database)', () => {
  let prisma: PrismaService;
  let repository: StudyGroupRepository;
  let tenantId: string;
  let otherTenantId: string;
  let ownerId: string;
  let memberId: string;
  let outsiderId: string;
  let foreignId: string;
  let groupId: string;
  let problemId: string;
  let challengeId: string;
  let contestId: string;

  beforeAll(async () => {
    prisma = new PrismaService();
    await prisma.onModuleInit();
    repository = new StudyGroupRepository(prisma);
  });

  beforeEach(async () => {
    const suffix = randomUUID();
    tenantId = (await prisma.tenant.create({ data: { name: `Org ${suffix}` } })).id;
    otherTenantId = (await prisma.tenant.create({ data: { name: `Other ${suffix}` } })).id;
    const createUser = async (firstName: string, tenant: string) =>
      (
        await prisma.user.create({
          data: { email: `${firstName}-${suffix}@elevatesde.dev`, firstName, tenantId: tenant },
        })
      ).id;
    ownerId = await createUser('Olu', tenantId);
    memberId = await createUser('Mia', tenantId);
    outsiderId = await createUser('Oz', tenantId);
    foreignId = await createUser('Fay', otherTenantId);
    problemId = (
      await prisma.problem.create({
        data: {
          slug: `it-${suffix}`,
          title: 'Two Sum',
          difficulty: 'EASY',
          description: 'd',
          starterCode: {},
          examples: [],
          functionName: 'twoSum',
          harness: {},
          referenceSolution: {},
        },
      })
    ).id;
    challengeId = (
      await prisma.dailyChallenge.create({
        data: { challengeDate: new Date('2027-03-05'), problemId, tenantId },
      })
    ).id;
    contestId = (
      await prisma.contest.create({
        data: {
          slug: `it-${suffix}`,
          title: 'Weekly 1',
          description: 'd',
          startsAt: new Date('2027-03-06T10:00:00.000Z'),
          endsAt: new Date('2027-03-06T11:00:00.000Z'),
          status: ContestStatus.ENDED,
        },
      })
    ).id;
    groupId = (
      await repository.createGroup(
        tenantId,
        ownerId,
        { name: 'Cohort', description: null, joinPolicy: StudyGroupJoinPolicy.INVITE_ONLY },
        [ownerId],
      )
    ).id;
    await repository.addMembers(groupId, tenantId, [memberId, foreignId], StudyGroupRole.MEMBER);
    await prisma.pointLedger.createMany({
      data: [
        { userId: ownerId, source: PointSource.PROBLEM_SOLVED, refId: problemId, delta: 10, createdAt: new Date('2027-03-02T00:00:00.000Z') },
        { userId: memberId, source: PointSource.DAILY_CHALLENGE, refId: challengeId, delta: 15, createdAt: new Date('2027-03-05T00:00:00.000Z') },
        { userId: memberId, source: PointSource.CONTEST_RESULT, refId: contestId, delta: 60, createdAt: new Date('2027-03-06T12:00:00.000Z') },
        { userId: memberId, source: PointSource.ADMIN_ADJUSTMENT, refId: randomUUID(), delta: 500, createdAt: new Date('2027-03-07T00:00:00.000Z') },
        { userId: ownerId, source: PointSource.PROBLEM_SOLVED, refId: randomUUID(), delta: 20, createdAt: new Date('2027-02-01T00:00:00.000Z') },
      ],
    });
    await prisma.contestParticipant.createMany({
      data: [
        { contestId, userId: memberId },
        { contestId, userId: ownerId },
      ],
    });
    await prisma.contestProblem.create({ data: { contestId, problemId, ordinal: 1 } });
    await prisma.submission.create({
      data: {
        userId: memberId,
        problemId,
        language: 'PYTHON',
        sourceCode: 'pass',
        status: 'WRONG_ANSWER',
        createdAt: new Date('2027-03-06T10:30:00.000Z'),
      },
    });
  });

  afterEach(async () => {
    await prisma.contest.delete({ where: { id: contestId } });
    await prisma.problem.delete({ where: { id: problemId } });
    await prisma.tenant.deleteMany({ where: { id: { in: [tenantId, otherTenantId] } } });
  });

  afterAll(async () => {
    await prisma.onModuleDestroy();
  });

  it('counts only same-tenant members and open goals in the tenant listing', async () => {
    await repository.createGoal(groupId, tenantId, {
      title: 'Open',
      metric: StudyGoalMetric.POINTS,
      scope: StudyGoalScope.GROUP_TOTAL,
      target: 10,
      startsAt: WINDOW.from,
      endsAt: WINDOW.to,
    });
    const [group] = await repository.listTenantGroups(tenantId, NOW);
    expect(group).toMatchObject({ id: groupId, memberCount: 2, activeGoalCount: 1 });
    expect(await repository.countOwners(groupId, tenantId)).toBe(1);
    expect((await repository.listMembers(groupId, tenantId)).map((member) => member.userId)).toEqual([
      ownerId,
      memberId,
    ]);
  });

  it('aggregates every goal metric inside the window', async () => {
    const ids = [ownerId, memberId];
    expect(await repository.metricTotals(ids, StudyGoalMetric.PROBLEMS_SOLVED, WINDOW)).toEqual(
      new Map([[ownerId, 1]]),
    );
    expect(await repository.metricTotals(ids, StudyGoalMetric.DAILY_CHALLENGES, WINDOW)).toEqual(
      new Map([[memberId, 1]]),
    );
    expect(await repository.metricTotals(ids, StudyGoalMetric.POINTS, WINDOW)).toEqual(
      new Map([
        [ownerId, 10],
        [memberId, 75],
      ]),
    );
    expect(await repository.metricTotals(ids, StudyGoalMetric.CONTESTS_ENTERED, WINDOW)).toEqual(
      new Map([[memberId, 1]]),
    );
  });

  it('sums points and solved counts per member, excluding admin adjustments', async () => {
    const allTime = await repository.pointTotals([ownerId, memberId], { from: null, to: null });
    expect(allTime.get(ownerId)).toEqual({ points: 30, problemsSolved: 2 });
    expect(allTime.get(memberId)).toEqual({ points: 75, problemsSolved: 0 });
    const march = await repository.pointTotals([ownerId], { from: WINDOW.from, to: null });
    expect(march.get(ownerId)).toEqual({ points: 10, problemsSolved: 1 });
  });

  it('describes recent activity with titles and links, newest first', async () => {
    const activity = await repository.recentActivity([ownerId, memberId], 10);
    expect(activity.map((item) => [item.kind, item.title, item.linkUrl])).toEqual([
      ['CONTEST_RESULT', 'Weekly 1', expect.stringMatching(/^\/dashboard\/contests\/it-.+\/standings$/)],
      ['DAILY_CHALLENGE', 'Two Sum', '/dashboard/daily'],
      ['PROBLEM_SOLVED', 'Two Sum', `/dashboard/assessment/${problemId}`],
    ]);
  });

  it('searches tenant users outside the group and rejects duplicate names', async () => {
    const candidates = await repository.searchRosterCandidates(groupId, tenantId, 'o', 10);
    expect(candidates.map((candidate) => candidate.userId)).toEqual([outsiderId]);
    await expect(
      repository.createGroup(
        tenantId,
        ownerId,
        { name: 'Cohort', description: null, joinPolicy: StudyGroupJoinPolicy.OPEN },
        [ownerId],
      ),
    ).rejects.toBeInstanceOf(StudyGroupNameTakenError);
  });

  it('lists in-progress goals and completes a goal only once', async () => {
    const goal = await repository.createGoal(groupId, tenantId, {
      title: 'Sprint',
      metric: StudyGoalMetric.PROBLEMS_SOLVED,
      scope: StudyGoalScope.GROUP_TOTAL,
      target: 1,
      startsAt: WINDOW.from,
      endsAt: WINDOW.to,
    });
    const open = await repository.listInProgressGoals([groupId], NOW);
    expect(open).toEqual([expect.objectContaining({ id: goal.id, groupName: 'Cohort' })]);
    expect(await repository.markGoalCompleted(goal.id, NOW)).toBe(true);
    expect(await repository.markGoalCompleted(goal.id, NOW)).toBe(false);
    expect(await repository.listInProgressGoals([groupId], NOW)).toEqual([]);
    expect(await repository.listActiveMembershipsForUser(memberId)).toEqual([
      { groupId, tenantId },
    ]);
  });
});
