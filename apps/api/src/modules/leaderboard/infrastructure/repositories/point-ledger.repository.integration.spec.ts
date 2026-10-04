import { randomUUID } from 'node:crypto';
import { AssessmentDifficulty, PointSource } from '@prisma/client';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { PointLedgerRepository } from './point-ledger.repository';
import { PointAward } from '../../domain/entities/point-award';
import { periodStart } from '../../domain/point-periods';
import { addDays } from '../../../daily-challenge/domain/daily-date';

const gatedDescribe = process.env.RUN_DATABASE_INTEGRATION ? describe : describe.skip;

const earliestPeriodStart = (now: Date): Date =>
  new Date(Math.min(periodStart('weekly', now).getTime(), periodStart('monthly', now).getTime()));

gatedDescribe('PointLedgerRepository (database)', () => {
  let prisma: PrismaService;
  let repository: PointLedgerRepository;
  let userId: string;

  const stats = () =>
    prisma.userStats.findUniqueOrThrow({
      where: { userId },
      select: { points: true, weeklyPoints: true, monthlyPoints: true, assessmentsCompleted: true },
    });

  beforeAll(async () => {
    prisma = new PrismaService();
    await prisma.onModuleInit();
    repository = new PointLedgerRepository(prisma);
  });

  beforeEach(async () => {
    const user = await prisma.user.create({
      data: { email: `ledger-it-${randomUUID()}@elevatesde.dev` },
      select: { id: true },
    });
    userId = user.id;
  });

  afterEach(async () => {
    await prisma.user.delete({ where: { id: userId } });
  });

  afterAll(async () => {
    await prisma.onModuleDestroy();
  });

  it('writes the ledger and stats atomically and rejects duplicates', async () => {
    const award = PointAward.problemSolved(userId, 'problem-1', AssessmentDifficulty.MEDIUM);

    await expect(repository.award(award)).resolves.toBe(true);
    await expect(repository.award(award)).resolves.toBe(false);

    await expect(stats()).resolves.toEqual({
      points: 20,
      weeklyPoints: 20,
      monthlyPoints: 20,
      assessmentsCompleted: 1,
    });
    await expect(prisma.pointLedger.count({ where: { userId } })).resolves.toBe(1);
  });

  it('adjusts to an exact all-time target without touching period totals', async () => {
    await expect(repository.adjustTo(userId, 100, randomUUID())).resolves.toBe(false);

    await repository.award(PointAward.dailyChallenge(userId, 'challenge-1'));
    await expect(repository.adjustTo(userId, 100, randomUUID())).resolves.toBe(true);
    await expect(repository.adjustTo(userId, 100, randomUUID())).resolves.toBe(false);

    await expect(stats()).resolves.toMatchObject({ points: 100, weeklyPoints: 15 });
    const adjustment = await prisma.pointLedger.findFirstOrThrow({
      where: { userId, source: PointSource.ADMIN_ADJUSTMENT },
    });
    expect(adjustment.delta).toBe(85);
  });

  it('rebuilds period totals from in-period, non-admin ledger entries only', async () => {
    const now = new Date();
    await repository.award(
      PointAward.problemSolved(userId, 'problem-1', AssessmentDifficulty.HARD),
    );
    await repository.adjustTo(userId, 500, randomUUID());
    await prisma.pointLedger.create({
      data: {
        userId,
        source: PointSource.PROBLEM_SOLVED,
        refId: 'problem-old',
        delta: 20,
        createdAt: addDays(earliestPeriodStart(now), -3),
      },
    });
    await prisma.userStats.update({
      where: { userId },
      data: { weeklyPoints: 9999, monthlyPoints: 9999 },
    });

    await repository.recalculatePeriodTotals('weekly', periodStart('weekly', now));
    await repository.recalculatePeriodTotals('monthly', periodStart('monthly', now));

    await expect(stats()).resolves.toMatchObject({
      points: 500,
      weeklyPoints: 40,
      monthlyPoints: 40,
    });
  });

  it('keeps awards that race with a rollover', async () => {
    const since = periodStart('weekly', new Date());
    const problems = Array.from({ length: 8 }, (_, index) => `problem-race-${index}`);

    await Promise.all([
      ...problems.map((problemId) =>
        repository.award(PointAward.problemSolved(userId, problemId, AssessmentDifficulty.EASY)),
      ),
      repository.recalculatePeriodTotals('weekly', since),
      repository.recalculatePeriodTotals('weekly', since),
    ]);

    await expect(stats()).resolves.toMatchObject({
      points: problems.length * 10,
      weeklyPoints: problems.length * 10,
    });
  });
});
