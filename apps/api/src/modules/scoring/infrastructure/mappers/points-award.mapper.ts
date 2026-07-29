import { Prisma } from '@prisma/client';
import { PointsAward } from '../../domain/entities/points-award';

export class PointsAwardMapper {
  static toPersistence(award: PointsAward): Prisma.PointsAwardCreateManyInput {
    return {
      id: award.getId(),
      userId: award.getUserId(),
      source: award.getSource(),
      sourceRef: award.getSourceRef(),
      points: award.getPoints(),
      awardedAt: award.getAwardedAt(),
    };
  }
}
