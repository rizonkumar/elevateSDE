import { DailyChallenge as PrismaDailyChallenge } from '@prisma/client';
import { DailyChallenge } from '../../domain/entities/daily-challenge';

export class DailyChallengeMapper {
  static toDomain(record: PrismaDailyChallenge): DailyChallenge {
    return DailyChallenge.reconstitute({
      id: record.id,
      challengeDate: record.challengeDate,
      problemId: record.problemId,
      tenantId: record.tenantId,
      createdAt: record.createdAt,
    });
  }

  static toPersistence(
    challenge: DailyChallenge,
  ): Pick<PrismaDailyChallenge, 'id' | 'challengeDate' | 'problemId' | 'tenantId'> {
    return {
      id: challenge.getId(),
      challengeDate: challenge.getChallengeDate(),
      problemId: challenge.getProblemId(),
      tenantId: challenge.getTenantId(),
    };
  }
}
