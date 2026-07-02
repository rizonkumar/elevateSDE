import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AssessmentDifficulty, JobApplicationStatus } from '@elevatesde/shared-types';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { IDashboardRepository } from '../../domain/interfaces/dashboard-repository.interface';
import {
  DashboardStatsView,
  DashboardJobTrackerView,
  DashboardAssessmentView,
  DashboardLeaderboardView,
  DashboardForumView,
  SubmissionHeatmapCell,
} from '../../domain/read-models/dashboard-stats-view';

const JOB_STATUSES: JobApplicationStatus[] = ['APPLIED', 'OA', 'INTERVIEW', 'OFFER', 'REJECTED'];

const DIFFICULTIES: AssessmentDifficulty[] = ['EASY', 'MEDIUM', 'HARD'];

@Injectable()
export class DashboardRepository implements IDashboardRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getStats(userId: string): Promise<DashboardStatsView> {
    const [jobTracker, assessments, leaderboard, forum, recentSubmissions] = await Promise.all([
      this.getJobTracker(userId),
      this.getAssessments(userId),
      this.getLeaderboard(userId),
      this.getForum(userId),
      this.getRecentSubmissions(userId),
    ]);

    return { jobTracker, assessments, leaderboard, forum, recentSubmissions };
  }

  async getSolvedProblemIds(userId: string): Promise<string[]> {
    const solved = await this.prisma.submission.groupBy({
      by: ['problemId'],
      where: { userId, status: 'ACCEPTED' },
    });
    return solved.map((row) => row.problemId);
  }

  async getSubmissionHeatmap(
    userId: string,
    from: Date,
    to: Date,
  ): Promise<SubmissionHeatmapCell[]> {
    const rows = await this.prisma.$queryRaw<Array<{ date: string; count: number }>>(Prisma.sql`
      SELECT to_char(date_trunc('day', "createdAt"), 'YYYY-MM-DD') AS date, count(*)::int AS count
      FROM "Submission"
      WHERE "userId" = ${userId} AND "createdAt" >= ${from} AND "createdAt" < ${to}
      GROUP BY 1
      ORDER BY 1
    `);
    return rows.map((row) => ({ date: row.date, count: Number(row.count) }));
  }

  private async getJobTracker(userId: string): Promise<DashboardJobTrackerView> {
    const [grouped, upcomingInterviews] = await Promise.all([
      this.prisma.jobApplication.groupBy({
        by: ['status'],
        where: { userId },
        _count: { _all: true },
      }),
      this.prisma.jobApplication.count({
        where: { userId, interviewDate: { gte: new Date() } },
      }),
    ]);

    const byStatus = JOB_STATUSES.reduce(
      (acc, status) => {
        acc[status] = 0;
        return acc;
      },
      {} as Record<JobApplicationStatus, number>,
    );

    let total = 0;
    for (const row of grouped) {
      const count = row._count._all;
      byStatus[row.status as JobApplicationStatus] = count;
      total += count;
    }

    return { total, byStatus, upcomingInterviews };
  }

  private async getAssessments(userId: string): Promise<DashboardAssessmentView> {
    const [attempted, solved, totalSubmissions, acceptedSubmissions] = await Promise.all([
      this.prisma.submission.groupBy({
        by: ['problemId'],
        where: { userId },
      }),
      this.prisma.submission.groupBy({
        by: ['problemId'],
        where: { userId, status: 'ACCEPTED' },
      }),
      this.prisma.submission.count({ where: { userId } }),
      this.prisma.submission.count({
        where: { userId, status: 'ACCEPTED' },
      }),
    ]);

    const solvedProblemIds = solved.map((row) => row.problemId);
    const byDifficulty = DIFFICULTIES.reduce(
      (acc, difficulty) => {
        acc[difficulty] = 0;
        return acc;
      },
      {} as Record<AssessmentDifficulty, number>,
    );

    if (solvedProblemIds.length > 0) {
      const grouped = await this.prisma.problem.groupBy({
        by: ['difficulty'],
        where: { id: { in: solvedProblemIds } },
        _count: { _all: true },
      });
      for (const row of grouped) {
        byDifficulty[row.difficulty as AssessmentDifficulty] = row._count._all;
      }
    }

    const acceptanceRate =
      totalSubmissions > 0 ? Math.round((acceptedSubmissions / totalSubmissions) * 100) : 0;

    return {
      problemsSolved: solvedProblemIds.length,
      problemsAttempted: attempted.length,
      totalSubmissions,
      acceptanceRate,
      byDifficulty,
    };
  }

  private async getLeaderboard(userId: string): Promise<DashboardLeaderboardView> {
    const stats = await this.prisma.userStats.findUnique({ where: { userId } });

    if (!stats) {
      return {
        rank: null,
        points: 0,
        streakDays: 0,
        badges: [],
        assessmentsCompleted: 0,
      };
    }

    const ahead = await this.prisma.userStats.count({
      where: { points: { gt: stats.points } },
    });

    return {
      rank: ahead + 1,
      points: stats.points,
      streakDays: stats.streakDays,
      badges: stats.badges,
      assessmentsCompleted: stats.assessmentsCompleted,
    };
  }

  private async getForum(userId: string): Promise<DashboardForumView> {
    const [postsCreated, commentsPosted, postUpvotes, commentUpvotes] = await Promise.all([
      this.prisma.forumPost.count({ where: { userId } }),
      this.prisma.forumComment.count({ where: { userId } }),
      this.prisma.forumPostVote.count({ where: { post: { userId } } }),
      this.prisma.forumCommentVote.count({
        where: { comment: { userId } },
      }),
    ]);

    return {
      postsCreated,
      commentsPosted,
      upvotesReceived: postUpvotes + commentUpvotes,
    };
  }

  private async getRecentSubmissions(userId: string) {
    const submissions = await this.prisma.submission.findMany({
      where: { userId },
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { problem: { select: { title: true, difficulty: true } } },
    });

    return submissions.map((submission) => ({
      problemTitle: submission.problem.title,
      difficulty: submission.problem.difficulty as AssessmentDifficulty,
      status: submission.status,
      passedCount: submission.passedCount,
      totalCount: submission.totalCount,
      createdAt: submission.createdAt,
    }));
  }
}
