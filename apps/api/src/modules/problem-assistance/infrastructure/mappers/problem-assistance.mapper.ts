import {
  ProblemAssistance as PrismaProblemAssistance,
  ProblemEditorial as PrismaProblemEditorial,
} from '@prisma/client';
import { ProblemAssistance } from '../../domain/entities/problem-assistance';
import { ProblemEditorialContent } from '../../domain/read-models/problem-guidance';

export class ProblemAssistanceMapper {
  static toDomain(record: PrismaProblemAssistance): ProblemAssistance {
    return ProblemAssistance.reconstitute({
      userId: record.userId,
      problemId: record.problemId,
      hintsRevealed: record.hintsRevealed,
      editorialUnlockedAt: record.editorialUnlockedAt,
      editorialUnlockReason: record.editorialUnlockReason,
    });
  }

  static toEditorialContent(record: PrismaProblemEditorial): ProblemEditorialContent {
    return {
      approach: record.approach,
      timeComplexity: record.timeComplexity,
      spaceComplexity: record.spaceComplexity,
      isPublished: record.isPublished,
      updatedAt: record.updatedAt,
    };
  }
}
