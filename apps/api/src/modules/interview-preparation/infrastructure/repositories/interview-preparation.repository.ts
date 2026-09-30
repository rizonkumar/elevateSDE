import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type {
  CreatePreparationRoundDto,
  CreatePreparationTaskDto,
  InterviewPreparationOverviewDto,
  InterviewPreparationPlanDto,
  InterviewPreparationPlanStatus,
  JobApplicationDto,
  PeerPracticeSessionDto,
  PeerPracticeStatus,
  PeerScorecardDto,
  PreparationRoundDto,
  PreparationTaskDto,
  ReadinessSnapshotDto,
  ReschedulePeerPracticeSessionDto,
  SubmitPeerScorecardDto,
  UpdateInterviewPreparationPlanDto,
  UpdatePreparationRoundDto,
  UpdatePreparationTaskDto,
} from '@elevatesde/shared-types';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import {
  CreatePeerSessionRecordInput,
  CreatePlanRecordInput,
  InterviewPreparationEvidence,
  IInterviewPreparationRepository,
} from '../../domain/interfaces/interview-preparation-repository.interface';
import {
  InterviewPreparationMapper,
  planInclude,
} from '../mappers/interview-preparation.mapper';

function toJobApplication(record: {
  id: string;
  userId: string;
  company: string;
  role: string;
  status: JobApplicationDto['status'];
  salaryRange: string | null;
  jobDescriptionUrl: string | null;
  interviewDate: Date | null;
  boardPosition: number;
  createdAt: Date;
  updatedAt: Date;
}): JobApplicationDto {
  return {
    ...record,
    interviewDate: record.interviewDate?.toISOString() ?? null,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

@Injectable()
export class InterviewPreparationRepository implements IInterviewPreparationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getOverview(userId: string): Promise<InterviewPreparationOverviewDto> {
    const [plans, applications] = await Promise.all([
      this.prisma.interviewPreparationPlan.findMany({
        where: { userId },
        include: planInclude,
        orderBy: [{ status: 'asc' }, { targetAt: 'asc' }],
      }),
      this.prisma.jobApplication.findMany({
        where: { userId, preparationPlan: null },
        orderBy: [{ interviewDate: 'asc' }, { updatedAt: 'desc' }],
      }),
    ]);
    return {
      plans: plans.map(InterviewPreparationMapper.toSummary),
      unplannedApplications: applications.map(toJobApplication),
    };
  }

  async findOwnedJobApplication(
    userId: string,
    jobApplicationId: string,
  ): Promise<JobApplicationDto | null> {
    const application = await this.prisma.jobApplication.findFirst({
      where: { id: jobApplicationId, userId },
    });
    return application ? toJobApplication(application) : null;
  }

  async findOwnedPlan(userId: string, planId: string): Promise<InterviewPreparationPlanDto | null> {
    const plan = await this.prisma.interviewPreparationPlan.findFirst({
      where: { id: planId, userId },
      include: planInclude,
    });
    return plan ? InterviewPreparationMapper.toPlan(plan) : null;
  }

  async getReadinessEvidence(
    userId: string,
    planId: string,
    now: Date,
  ): Promise<InterviewPreparationEvidence | null> {
    const plan = await this.prisma.interviewPreparationPlan.findFirst({
      where: { id: planId, userId },
      select: { id: true },
    });
    if (!plan) return null;
    const [submissionCounts, latestSubmission, reviewCounts, latestReview, learningCounts, latestResume, peerScores] =
      await Promise.all([
        Promise.all([
          this.prisma.submission.count({ where: { userId } }),
          this.prisma.submission.count({ where: { userId, status: 'ACCEPTED' } }),
        ]),
        this.prisma.submission.aggregate({ where: { userId }, _max: { createdAt: true } }),
        Promise.all([
          this.prisma.reviewItem.count({ where: { userId } }),
          this.prisma.reviewItem.count({ where: { userId, dueAt: { lte: now } } }),
        ]),
        this.prisma.reviewItem.aggregate({ where: { userId }, _max: { lastReviewedAt: true } }),
        Promise.all([
          this.prisma.learningPathItem.count({
            where: { module: { path: { enrollments: { some: { userId } } } } },
          }),
          this.prisma.learningPathItem.count({
            where: {
              module: { path: { enrollments: { some: { userId } } } },
              problem: { submissions: { some: { userId, status: 'ACCEPTED' } } },
            },
          }),
        ]),
        this.prisma.resume.findFirst({
          where: { userId, status: 'COMPLETED', atsScore: { not: null } },
          orderBy: { updatedAt: 'desc' },
          select: { atsScore: true, updatedAt: true },
        }),
        this.prisma.peerScorecard.aggregate({
          where: {
            evaluatorId: { not: userId },
            session: {
              planId,
              status: 'COMPLETED',
              OR: [{ organizerId: userId }, { inviteeId: userId }],
            },
          },
          _avg: { communication: true, problemSolving: true, technicalDepth: true, structure: true },
          _max: { submittedAt: true },
        }),
      ]);
    const [totalSubmissions, acceptedSubmissions] = submissionCounts;
    const [trackedReviews, dueReviews] = reviewCounts;
    const [learningTotal, learningSolved] = learningCounts;
    const peerValues = [
      peerScores._avg.communication,
      peerScores._avg.problemSolving,
      peerScores._avg.technicalDepth,
      peerScores._avg.structure,
    ].filter((value): value is number => value !== null);
    return {
      coding: {
        score: totalSubmissions === 0 ? null : Math.round((acceptedSubmissions / totalSubmissions) * 100),
        observedAt: latestSubmission._max.createdAt,
      },
      review: {
        score: trackedReviews === 0 ? null : Math.round(((trackedReviews - dueReviews) / trackedReviews) * 100),
        observedAt: latestReview._max.lastReviewedAt,
      },
      learning: {
        score: learningTotal === 0 ? null : Math.round((learningSolved / learningTotal) * 100),
        observedAt: latestSubmission._max.createdAt,
      },
      resume: { score: latestResume?.atsScore ?? null, observedAt: latestResume?.updatedAt ?? null },
      peer: {
        score:
          peerValues.length === 0
            ? null
            : Math.round(peerValues.reduce((total, value) => total + value, 0) / peerValues.length),
        observedAt: peerScores._max.submittedAt,
      },
    };
  }

  async createPlan(
    input: CreatePlanRecordInput,
  ): Promise<InterviewPreparationPlanDto | 'DUPLICATE'> {
    const roundIds = new Map(input.rounds.map((_round, index) => [index, randomUUID()]));
    try {
      const plan = await this.prisma.interviewPreparationPlan.create({
        data: {
          id: randomUUID(),
          userId: input.userId,
          jobApplicationId: input.jobApplicationId,
          targetAt: new Date(input.targetAt),
          timeZone: input.timeZone,
          archetype: input.archetype,
          rounds: {
            create: input.rounds.map((round, index) => ({
              id: roundIds.get(index) ?? randomUUID(),
              type: round.type,
              title: round.title,
              weight: round.weight,
              ordinal: index,
            })),
          },
          tasks: {
            create: input.tasks.map((task) => ({
              id: randomUUID(),
              roundId: task.roundOrdinal === null ? null : (roundIds.get(task.roundOrdinal) ?? null),
              type: task.type,
              title: task.title,
              description: task.description ?? null,
              dueAt: task.dueAt ? new Date(task.dueAt) : null,
              resourceType: task.resourceType ?? null,
              resourceId: task.resourceId ?? null,
              deepLink: task.deepLink ?? null,
              ordinal: task.ordinal,
            })),
          },
        },
        include: planInclude,
      });
      return InterviewPreparationMapper.toPlan(plan);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        return 'DUPLICATE';
      }
      throw error;
    }
  }

  async updatePlan(
    userId: string,
    planId: string,
    input: UpdateInterviewPreparationPlanDto,
  ): Promise<InterviewPreparationPlanDto | 'VERSION_CONFLICT' | null> {
    const result = await this.prisma.interviewPreparationPlan.updateMany({
      where: { id: planId, userId, version: input.version },
      data: {
        targetAt: input.targetAt ? new Date(input.targetAt) : undefined,
        timeZone: input.timeZone,
        archetype: input.archetype,
        status: input.status,
        version: { increment: 1 },
      },
    });
    return this.resolvePlanUpdate(userId, planId, result.count);
  }

  async setPlanStatus(
    userId: string,
    planId: string,
    status: InterviewPreparationPlanStatus,
    version: number,
  ): Promise<InterviewPreparationPlanDto | 'VERSION_CONFLICT' | null> {
    const result = await this.prisma.interviewPreparationPlan.updateMany({
      where: { id: planId, userId, version },
      data: { status, version: { increment: 1 } },
    });
    return this.resolvePlanUpdate(userId, planId, result.count);
  }

  async createRound(
    userId: string,
    planId: string,
    input: CreatePreparationRoundDto,
  ): Promise<PreparationRoundDto | null> {
    const plan = await this.prisma.interviewPreparationPlan.findFirst({
      where: { id: planId, userId },
      select: { id: true },
    });
    if (!plan) return null;
    const round = await this.prisma.interviewPreparationRound.create({
      data: { id: randomUUID(), planId, ...input },
    });
    return InterviewPreparationMapper.toRound(round);
  }

  async updateRound(
    userId: string,
    roundId: string,
    input: UpdatePreparationRoundDto,
  ): Promise<PreparationRoundDto | 'VERSION_CONFLICT' | null> {
    const result = await this.prisma.interviewPreparationRound.updateMany({
      where: { id: roundId, plan: { userId }, version: input.version },
      data: {
        type: input.type,
        title: input.title,
        weight: input.weight,
        ordinal: input.ordinal,
        version: { increment: 1 },
      },
    });
    if (result.count > 0) {
      const round = await this.prisma.interviewPreparationRound.findFirst({
        where: { id: roundId, plan: { userId } },
      });
      return round ? InterviewPreparationMapper.toRound(round) : null;
    }
    const exists = await this.prisma.interviewPreparationRound.findFirst({
      where: { id: roundId, plan: { userId } },
      select: { id: true },
    });
    return exists ? 'VERSION_CONFLICT' : null;
  }

  async createTask(
    userId: string,
    planId: string,
    input: CreatePreparationTaskDto,
  ): Promise<PreparationTaskDto | null> {
    const plan = await this.prisma.interviewPreparationPlan.findFirst({
      where: { id: planId, userId },
      select: { id: true, rounds: { select: { id: true } } },
    });
    if (!plan) return null;
    if (input.roundId && !plan.rounds.some((round) => round.id === input.roundId)) return null;
    const task = await this.prisma.preparationTask.create({
      data: {
        id: randomUUID(),
        planId,
        roundId: input.roundId ?? null,
        type: input.type,
        title: input.title,
        description: input.description ?? null,
        dueAt: input.dueAt ? new Date(input.dueAt) : null,
        resourceType: input.resourceType ?? null,
        resourceId: input.resourceId ?? null,
        deepLink: input.deepLink ?? null,
        ordinal: input.ordinal,
      },
    });
    return InterviewPreparationMapper.toTask(task);
  }

  async updateTask(
    userId: string,
    taskId: string,
    input: UpdatePreparationTaskDto,
  ): Promise<PreparationTaskDto | 'VERSION_CONFLICT' | null> {
    const result = await this.prisma.preparationTask.updateMany({
      where: { id: taskId, plan: { userId }, version: input.version },
      data: {
        title: input.title,
        description: input.description,
        dueAt: input.dueAt === undefined ? undefined : input.dueAt === null ? null : new Date(input.dueAt),
        ordinal: input.ordinal,
        version: { increment: 1 },
      },
    });
    return this.resolveTaskUpdate(userId, taskId, result.count);
  }

  async setTaskCompletion(
    userId: string,
    taskId: string,
    completed: boolean,
    version: number,
  ): Promise<PreparationTaskDto | 'VERSION_CONFLICT' | null> {
    const task = await this.prisma.preparationTask.findFirst({
      where: { id: taskId, plan: { userId } },
    });
    if (!task) return null;
    const desiredStatus = completed ? 'COMPLETED' : 'PENDING';
    if (task.status === desiredStatus) return InterviewPreparationMapper.toTask(task);
    const result = await this.prisma.preparationTask.updateMany({
      where: { id: taskId, plan: { userId }, version },
      data: {
        status: desiredStatus,
        completedAt: completed ? new Date() : null,
        version: { increment: 1 },
      },
    });
    return this.resolveTaskUpdate(userId, taskId, result.count);
  }

  async createSnapshot(
    userId: string,
    planId: string,
    snapshot: Omit<ReadinessSnapshotDto, 'id'>,
  ): Promise<ReadinessSnapshotDto | null> {
    const plan = await this.prisma.interviewPreparationPlan.findFirst({
      where: { id: planId, userId },
      select: { id: true },
    });
    if (!plan) return null;
    const created = await this.prisma.readinessSnapshot.create({
      data: {
        id: randomUUID(),
        planId,
        formulaVersion: snapshot.formulaVersion,
        score: snapshot.score,
        status: snapshot.status,
        confidence: snapshot.confidence,
        coverage: snapshot.coverage,
        rounds: snapshot.rounds as unknown as Prisma.InputJsonValue,
        deterministicRecommendations: snapshot.deterministicRecommendations,
        aiExplanation: snapshot.aiExplanation,
        aiSnapshotId: snapshot.aiSnapshotId,
        calculatedAt: new Date(snapshot.calculatedAt),
      },
    });
    return InterviewPreparationMapper.toSnapshot(created);
  }

  private async resolvePlanUpdate(
    userId: string,
    planId: string,
    count: number,
  ): Promise<InterviewPreparationPlanDto | 'VERSION_CONFLICT' | null> {
    if (count > 0) return this.findOwnedPlan(userId, planId);
    const exists = await this.prisma.interviewPreparationPlan.findFirst({
      where: { id: planId, userId },
      select: { id: true },
    });
    return exists ? 'VERSION_CONFLICT' : null;
  }

  private async resolveTaskUpdate(
    userId: string,
    taskId: string,
    count: number,
  ): Promise<PreparationTaskDto | 'VERSION_CONFLICT' | null> {
    if (count > 0) {
      const task = await this.prisma.preparationTask.findFirst({
        where: { id: taskId, plan: { userId } },
      });
      return task ? InterviewPreparationMapper.toTask(task) : null;
    }
    const exists = await this.prisma.preparationTask.findFirst({
      where: { id: taskId, plan: { userId } },
      select: { id: true },
    });
    return exists ? 'VERSION_CONFLICT' : null;
  }
}
