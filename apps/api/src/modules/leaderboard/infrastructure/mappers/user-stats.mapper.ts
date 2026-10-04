import { UserStats as PrismaUserStats } from '@prisma/client';
import { UserStats } from '../../domain/entities/user-stats';

export class UserStatsMapper {
  static toDomain(record: Pick<PrismaUserStats, 'userId' | 'badges'>): UserStats {
    return UserStats.reconstitute(record.userId, { badges: record.badges });
  }
}
