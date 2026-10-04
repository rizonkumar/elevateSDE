import { AssessmentDifficulty } from '@prisma/client';
import { PointAward } from '../entities/point-award';
import { PointPeriod } from '../point-periods';

export abstract class IPointLedgerRepository {
  abstract award(award: PointAward): Promise<boolean>;
  abstract adjustTo(userId: string, targetPoints: number, adjustmentId: string): Promise<boolean>;
  abstract findProblemDifficulty(problemId: string): Promise<AssessmentDifficulty | null>;
  abstract recalculatePeriodTotals(period: PointPeriod, since: Date): Promise<number>;
}
