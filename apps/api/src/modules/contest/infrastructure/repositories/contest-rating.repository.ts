import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { ContestStatus, Prisma, SubmissionStatus } from '@prisma/client';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { PUBLIC_HANDLE_SELECT, resolvePublicHandle } from '../../../../common/public-handle';
import { IContestRatingRepository } from '../../domain/interfaces/contest-rating-repository.interface';
import { INITIAL_RATING, RatingChange } from '../../domain/rating/rating-calculator';
import {
  PendingRatingContest,
  RateContestCommand,
  RatingCandidate,
  RatingHistoryEntryView,
  RatingLeaderboardPage,
  RatingLeaderboardScope,
  StandingRatingView,
  UserRatingView,
} from '../../domain/read-models/contest-rating-view';

const RATING_TRANSACTION_TIMEOUT_MS = 60_000;
const UNJUDGED_STATUSES: SubmissionStatus[] = [SubmissionStatus.QUEUED, SubmissionStatus.RUNNING];

@Injectable()
export class ContestRatingRepository implements IContestRatingRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findPendingContests(): Promise<PendingRatingContest[]> {
    const rows = await this.prisma.contest.findMany({
      where: { finalizedAt: { not: null }, ratedAt: null },
      orderBy: [{ endsAt: 'asc' }, { id: 'asc' }],
      select: {
        id: true,
        slug: true,
        title: true,
        isRated: true,
        startsAt: true,
        endsAt: true,
        problems: { select: { problemId: true } },
      },
    });
    return rows.map((row) => ({
      id: row.id,
      slug: row.slug,
      title: row.title,
      isRated: row.isRated,
      startsAt: row.startsAt,
      endsAt: row.endsAt,
      problemIds: row.problems.map((problem) => problem.problemId),
    }));
  }

  async findEarliestUnfinalizedRatedEndsAt(now: Date): Promise<Date | null> {
    const row = await this.prisma.contest.findFirst({
      where: {
        finalizedAt: null,
        isRated: true,
        status: { not: ContestStatus.DRAFT },
        endsAt: { lte: now },
      },
      orderBy: { endsAt: 'asc' },
      select: { endsAt: true },
    });
    return row?.endsAt ?? null;
  }

  async findRatingCandidates(contest: PendingRatingContest): Promise<RatingCandidate[]> {
    if (contest.problemIds.length === 0) {
      return [];
    }
    const participants = await this.prisma.contestParticipant.findMany({
      where: { contestId: contest.id, finalRank: { not: null } },
      select: { userId: true, finalRank: true },
    });
    if (participants.length === 0) {
      return [];
    }
    const submitters = await this.prisma.submission.findMany({
      where: {
        problemId: { in: contest.problemIds },
        userId: { in: participants.map((participant) => participant.userId) },
        status: { notIn: UNJUDGED_STATUSES },
        createdAt: { gte: contest.startsAt, lte: contest.endsAt },
      },
      distinct: ['userId'],
      select: { userId: true },
    });
    const submitted = new Set(submitters.map((submitter) => submitter.userId));
    return participants.flatMap((participant) =>
      participant.finalRank !== null && submitted.has(participant.userId)
        ? [{ userId: participant.userId, rank: participant.finalRank }]
        : [],
    );
  }

  async rateContest(command: RateContestCommand): Promise<RatingChange[] | null> {
    return this.prisma.$transaction(
      async (transaction) => {
        const claimed = await transaction.contest.updateMany({
          where: { id: command.contestId, ratedAt: null },
          data: { ratedAt: command.ratedAt },
        });
        if (claimed.count === 0) {
          return null;
        }
        const userIds = command.candidates.map((candidate) => candidate.userId);
        const [ratings, users] = await Promise.all([
          transaction.userRating.findMany({ where: { userId: { in: userIds } } }),
          transaction.user.findMany({
            where: { id: { in: userIds } },
            select: { id: true, tenantId: true },
          }),
        ]);
        const ratingByUser = new Map(ratings.map((rating) => [rating.userId, rating]));
        const tenantByUser = new Map(users.map((user) => [user.id, user.tenantId]));
        const changes = command.calculate(
          command.candidates.map((candidate) => ({
            userId: candidate.userId,
            rank: candidate.rank,
            rating: ratingByUser.get(candidate.userId)?.rating ?? INITIAL_RATING,
          })),
        );
        await transaction.contestRatingChange.createMany({
          data: changes.map((change) => ({
            id: randomUUID(),
            contestId: command.contestId,
            userId: change.userId,
            tenantId: tenantByUser.get(change.userId) ?? null,
            rank: change.rank,
            oldRating: change.oldRating,
            newRating: change.newRating,
            delta: change.delta,
            performance: change.performance,
            createdAt: command.ratedAt,
          })),
        });
        const upserts = changes.map((change) => {
          const previousPeak = ratingByUser.get(change.userId)?.peakRating ?? INITIAL_RATING;
          return transaction.userRating.upsert({
            where: { userId: change.userId },
            create: {
              userId: change.userId,
              rating: change.newRating,
              peakRating: Math.max(INITIAL_RATING, change.newRating),
              contestsRated: 1,
              lastRatedAt: command.ratedAt,
            },
            update: {
              rating: change.newRating,
              peakRating: Math.max(previousPeak, change.newRating),
              contestsRated: { increment: 1 },
              lastRatedAt: command.ratedAt,
            },
          });
        });
        await Promise.all(upserts);
        return changes;
      },
      { timeout: RATING_TRANSACTION_TIMEOUT_MS },
    );
  }

  async markRatedWithoutChanges(contestId: string, ratedAt: Date): Promise<boolean> {
    const claimed = await this.prisma.contest.updateMany({
      where: { id: contestId, ratedAt: null },
      data: { ratedAt },
    });
    return claimed.count > 0;
  }

  async findUserRating(userId: string): Promise<UserRatingView | null> {
    return this.prisma.userRating.findUnique({
      where: { userId },
      select: { rating: true, peakRating: true, contestsRated: true },
    });
  }

  async listHistory(userId: string, limit: number): Promise<RatingHistoryEntryView[]> {
    const rows = await this.prisma.contestRatingChange.findMany({
      where: { userId },
      orderBy: [{ contest: { endsAt: 'desc' } }, { createdAt: 'desc' }],
      take: limit,
      include: { contest: { select: { slug: true, title: true, endsAt: true } } },
    });
    return rows.reverse().map((row) => ({
      contestId: row.contestId,
      slug: row.contest.slug,
      title: row.contest.title,
      endsAt: row.contest.endsAt,
      rank: row.rank,
      oldRating: row.oldRating,
      newRating: row.newRating,
      delta: row.delta,
    }));
  }

  async listLeaderboard(
    scope: RatingLeaderboardScope,
    offset: number,
    limit: number,
  ): Promise<RatingLeaderboardPage> {
    const where: Prisma.UserRatingWhereInput = {
      contestsRated: { gt: 0 },
      user: scope.kind === 'tenant' ? { tenantId: scope.tenantId } : {},
    };
    const [rows, total] = await Promise.all([
      this.prisma.userRating.findMany({
        where,
        orderBy: [{ rating: 'desc' }, { peakRating: 'desc' }, { userId: 'asc' }],
        skip: offset,
        take: limit,
        include: {
          user: { select: { firstName: true, lastName: true, ...PUBLIC_HANDLE_SELECT } },
        },
      }),
      this.prisma.userRating.count({ where }),
    ]);
    return {
      total,
      rows: rows.map((row) => ({
        userId: row.userId,
        firstName: row.user.firstName,
        lastName: row.user.lastName,
        publicHandle: resolvePublicHandle(row.user),
        rating: row.rating,
        peakRating: row.peakRating,
        contestsRated: row.contestsRated,
      })),
    };
  }

  async findStandingRatings(contestId: string): Promise<Map<string, StandingRatingView>> {
    const rows = await this.prisma.contestRatingChange.findMany({
      where: { contestId },
      select: { userId: true, delta: true, newRating: true },
    });
    return new Map(rows.map((row) => [row.userId, { delta: row.delta, newRating: row.newRating }]));
  }
}
