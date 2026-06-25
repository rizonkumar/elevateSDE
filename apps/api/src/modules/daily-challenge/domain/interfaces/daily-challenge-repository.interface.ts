import { DailyChallenge } from '../entities/daily-challenge';
import { StreakState } from '../entities/streak-state';
import {
  DailyChallengeScheduleView,
  DailyChallengeView,
  PublishedProblemRef,
  ScheduledChallengeRef,
} from '../read-models/daily-challenge-view';

export abstract class IDailyChallengeRepository {
  abstract findDailyView(
    challengeDate: Date,
    tenantId: string | null,
    userId: string,
  ): Promise<DailyChallengeView | null>;
  abstract findScheduledForDate(
    challengeDate: Date,
    tenantId: string | null,
  ): Promise<ScheduledChallengeRef | null>;
  abstract hasCompletion(userId: string, dailyChallengeId: string): Promise<boolean>;
  abstract recordCompletion(
    userId: string,
    dailyChallengeId: string,
    submissionId: string,
  ): Promise<void>;
  abstract findStreakState(userId: string): Promise<StreakState | null>;
  abstract saveStreakState(userId: string, state: StreakState): Promise<void>;
  abstract listCompletionDates(userId: string, from: Date, to: Date): Promise<Date[]>;
  abstract listSchedule(
    from: Date,
    to: Date,
    tenantId: string | null,
  ): Promise<DailyChallengeScheduleView[]>;
  abstract findById(id: string): Promise<DailyChallenge | null>;
  abstract findPublishedProblem(problemId: string): Promise<PublishedProblemRef | null>;
  abstract schedule(challenge: DailyChallenge): Promise<void>;
  abstract unschedule(id: string): Promise<void>;
}
