import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AssessmentDifficulty } from '@prisma/client';
import { DailyChallengeService } from './daily-challenge.service';
import { IDailyChallengeRepository } from '../domain/interfaces/daily-challenge-repository.interface';
import { DailyChallenge } from '../domain/entities/daily-challenge';
import { StreakState } from '../domain/entities/streak-state';
import {
  DailyChallengeScheduleView,
  DailyChallengeView,
  PublishedProblemRef,
  ScheduledChallengeRef,
} from '../domain/read-models/daily-challenge-view';
import { addDays, startOfUtcDay } from '../domain/daily-date';

const USER_ID = 'user-1';
const PROBLEM_ID = 'problem-1';
const CHALLENGE_ID = 'challenge-1';

class FakeDailyChallengeRepository implements IDailyChallengeRepository {
  scheduled: ScheduledChallengeRef | null = null;
  dailyView: DailyChallengeView | null = null;
  completed = new Set<string>();
  recordedCompletions: Array<{ userId: string; dailyChallengeId: string; submissionId: string }> = [];
  streak: StreakState | null = null;
  savedStreak: StreakState | null = null;
  completionDates: Date[] = [];
  scheduleViews: DailyChallengeScheduleView[] = [];
  scheduled_ids = new Set<string>();
  publishedProblems = new Map<string, PublishedProblemRef>();
  scheduledChallenges: DailyChallenge[] = [];

  async findDailyView(): Promise<DailyChallengeView | null> {
    return this.dailyView;
  }

  async findScheduledForDate(): Promise<ScheduledChallengeRef | null> {
    return this.scheduled;
  }

  async hasCompletion(userId: string, dailyChallengeId: string): Promise<boolean> {
    return this.completed.has(`${userId}:${dailyChallengeId}`);
  }

  async recordCompletion(
    userId: string,
    dailyChallengeId: string,
    submissionId: string,
  ): Promise<void> {
    this.recordedCompletions.push({ userId, dailyChallengeId, submissionId });
    this.completed.add(`${userId}:${dailyChallengeId}`);
  }

  async findStreakState(): Promise<StreakState | null> {
    return this.streak;
  }

  async saveStreakState(_userId: string, state: StreakState): Promise<void> {
    this.savedStreak = state;
  }

  async listCompletionDates(): Promise<Date[]> {
    return this.completionDates;
  }

  async listSchedule(): Promise<DailyChallengeScheduleView[]> {
    return this.scheduleViews;
  }

  async findById(id: string): Promise<DailyChallenge | null> {
    return this.scheduled_ids.has(id)
      ? DailyChallenge.reconstitute({
          id,
          challengeDate: startOfUtcDay(new Date()),
          problemId: PROBLEM_ID,
          tenantId: null,
          createdAt: new Date(),
        })
      : null;
  }

  async findPublishedProblem(problemId: string): Promise<PublishedProblemRef | null> {
    return this.publishedProblems.get(problemId) ?? null;
  }

  async schedule(challenge: DailyChallenge): Promise<void> {
    this.scheduledChallenges.push(challenge);
  }

  async unschedule(id: string): Promise<void> {
    this.scheduled_ids.delete(id);
  }
}

describe('DailyChallengeService', () => {
  let repository: FakeDailyChallengeRepository;
  let service: DailyChallengeService;

  beforeEach(() => {
    repository = new FakeDailyChallengeRepository();
    service = new DailyChallengeService(repository, new EventEmitter2());
  });

  describe('getStreakSummary', () => {
    it('returns a full calendar window with completed cells flagged', async () => {
      const today = startOfUtcDay(new Date());
      repository.streak = StreakState.create({
        streakDays: 3,
        longestStreak: 9,
        lastActiveDate: today,
      });
      repository.completionDates = [today];

      const summary = await service.getStreakSummary(USER_ID);

      expect(summary.current).toBe(3);
      expect(summary.longest).toBe(9);
      expect(summary.calendar).toHaveLength(119);
      expect(summary.calendar[summary.calendar.length - 1]).toEqual({ date: today, completed: true });
    });

    it('defaults to a zeroed streak when no stats exist', async () => {
      const summary = await service.getStreakSummary(USER_ID);
      expect(summary.current).toBe(0);
      expect(summary.longest).toBe(0);
      expect(summary.lastActiveDate).toBeNull();
    });
  });

  describe('registerCompletion', () => {
    it('does nothing when no challenge is scheduled for today', async () => {
      await service.registerCompletion(USER_ID, PROBLEM_ID, 'submission-1');
      expect(repository.recordedCompletions).toHaveLength(0);
      expect(repository.savedStreak).toBeNull();
    });

    it('ignores submissions for a problem that is not today challenge', async () => {
      repository.scheduled = { id: CHALLENGE_ID, problemId: 'other-problem' };
      await service.registerCompletion(USER_ID, PROBLEM_ID, 'submission-1');
      expect(repository.recordedCompletions).toHaveLength(0);
    });

    it('records the completion and advances the streak from yesterday', async () => {
      const today = startOfUtcDay(new Date());
      repository.scheduled = { id: CHALLENGE_ID, problemId: PROBLEM_ID };
      repository.streak = StreakState.create({
        streakDays: 4,
        longestStreak: 4,
        lastActiveDate: addDays(today, -1),
      });

      await service.registerCompletion(USER_ID, PROBLEM_ID, 'submission-1');

      expect(repository.recordedCompletions).toEqual([
        { userId: USER_ID, dailyChallengeId: CHALLENGE_ID, submissionId: 'submission-1' },
      ]);
      expect(repository.savedStreak?.getStreakDays()).toBe(5);
      expect(repository.savedStreak?.getLongestStreak()).toBe(5);
    });

    it('does not double-count an already completed challenge', async () => {
      repository.scheduled = { id: CHALLENGE_ID, problemId: PROBLEM_ID };
      repository.completed.add(`${USER_ID}:${CHALLENGE_ID}`);

      await service.registerCompletion(USER_ID, PROBLEM_ID, 'submission-1');

      expect(repository.recordedCompletions).toHaveLength(0);
      expect(repository.savedStreak).toBeNull();
    });
  });

  describe('schedule', () => {
    it('rejects a date that already has a challenge', async () => {
      repository.scheduled = { id: CHALLENGE_ID, problemId: PROBLEM_ID };
      await expect(service.schedule(new Date(), PROBLEM_ID)).rejects.toBeInstanceOf(ConflictException);
    });

    it('rejects a problem that is not published', async () => {
      await expect(service.schedule(new Date(), PROBLEM_ID)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('persists and returns the scheduled challenge view', async () => {
      repository.publishedProblems.set(PROBLEM_ID, {
        id: PROBLEM_ID,
        title: 'Two Sum',
        difficulty: AssessmentDifficulty.EASY,
      });

      const view = await service.schedule(new Date('2026-06-25'), PROBLEM_ID);

      expect(view.problemTitle).toBe('Two Sum');
      expect(view.completionCount).toBe(0);
      expect(repository.scheduledChallenges).toHaveLength(1);
    });
  });

  describe('unschedule', () => {
    it('throws when the challenge does not exist', async () => {
      await expect(service.unschedule('missing')).rejects.toBeInstanceOf(NotFoundException);
    });

    it('removes an existing challenge', async () => {
      repository.scheduled_ids.add(CHALLENGE_ID);
      await service.unschedule(CHALLENGE_ID);
      expect(repository.scheduled_ids.has(CHALLENGE_ID)).toBe(false);
    });
  });
});

describe('StreakState', () => {
  it('resets to one after a gap', () => {
    const today = startOfUtcDay(new Date());
    const state = StreakState.create({
      streakDays: 6,
      longestStreak: 6,
      lastActiveDate: addDays(today, -3),
    });
    const next = state.registerActivity(today);
    expect(next.getStreakDays()).toBe(1);
    expect(next.getLongestStreak()).toBe(6);
  });

  it('is a no-op when activity is on the same day', () => {
    const today = startOfUtcDay(new Date());
    const state = StreakState.create({ streakDays: 5, longestStreak: 5, lastActiveDate: today });
    expect(state.registerActivity(today)).toBe(state);
  });
});
