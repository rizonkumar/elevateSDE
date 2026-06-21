import { DashboardStatsView } from '../../domain/read-models/dashboard-stats-view';
import { DashboardStatsResponseDto } from '../dtos/dashboard-stats-response.dto';

export class DashboardPresentationMapper {
  static toResponse(view: DashboardStatsView): DashboardStatsResponseDto {
    const dto = new DashboardStatsResponseDto();
    dto.jobTracker = {
      total: view.jobTracker.total,
      byStatus: view.jobTracker.byStatus,
      upcomingInterviews: view.jobTracker.upcomingInterviews,
    };
    dto.assessments = {
      problemsSolved: view.assessments.problemsSolved,
      problemsAttempted: view.assessments.problemsAttempted,
      totalSubmissions: view.assessments.totalSubmissions,
      acceptanceRate: view.assessments.acceptanceRate,
      byDifficulty: view.assessments.byDifficulty,
    };
    dto.leaderboard = {
      rank: view.leaderboard.rank,
      points: view.leaderboard.points,
      streakDays: view.leaderboard.streakDays,
      badges: view.leaderboard.badges,
      assessmentsCompleted: view.leaderboard.assessmentsCompleted,
    };
    dto.forum = {
      postsCreated: view.forum.postsCreated,
      commentsPosted: view.forum.commentsPosted,
      upvotesReceived: view.forum.upvotesReceived,
    };
    dto.recentSubmissions = view.recentSubmissions.map((submission) => ({
      problemTitle: submission.problemTitle,
      difficulty: submission.difficulty,
      status: submission.status,
      passedCount: submission.passedCount,
      totalCount: submission.totalCount,
      createdAt: submission.createdAt.toISOString(),
    }));
    return dto;
  }
}
