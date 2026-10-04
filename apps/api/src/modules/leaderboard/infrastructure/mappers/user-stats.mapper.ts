import { UserStats as PrismaUserStats } from '@prisma/client';
import { UserStats } from '../../domain/entities/user-stats';

export class UserStatsMapper {
  static toDomain(record: PrismaUserStats): UserStats {
    return UserStats.reconstitute(record.userId, {
      points: record.points,
      monthlyPoints: record.monthlyPoints,
      weeklyPoints: record.weeklyPoints,
      assessmentsCompleted: record.assessmentsCompleted,
      badges: record.badges,
      streakDays: record.streakDays,
    });
  }
}
