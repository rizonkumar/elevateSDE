import { AssessmentDifficulty, JobApplicationStatus } from '@elevatesde/shared-types';

export interface DashboardJobTrackerView {
  total: number;
  byStatus: Record<JobApplicationStatus, number>;
  upcomingInterviews: number;
}

export interface DashboardAssessmentView {
  problemsSolved: number;
  problemsAttempted: number;
  totalSubmissions: number;
  acceptanceRate: number;
  byDifficulty: Record<AssessmentDifficulty, number>;
}

export interface DashboardLeaderboardView {
  rank: number | null;
  points: number;
  streakDays: number;
  badges: string[];
  assessmentsCompleted: number;
}

export interface DashboardForumView {
  postsCreated: number;
  commentsPosted: number;
  upvotesReceived: number;
}

export interface DashboardRecentSubmissionView {
  problemTitle: string;
  difficulty: AssessmentDifficulty;
  status: string;
  passedCount: number;
  totalCount: number;
  createdAt: Date;
}

export interface DashboardStatsView {
  jobTracker: DashboardJobTrackerView;
  assessments: DashboardAssessmentView;
  leaderboard: DashboardLeaderboardView;
  forum: DashboardForumView;
  recentSubmissions: DashboardRecentSubmissionView[];
}
