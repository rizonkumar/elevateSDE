import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { IDailyChallengeRepository } from '../domain/interfaces/daily-challenge-repository.interface';
import { DailyChallenge } from '../domain/entities/daily-challenge';
import { StreakState } from '../domain/entities/streak-state';
import {
  DailyChallengeScheduleView,
  DailyChallengeView,
  StreakSummaryView,
} from '../domain/read-models/daily-challenge-view';
import { addDays, startOfUtcDay, toDateKey } from '../domain/daily-date';
import {
  NOTIFICATION_EVENTS,
  StreakMilestoneEvent,
} from '../../notification/domain/events/notification-events';

const STREAK_CALENDAR_DAYS = 119;
const GLOBAL_SCOPE: string | null = null;

function isStreakMilestone(streakDays: number): boolean {
  return streakDays === 3 || (streakDays >= 7 && streakDays % 7 === 0);
}

@Injectable()
export class DailyChallengeService {
  constructor(
    private readonly repository: IDailyChallengeRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async getToday(userId: string): Promise<DailyChallengeView | null> {
    return this.repository.findDailyView(startOfUtcDay(new Date()), GLOBAL_SCOPE, userId);
  }

  async getStreakSummary(userId: string): Promise<StreakSummaryView> {
    const state = await this.repository.findStreakState(userId);
    const today = startOfUtcDay(new Date());
    const from = addDays(today, -(STREAK_CALENDAR_DAYS - 1));
    const completionDates = await this.repository.listCompletionDates(userId, from, today);
    const completedKeys = new Set(completionDates.map(toDateKey));

    const calendar = Array.from({ length: STREAK_CALENDAR_DAYS }, (_, index) => {
      const date = addDays(from, index);
      return { date, completed: completedKeys.has(toDateKey(date)) };
    });

    return {
      current: state?.getStreakDays() ?? 0,
      longest: state?.getLongestStreak() ?? 0,
      lastActiveDate: state?.getLastActiveDate() ?? null,
      calendar,
    };
  }

  async registerCompletion(userId: string, problemId: string, submissionId: string): Promise<void> {
    const today = startOfUtcDay(new Date());
    const scheduled = await this.repository.findScheduledForDate(today, GLOBAL_SCOPE);
    if (!scheduled || scheduled.problemId !== problemId) {
      return;
    }
    if (await this.repository.hasCompletion(userId, scheduled.id)) {
      return;
    }
    await this.repository.recordCompletion(userId, scheduled.id, submissionId);
    const state =
      (await this.repository.findStreakState(userId)) ??
      StreakState.create({ streakDays: 0, longestStreak: 0, lastActiveDate: null });
    const updated = state.registerActivity(today);
    await this.repository.saveStreakState(userId, updated);
    if (isStreakMilestone(updated.getStreakDays())) {
      this.eventEmitter.emit(NOTIFICATION_EVENTS.STREAK_MILESTONE, {
        userId,
        streakDays: updated.getStreakDays(),
      } satisfies StreakMilestoneEvent);
    }
  }

  async listSchedule(from: Date, to: Date): Promise<DailyChallengeScheduleView[]> {
    return this.repository.listSchedule(startOfUtcDay(from), startOfUtcDay(to), GLOBAL_SCOPE);
  }

  async schedule(challengeDate: Date, problemId: string): Promise<DailyChallengeScheduleView> {
    const day = startOfUtcDay(challengeDate);
    const existing = await this.repository.findScheduledForDate(day, GLOBAL_SCOPE);
    if (existing) {
      throw new ConflictException('A daily challenge is already scheduled for that date');
    }
    const problem = await this.repository.findPublishedProblem(problemId);
    if (!problem) {
      throw new BadRequestException('Problem not found or not published');
    }
    const challenge = DailyChallenge.create({ challengeDate: day, problemId, tenantId: GLOBAL_SCOPE });
    await this.repository.schedule(challenge);
    return {
      id: challenge.getId(),
      challengeDate: day,
      problemId,
      problemTitle: problem.title,
      difficulty: problem.difficulty,
      completionCount: 0,
    };
  }

  async unschedule(id: string): Promise<void> {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundException('Daily challenge not found');
    }
    await this.repository.unschedule(id);
  }
}
