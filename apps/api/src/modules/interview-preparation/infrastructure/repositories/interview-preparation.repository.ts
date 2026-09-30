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
  peerSessionInclude,
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
      select: { id: true, readinessRevision: true },
    });
    if (!plan) return null;
    const [
      submissionCounts,
      latestSubmission,
      reviewCounts,
      latestReview,
      learningCounts,
      learningObservation,
      latestResume,
      peerScores,
    ] = await Promise.all([
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
        Promise.all([
          this.prisma.submission.findFirst({
            where: {
              userId,
              status: 'ACCEPTED',
              problem: {
                learningPathItems: {
                  some: { module: { path: { enrollments: { some: { userId } } } } },
                },
              },
            },
            orderBy: { createdAt: 'desc' },
            select: { createdAt: true },
          }),
          this.prisma.pathEnrollment.findFirst({
            where: { userId },
            orderBy: { enrolledAt: 'desc' },
            select: { enrolledAt: true },
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
    const [latestLearningSubmission, latestEnrollment] = learningObservation;
    const learningTimes = [
      latestLearningSubmission?.createdAt.getTime(),
      latestEnrollment?.enrolledAt.getTime(),
    ].filter((value): value is number => value !== undefined);
    const learningObservedAt =
      learningTimes.length === 0 ? null : new Date(Math.max(...learningTimes));
    const peerValues = [
      peerScores._avg.communication,
      peerScores._avg.problemSolving,
      peerScores._avg.technicalDepth,
      peerScores._avg.structure,
    ].filter((value): value is number => value !== null);
    return {
      revision: plan.readinessRevision,
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
        observedAt: learningObservedAt,
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
              roundId: roundIds.get(task.roundOrdinal) ?? randomUUID(),
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
    const round = await this.prisma.$transaction(async (transaction) => {
      const created = await transaction.interviewPreparationRound.create({
        data: { id: randomUUID(), planId, ...input },
      });
      await transaction.interviewPreparationPlan.update({
        where: { id: planId },
        data: { readinessInvalidatedAt: new Date() },
      });
      return created;
    });
    return InterviewPreparationMapper.toRound(round);
  }

  async updateRound(
    userId: string,
    roundId: string,
    input: UpdatePreparationRoundDto,
  ): Promise<PreparationRoundDto | 'VERSION_CONFLICT' | null> {
    const result = await this.prisma.$transaction(async (transaction) => {
      const updated = await transaction.interviewPreparationRound.updateMany({
        where: { id: roundId, plan: { userId }, version: input.version },
        data: {
          type: input.type,
          title: input.title,
          weight: input.weight,
          ordinal: input.ordinal,
          version: { increment: 1 },
        },
      });
      if (updated.count > 0) {
        const round = await transaction.interviewPreparationRound.findUniqueOrThrow({
          where: { id: roundId },
          select: { planId: true },
        });
        await transaction.interviewPreparationPlan.update({
          where: { id: round.planId },
          data: { readinessInvalidatedAt: new Date() },
        });
      }
      return updated;
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
    if (!plan.rounds.some((round) => round.id === input.roundId)) return null;
    const task = await this.prisma.$transaction(async (transaction) => {
      const created = await transaction.preparationTask.create({
        data: {
          id: randomUUID(),
          planId,
          roundId: input.roundId,
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
      await transaction.interviewPreparationPlan.update({
        where: { id: planId },
        data: { readinessInvalidatedAt: new Date() },
      });
      return created;
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
    const result = await this.prisma.$transaction(async (transaction) => {
      const updated = await transaction.preparationTask.updateMany({
        where: { id: taskId, plan: { userId }, version },
        data: {
          status: desiredStatus,
          completedAt: completed ? new Date() : null,
          version: { increment: 1 },
        },
      });
      if (updated.count > 0) {
        await transaction.interviewPreparationPlan.update({
          where: { id: task.planId },
          data: { readinessInvalidatedAt: new Date() },
        });
      }
      return updated;
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
    const created = await this.prisma.$transaction(async (transaction) => {
      const record = await transaction.readinessSnapshot.create({
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
      await transaction.interviewPreparationPlan.update({
        where: { id: planId },
        data: { readinessInvalidatedAt: null },
      });
      return record;
    });
    return InterviewPreparationMapper.toSnapshot(created);
  }

  async saveSnapshotExplanation(
    userId: string,
    planId: string,
    snapshotId: string,
    explanation: string,
  ): Promise<ReadinessSnapshotDto | null> {
    const result = await this.prisma.readinessSnapshot.updateMany({
      where: { id: snapshotId, planId, plan: { userId } },
      data: { aiExplanation: explanation, aiSnapshotId: snapshotId },
    });
    if (result.count === 0) return null;
    const snapshot = await this.prisma.readinessSnapshot.findFirst({
      where: { id: snapshotId, planId, plan: { userId } },
    });
    return snapshot ? InterviewPreparationMapper.toSnapshot(snapshot) : null;
  }

  async createPeerSession(
    input: CreatePeerSessionRecordInput,
  ): Promise<PeerPracticeSessionDto | 'DUPLICATE' | null> {
    const round = await this.prisma.interviewPreparationRound.findFirst({
      where: { id: input.roundId, planId: input.planId, plan: { userId: input.organizerId } },
      select: { id: true },
    });
    if (!round) return null;
    try {
      const session = await this.prisma.peerPracticeSession.create({
        data: { id: randomUUID(), ...input },
        include: peerSessionInclude,
      });
      return InterviewPreparationMapper.toPeerSession(session);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        return 'DUPLICATE';
      }
      throw error;
    }
  }

  async findPeerSessionForParticipant(
    userId: string,
    sessionId: string,
  ): Promise<PeerPracticeSessionDto | null> {
    const session = await this.prisma.peerPracticeSession.findFirst({
      where: { id: sessionId, OR: [{ organizerId: userId }, { inviteeId: userId }] },
      include: peerSessionInclude,
    });
    return session ? InterviewPreparationMapper.toPeerSession(session) : null;
  }

  async updatePeerSessionStatus(
    userId: string,
    sessionId: string,
    status: PeerPracticeStatus,
    version: number,
  ): Promise<PeerPracticeSessionDto | 'VERSION_CONFLICT' | null> {
    const result = await this.prisma.peerPracticeSession.updateMany({
      where: {
        id: sessionId,
        version,
        OR: [{ organizerId: userId }, { inviteeId: userId }],
      },
      data: { status, version: { increment: 1 } },
    });
    return this.resolvePeerUpdate(userId, sessionId, result.count);
  }

  async reschedulePeerSession(
    userId: string,
    sessionId: string,
    input: ReschedulePeerPracticeSessionDto,
  ): Promise<PeerPracticeSessionDto | 'VERSION_CONFLICT' | null> {
    const result = await this.prisma.peerPracticeSession.updateMany({
      where: { id: sessionId, organizerId: userId, version: input.version },
      data: {
        startsAt: new Date(input.startsAt),
        timeZone: input.timeZone,
        durationMinutes: input.durationMinutes,
        meetingUrl: input.meetingUrl,
        status: 'PENDING',
        version: { increment: 1 },
      },
    });
    return this.resolvePeerUpdate(userId, sessionId, result.count);
  }

  async createScorecard(
    userId: string,
    sessionId: string,
    input: SubmitPeerScorecardDto,
  ): Promise<PeerScorecardDto | 'DUPLICATE' | null> {
    const session = await this.prisma.peerPracticeSession.findFirst({
      where: {
        id: sessionId,
        status: 'COMPLETED',
        OR: [{ organizerId: userId }, { inviteeId: userId }],
      },
      select: { id: true, planId: true },
    });
    if (!session) return null;
    try {
      const scorecard = await this.prisma.$transaction(async (transaction) => {
        const created = await transaction.peerScorecard.create({
          data: { id: randomUUID(), sessionId, evaluatorId: userId, ...input },
          include: { evaluator: true },
        });
        await transaction.interviewPreparationPlan.update({
          where: { id: session.planId },
          data: { readinessInvalidatedAt: new Date() },
        });
        return created;
      });
      return InterviewPreparationMapper.toScorecard(scorecard);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        return 'DUPLICATE';
      }
      throw error;
    }
  }

  private async resolvePeerUpdate(
    userId: string,
    sessionId: string,
    count: number,
  ): Promise<PeerPracticeSessionDto | 'VERSION_CONFLICT' | null> {
    if (count > 0) return this.findPeerSessionForParticipant(userId, sessionId);
    const exists = await this.prisma.peerPracticeSession.findFirst({
      where: { id: sessionId, OR: [{ organizerId: userId }, { inviteeId: userId }] },
      select: { id: true },
    });
    return exists ? 'VERSION_CONFLICT' : null;
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
