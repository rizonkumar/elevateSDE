import { ApiProperty } from '@nestjs/swagger';
import {
  AssessmentDifficulty,
  DashboardAssessmentStats,
  DashboardForumStats,
  DashboardJobTrackerStats,
  DashboardLeaderboardStats,
  DashboardRecentSubmission,
  DashboardStatsDto,
  JobApplicationStatus,
} from '@elevatesde/shared-types';

class DashboardJobTrackerStatsDto implements DashboardJobTrackerStats {
  @ApiProperty({ example: 12 })
  total!: number;

  @ApiProperty({
    example: { APPLIED: 5, OA: 2, INTERVIEW: 3, OFFER: 1, REJECTED: 1 },
  })
  byStatus!: Record<JobApplicationStatus, number>;

  @ApiProperty({ example: 2 })
  upcomingInterviews!: number;
}

class DashboardAssessmentStatsDto implements DashboardAssessmentStats {
  @ApiProperty({ example: 34 })
  problemsSolved!: number;

  @ApiProperty({ example: 41 })
  problemsAttempted!: number;

  @ApiProperty({ example: 87 })
  totalSubmissions!: number;

  @ApiProperty({ example: 64 })
  acceptanceRate!: number;

  @ApiProperty({ example: { EASY: 18, MEDIUM: 12, HARD: 4 } })
  byDifficulty!: Record<AssessmentDifficulty, number>;
}

class DashboardLeaderboardStatsDto implements DashboardLeaderboardStats {
  @ApiProperty({ example: 14, nullable: true })
  rank!: number | null;

  @ApiProperty({ example: 2840 })
  points!: number;

  @ApiProperty({ example: 12 })
  streakDays!: number;

  @ApiProperty({ example: ['System Design', 'Top Mentor'], type: [String] })
  badges!: string[];

  @ApiProperty({ example: 34 })
  assessmentsCompleted!: number;
}

class DashboardForumStatsDto implements DashboardForumStats {
  @ApiProperty({ example: 8 })
  postsCreated!: number;

  @ApiProperty({ example: 23 })
  commentsPosted!: number;

  @ApiProperty({ example: 57 })
  upvotesReceived!: number;
}

class DashboardRecentSubmissionDto implements DashboardRecentSubmission {
  @ApiProperty({ example: 'Two Sum' })
  problemTitle!: string;

  @ApiProperty({ example: 'EASY' })
  difficulty!: AssessmentDifficulty;

  @ApiProperty({ example: 'ACCEPTED' })
  status!: string;

  @ApiProperty({ example: 8 })
  passedCount!: number;

  @ApiProperty({ example: 8 })
  totalCount!: number;

  @ApiProperty({ example: '2026-06-20T09:30:00.000Z' })
  createdAt!: string;
}

export class DashboardStatsResponseDto implements DashboardStatsDto {
  @ApiProperty({ type: DashboardJobTrackerStatsDto })
  jobTracker!: DashboardJobTrackerStatsDto;

  @ApiProperty({ type: DashboardAssessmentStatsDto })
  assessments!: DashboardAssessmentStatsDto;

  @ApiProperty({ type: DashboardLeaderboardStatsDto })
  leaderboard!: DashboardLeaderboardStatsDto;

  @ApiProperty({ type: DashboardForumStatsDto })
  forum!: DashboardForumStatsDto;

  @ApiProperty({ type: [DashboardRecentSubmissionDto] })
  recentSubmissions!: DashboardRecentSubmissionDto[];
}
