import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { EditorialUnlockReason } from '@prisma/client';
import { ProblemService } from '../../problem/application/problem.service';
import { Problem } from '../../problem/domain/entities/problem';
import { IProblemAssistanceRepository } from '../domain/interfaces/problem-assistance-repository.interface';
import { ProblemAssistance } from '../domain/entities/problem-assistance';
import {
  EditorialWriteInput,
  ProblemEditorialContent,
  ProblemHintContent,
} from '../domain/read-models/problem-guidance';
import { ProblemAssistanceService } from './problem-assistance.service';

const USER = 'user-1';
const PROBLEM = 'problem-1';
const REFERENCE = { python: 'def solve(): pass' };

interface AssistanceState {
  hintsRevealed: number;
  editorialUnlockedAt: Date | null;
  editorialUnlockReason: EditorialUnlockReason | null;
}

class FakeAssistanceRepository implements IProblemAssistanceRepository {
  hints: string[] = ['first', 'second', 'third'];
  editorial: ProblemEditorialContent | null = {
    approach: 'Use a hash map.',
    timeComplexity: 'O(n)',
    spaceComplexity: 'O(n)',
    isPublished: true,
    updatedAt: new Date('2026-11-01T00:00:00.000Z'),
  };
  states = new Map<string, AssistanceState>();
  contestLocked = false;

  async findAssistance(userId: string, problemId: string): Promise<ProblemAssistance | null> {
    const state = this.states.get(`${userId}:${problemId}`);
    return state ? ProblemAssistance.reconstitute({ userId, problemId, ...state }) : null;
  }

  async countHints(): Promise<number> {
    return this.hints.length;
  }

  async findHints(_problemId: string, limit: number): Promise<ProblemHintContent[]> {
    return this.hints
      .slice(0, Math.max(limit, 0))
      .map((content, index) => ({ ordinal: index + 1, content }));
  }

  async findEditorial(): Promise<ProblemEditorialContent | null> {
    return this.editorial;
  }

  async revealNextHint(
    userId: string,
    problemId: string,
    expectedRevealed: number,
  ): Promise<boolean> {
    const state = this.ensure(userId, problemId);
    if (state.hintsRevealed !== expectedRevealed) {
      return false;
    }
    state.hintsRevealed += 1;
    return true;
  }

  async unlockEditorial(
    userId: string,
    problemId: string,
    reason: EditorialUnlockReason,
    unlockedAt: Date,
  ): Promise<void> {
    const state = this.ensure(userId, problemId);
    if (state.editorialUnlockedAt === null) {
      state.editorialUnlockedAt = unlockedAt;
      state.editorialUnlockReason = reason;
    }
  }

  async isLockedByLiveContest(): Promise<boolean> {
    return this.contestLocked;
  }

  async replaceHints(_problemId: string, hints: string[]): Promise<void> {
    this.hints = hints;
  }

  async upsertEditorial(_problemId: string, input: EditorialWriteInput): Promise<void> {
    this.editorial = { ...input, updatedAt: new Date() };
  }

  private ensure(userId: string, problemId: string): AssistanceState {
    const key = `${userId}:${problemId}`;
    const existing = this.states.get(key);
    if (existing) {
      return existing;
    }
    const created: AssistanceState = {
      hintsRevealed: 0,
      editorialUnlockedAt: null,
      editorialUnlockReason: null,
    };
    this.states.set(key, created);
    return created;
  }
}

function buildService(): {
  service: ProblemAssistanceService;
  repository: FakeAssistanceRepository;
} {
  const repository = new FakeAssistanceRepository();
  const problem = { getReferenceSolution: () => REFERENCE } as unknown as Problem;
  const problemService = {
    getById: jest.fn().mockResolvedValue(problem),
    getByIdForAdmin: jest.fn().mockResolvedValue(problem),
  } as unknown as ProblemService;
  return { service: new ProblemAssistanceService(repository, problemService), repository };
}

describe('ProblemAssistanceService', () => {
  it('starts with no hints revealed and a locked editorial', async () => {
    const { service } = buildService();

    const view = await service.getAssistance(USER, PROBLEM);

    expect(view.totalHints).toBe(3);
    expect(view.hints).toEqual([]);
    expect(view.editorial).toBe('LOCKED');
    expect(view.unlockReason).toBeNull();
  });

  it('reveals hints one at a time in order', async () => {
    const { service } = buildService();

    await service.revealNextHint(USER, PROBLEM);
    const view = await service.revealNextHint(USER, PROBLEM);

    expect(view.hints.map((hint) => hint.content)).toEqual(['first', 'second']);
  });

  it('never skips a hint when two reveals race', async () => {
    const { service } = buildService();

    await Promise.all([
      service.revealNextHint(USER, PROBLEM),
      service.revealNextHint(USER, PROBLEM),
    ]);
    const view = await service.getAssistance(USER, PROBLEM);

    expect(view.hints.map((hint) => hint.ordinal)).toEqual([1]);
  });

  it('rejects a reveal once every hint is shown', async () => {
    const { service, repository } = buildService();
    repository.hints = ['only'];

    await service.revealNextHint(USER, PROBLEM);

    await expect(service.revealNextHint(USER, PROBLEM)).rejects.toBeInstanceOf(ConflictException);
  });

  it('keeps the editorial locked until the user solves or gives up', async () => {
    const { service } = buildService();

    await expect(service.getEditorial(USER, PROBLEM)).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('unlocks the editorial with the reference solutions after giving up', async () => {
    const { service } = buildService();

    const view = await service.giveUp(USER, PROBLEM);
    const editorial = await service.getEditorial(USER, PROBLEM);

    expect(view.editorial).toBe('UNLOCKED');
    expect(editorial.unlockReason).toBe(EditorialUnlockReason.GAVE_UP);
    expect(editorial.solutions).toEqual(REFERENCE);
    expect(await service.isAssisted(USER, PROBLEM)).toBe(true);
  });

  it('keeps the first unlock reason when the user solves after giving up', async () => {
    const { service } = buildService();

    await service.giveUp(USER, PROBLEM);
    await service.recordSolved(USER, PROBLEM);

    expect((await service.getAssistance(USER, PROBLEM)).unlockReason).toBe(
      EditorialUnlockReason.GAVE_UP,
    );
  });

  it('does not treat a solve as assisted', async () => {
    const { service } = buildService();

    await service.recordSolved(USER, PROBLEM);
    await service.giveUp(USER, PROBLEM);

    expect(await service.isAssisted(USER, PROBLEM)).toBe(false);
    expect((await service.getEditorial(USER, PROBLEM)).unlockReason).toBe(
      EditorialUnlockReason.SOLVED,
    );
  });

  it('refuses to give up when there is no published editorial', async () => {
    const { service, repository } = buildService();
    repository.editorial = null;

    await expect(service.giveUp(USER, PROBLEM)).rejects.toBeInstanceOf(NotFoundException);
    expect((await service.getAssistance(USER, PROBLEM)).editorial).toBe('UNAVAILABLE');
  });

  it('hides hints and the editorial during a live contest', async () => {
    const { service, repository } = buildService();
    await service.revealNextHint(USER, PROBLEM);
    await service.recordSolved(USER, PROBLEM);
    repository.contestLocked = true;

    const view = await service.getAssistance(USER, PROBLEM);

    expect(view.lockedByContest).toBe(true);
    expect(view.hints).toEqual([]);
    expect(view.editorial).toBe('LOCKED');
    await expect(service.revealNextHint(USER, PROBLEM)).rejects.toBeInstanceOf(ForbiddenException);
    await expect(service.giveUp(USER, PROBLEM)).rejects.toBeInstanceOf(ForbiddenException);
    await expect(service.getEditorial(USER, PROBLEM)).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('trims and validates admin hints', async () => {
    const { service } = buildService();

    const view = await service.saveHints(PROBLEM, ['  one  ', 'two']);

    expect(view.hints).toEqual(['one', 'two']);
    await expect(service.saveHints(PROBLEM, ['ok', '   '])).rejects.toBeInstanceOf(
      BadRequestException,
    );
    await expect(service.saveHints(PROBLEM, ['1', '2', '3', '4', '5', '6'])).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('rejects an editorial with blank complexity', async () => {
    const { service } = buildService();

    await expect(
      service.saveEditorial(PROBLEM, {
        approach: 'Scan once.',
        timeComplexity: ' ',
        spaceComplexity: 'O(1)',
        isPublished: true,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
