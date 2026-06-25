import { AssessmentDifficulty } from '@prisma/client';

export interface DailyChallengeProblemView {
  id: string;
  title: string;
  difficulty: AssessmentDifficulty;
  tags: string[];
  timeLimitMinutes: number;
}

export interface DailyChallengeView {
  id: string;
  challengeDate: Date;
  problem: DailyChallengeProblemView;
  completed: boolean;
}

export interface ScheduledChallengeRef {
  id: string;
  problemId: string;
}

export interface DailyChallengeScheduleView {
  id: string;
  challengeDate: Date;
  problemId: string;
  problemTitle: string;
  difficulty: AssessmentDifficulty;
  completionCount: number;
}

export interface StreakCalendarCell {
  date: Date;
  completed: boolean;
}

export interface StreakSummaryView {
  current: number;
  longest: number;
  lastActiveDate: Date | null;
  calendar: StreakCalendarCell[];
}

export interface PublishedProblemRef {
  id: string;
  title: string;
  difficulty: AssessmentDifficulty;
}
