import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type {
  CreatePreparationTaskDto,
  InterviewPreparationOverviewDto,
  InterviewPreparationPlanDto,
  InterviewPreparationPlanStatus,
  JobApplicationDto,
  PreparationTaskDto,
  ReadinessSnapshotDto,
  UpdateInterviewPreparationPlanDto,
  UpdatePreparationTaskDto,
} from '@elevatesde/shared-types';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import {
  CreatePlanRecordInput,
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
