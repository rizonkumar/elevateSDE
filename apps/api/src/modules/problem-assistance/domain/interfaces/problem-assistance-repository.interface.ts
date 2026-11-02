import { EditorialUnlockReason } from '@prisma/client';
import { ProblemAssistance } from '../entities/problem-assistance';
import {
  EditorialWriteInput,
  ProblemEditorialContent,
  ProblemHintContent,
} from '../read-models/problem-guidance';

export abstract class IProblemAssistanceRepository {
  abstract findAssistance(userId: string, problemId: string): Promise<ProblemAssistance | null>;
  abstract countHints(problemId: string): Promise<number>;
  abstract findHints(problemId: string, limit: number): Promise<ProblemHintContent[]>;
  abstract findEditorial(problemId: string): Promise<ProblemEditorialContent | null>;
  abstract revealNextHint(
    userId: string,
    problemId: string,
    expectedRevealed: number,
  ): Promise<boolean>;
  abstract unlockEditorial(
    userId: string,
    problemId: string,
    reason: EditorialUnlockReason,
    unlockedAt: Date,
  ): Promise<void>;
  abstract isLockedByLiveContest(userId: string, problemId: string, now: Date): Promise<boolean>;
  abstract replaceHints(problemId: string, hints: string[]): Promise<void>;
  abstract upsertEditorial(problemId: string, input: EditorialWriteInput): Promise<void>;
}
