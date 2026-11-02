import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EditorialUnlockReason } from '@prisma/client';
import { ProblemService } from '../../problem/application/problem.service';
import { IProblemAssistanceRepository } from '../domain/interfaces/problem-assistance-repository.interface';
import { ProblemAssistance } from '../domain/entities/problem-assistance';
import {
  EditorialAvailability,
  EditorialWriteInput,
  ProblemAssistanceView,
  ProblemEditorialContent,
  ProblemEditorialView,
  ProblemGuidanceAdminView,
} from '../domain/read-models/problem-guidance';
import {
  MAX_APPROACH_LENGTH,
  MAX_COMPLEXITY_LENGTH,
  MAX_HINT_LENGTH,
  MAX_HINTS_PER_PROBLEM,
} from '../domain/policies/guidance-limits';

const CONTEST_LOCK_MESSAGE = 'Hints and editorials are unavailable during a live contest.';

@Injectable()
export class ProblemAssistanceService {
  constructor(
    private readonly repository: IProblemAssistanceRepository,
    private readonly problemService: ProblemService,
  ) {}

  async getAssistance(userId: string, problemId: string): Promise<ProblemAssistanceView> {
    await this.problemService.getById(problemId);
    return this.buildView(userId, problemId);
  }

  async revealNextHint(userId: string, problemId: string): Promise<ProblemAssistanceView> {
    await this.problemService.getById(problemId);
    await this.assertNotContestLocked(userId, problemId);
    const totalHints = await this.repository.countHints(problemId);
    const assistance = await this.loadAssistance(userId, problemId);
    if (!assistance.hasHintLeft(totalHints)) {
      throw new ConflictException('All hints for this problem are already revealed.');
    }
    await this.repository.revealNextHint(userId, problemId, assistance.getHintsRevealed());
    return this.buildView(userId, problemId);
  }

  async giveUp(userId: string, problemId: string): Promise<ProblemAssistanceView> {
    await this.problemService.getById(problemId);
    await this.assertNotContestLocked(userId, problemId);
    const editorial = await this.repository.findEditorial(problemId);
    if (!editorial?.isPublished) {
      throw new NotFoundException('This problem does not have an editorial yet.');
    }
    await this.repository.unlockEditorial(
      userId,
      problemId,
      EditorialUnlockReason.GAVE_UP,
      new Date(),
    );
    return this.buildView(userId, problemId);
  }

  async getEditorial(userId: string, problemId: string): Promise<ProblemEditorialView> {
    const problem = await this.problemService.getById(problemId);
    await this.assertNotContestLocked(userId, problemId);
    const editorial = await this.repository.findEditorial(problemId);
    if (!editorial?.isPublished) {
      throw new NotFoundException('This problem does not have an editorial yet.');
    }
    const assistance = await this.loadAssistance(userId, problemId);
    const unlockReason = assistance.getEditorialUnlockReason();
    if (!unlockReason) {
      throw new ForbiddenException('Solve the problem or give up to view the editorial.');
    }
    return {
      problemId,
      approach: editorial.approach,
      timeComplexity: editorial.timeComplexity,
      spaceComplexity: editorial.spaceComplexity,
      solutions: problem.getReferenceSolution(),
      unlockReason,
      updatedAt: editorial.updatedAt,
    };
  }

  async recordSolved(userId: string, problemId: string): Promise<void> {
    await this.repository.unlockEditorial(
      userId,
      problemId,
      EditorialUnlockReason.SOLVED,
      new Date(),
    );
  }

  async isLockedByContest(userId: string, problemId: string): Promise<boolean> {
    return this.repository.isLockedByLiveContest(userId, problemId, new Date());
  }

  async isAssisted(userId: string, problemId: string): Promise<boolean> {
    const assistance = await this.repository.findAssistance(userId, problemId);
    return assistance?.gaveUp() ?? false;
  }

  async getGuidanceForAdmin(problemId: string): Promise<ProblemGuidanceAdminView> {
    await this.problemService.getByIdForAdmin(problemId);
    return this.buildAdminView(problemId);
  }

  async saveEditorial(
    problemId: string,
    input: EditorialWriteInput,
  ): Promise<ProblemGuidanceAdminView> {
    await this.problemService.getByIdForAdmin(problemId);
    await this.repository.upsertEditorial(problemId, normalizeEditorial(input));
    return this.buildAdminView(problemId);
  }

  async saveHints(problemId: string, hints: string[]): Promise<ProblemGuidanceAdminView> {
    await this.problemService.getByIdForAdmin(problemId);
    await this.repository.replaceHints(problemId, normalizeHints(hints));
    return this.buildAdminView(problemId);
  }

  private async buildView(userId: string, problemId: string): Promise<ProblemAssistanceView> {
    const [totalHints, assistance, editorial, lockedByContest] = await Promise.all([
      this.repository.countHints(problemId),
      this.loadAssistance(userId, problemId),
      this.repository.findEditorial(problemId),
      this.repository.isLockedByLiveContest(userId, problemId, new Date()),
    ]);
    const hints = lockedByContest
      ? []
      : await this.repository.findHints(problemId, assistance.visibleHintCount(totalHints));
    return {
      problemId,
      totalHints,
      hints,
      editorial: editorialAvailability(editorial, assistance, lockedByContest),
      unlockReason: assistance.getEditorialUnlockReason(),
      lockedByContest,
    };
  }

  private async buildAdminView(problemId: string): Promise<ProblemGuidanceAdminView> {
    const [editorial, hints] = await Promise.all([
      this.repository.findEditorial(problemId),
      this.repository.findHints(problemId, MAX_HINTS_PER_PROBLEM),
    ]);
    return { problemId, editorial, hints: hints.map((hint) => hint.content) };
  }

  private async loadAssistance(userId: string, problemId: string): Promise<ProblemAssistance> {
    const assistance = await this.repository.findAssistance(userId, problemId);
    return assistance ?? ProblemAssistance.untouched(userId, problemId);
  }

  private async assertNotContestLocked(userId: string, problemId: string): Promise<void> {
    if (await this.repository.isLockedByLiveContest(userId, problemId, new Date())) {
      throw new ForbiddenException(CONTEST_LOCK_MESSAGE);
    }
  }
}

function editorialAvailability(
  editorial: ProblemEditorialContent | null,
  assistance: ProblemAssistance,
  lockedByContest: boolean,
): EditorialAvailability {
  if (!editorial?.isPublished) {
    return 'UNAVAILABLE';
  }
  if (lockedByContest || !assistance.isEditorialUnlocked()) {
    return 'LOCKED';
  }
  return 'UNLOCKED';
}

function normalizeEditorial(input: EditorialWriteInput): EditorialWriteInput {
  const approach = input.approach.trim();
  const timeComplexity = input.timeComplexity.trim();
  const spaceComplexity = input.spaceComplexity.trim();
  if (!approach || !timeComplexity || !spaceComplexity) {
    throw new BadRequestException('Approach, time complexity and space complexity are required.');
  }
  if (approach.length > MAX_APPROACH_LENGTH) {
    throw new BadRequestException(`Approach must be at most ${MAX_APPROACH_LENGTH} characters.`);
  }
  if (
    timeComplexity.length > MAX_COMPLEXITY_LENGTH ||
    spaceComplexity.length > MAX_COMPLEXITY_LENGTH
  ) {
    throw new BadRequestException(
      `Complexity values must be at most ${MAX_COMPLEXITY_LENGTH} characters.`,
    );
  }
  return { approach, timeComplexity, spaceComplexity, isPublished: input.isPublished };
}

function normalizeHints(hints: string[]): string[] {
  const cleaned = hints.map((hint) => hint.trim());
  if (cleaned.length > MAX_HINTS_PER_PROBLEM) {
    throw new BadRequestException(`A problem can have at most ${MAX_HINTS_PER_PROBLEM} hints.`);
  }
  if (cleaned.some((hint) => hint.length === 0)) {
    throw new BadRequestException('Hints cannot be empty.');
  }
  if (cleaned.some((hint) => hint.length > MAX_HINT_LENGTH)) {
    throw new BadRequestException(`Each hint must be at most ${MAX_HINT_LENGTH} characters.`);
  }
  return cleaned;
}
