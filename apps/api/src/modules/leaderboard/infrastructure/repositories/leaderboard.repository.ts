import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { LeaderboardTimeframe } from '@elevatesde/shared-types';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { ILeaderboardRepository } from '../../domain/interfaces/leaderboard-repository.interface';
import { UserStats } from '../../domain/entities/user-stats';
import { LeaderboardEntryView } from '../../domain/read-models/leaderboard-entry-view';
import { UserStatsMapper } from '../mappers/user-stats.mapper';

const pointsColumn: Record<LeaderboardTimeframe, keyof Prisma.UserStatsOrderByWithRelationInput> = {
  'all-time': 'points',
  monthly: 'monthlyPoints',
  weekly: 'weeklyPoints',
};

@Injectable()
export class LeaderboardRepository implements ILeaderboardRepository {
  constructor(private readonly prisma: PrismaService) {}

  async listByTimeframe(timeframe: LeaderboardTimeframe): Promise<LeaderboardEntryView[]> {
    const column = pointsColumn[timeframe];
    const records = await this.prisma.userStats.findMany({
      orderBy: [{ [column]: 'desc' }, { assessmentsCompleted: 'desc' }],
      include: {
        user: { select: { firstName: true, lastName: true, headline: true } },
      },
    });
    return records.map((record) => ({
      userId: record.userId,
      firstName: record.user.firstName,
      lastName: record.user.lastName,
      headline: record.user.headline,
      points: selectPoints(record, timeframe),
      assessmentsCompleted: record.assessmentsCompleted,
      badges: record.badges,
      streakDays: record.streakDays,
    }));
  }

  async findByUser(userId: string): Promise<UserStats | null> {
    const record = await this.prisma.userStats.findUnique({ where: { userId } });
    if (!record) {
      return null;
    }
    return UserStatsMapper.toDomain(record);
  }

  async save(stats: UserStats): Promise<void> {
    const data = UserStatsMapper.toPersistence(stats);
    await this.prisma.userStats.upsert({
      where: { userId: data.userId },
      update: {
        points: data.points,
        monthlyPoints: data.monthlyPoints,
        weeklyPoints: data.weeklyPoints,
        assessmentsCompleted: data.assessmentsCompleted,
        badges: data.badges,
        streakDays: data.streakDays,
      },
      create: data,
    });
  }
}

function selectPoints(
  record: { points: number; monthlyPoints: number; weeklyPoints: number },
  timeframe: LeaderboardTimeframe,
): number {
  if (timeframe === 'monthly') {
    return record.monthlyPoints;
  }
  if (timeframe === 'weekly') {
    return record.weeklyPoints;
  }
  return record.points;
}
