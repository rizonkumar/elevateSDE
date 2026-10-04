import { AssessmentDifficulty } from '@prisma/client';
import { PointAward } from '../entities/point-award';

export abstract class IPointLedgerRepository {
  abstract award(award: PointAward): Promise<boolean>;
  abstract findProblemDifficulty(problemId: string): Promise<AssessmentDifficulty | null>;
  abstract resetWeeklyPoints(): Promise<number>;
  abstract resetMonthlyPoints(): Promise<number>;
}
