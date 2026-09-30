import type {
  CreatePreparationTaskDto,
  InterviewPreparationOverviewDto,
  InterviewPreparationPlanDto,
  InterviewPreparationPlanStatus,
  JobApplicationDto,
  PreviewInterviewPreparationPlanDto,
  PreparationTaskDto,
  ReadinessSnapshotDto,
  UpdateInterviewPreparationPlanDto,
  UpdatePreparationTaskDto,
} from '@elevatesde/shared-types';

export interface CreatePlanRecordInput extends PreviewInterviewPreparationPlanDto {
  userId: string;
  tasks: Array<CreatePreparationTaskDto & { roundOrdinal: number | null }>;
}

export abstract class IInterviewPreparationRepository {
  abstract getOverview(userId: string): Promise<InterviewPreparationOverviewDto>;
  abstract findOwnedJobApplication(
    userId: string,
    jobApplicationId: string,
  ): Promise<JobApplicationDto | null>;
  abstract findOwnedPlan(userId: string, planId: string): Promise<InterviewPreparationPlanDto | null>;
  abstract createPlan(
    input: CreatePlanRecordInput,
  ): Promise<InterviewPreparationPlanDto | 'DUPLICATE'>;
  abstract updatePlan(
    userId: string,
    planId: string,
    input: UpdateInterviewPreparationPlanDto,
  ): Promise<InterviewPreparationPlanDto | 'VERSION_CONFLICT' | null>;
  abstract setPlanStatus(
    userId: string,
    planId: string,
    status: InterviewPreparationPlanStatus,
    version: number,
  ): Promise<InterviewPreparationPlanDto | 'VERSION_CONFLICT' | null>;
  abstract createTask(
    userId: string,
    planId: string,
    input: CreatePreparationTaskDto,
  ): Promise<PreparationTaskDto | null>;
  abstract updateTask(
    userId: string,
    taskId: string,
    input: UpdatePreparationTaskDto,
  ): Promise<PreparationTaskDto | 'VERSION_CONFLICT' | null>;
  abstract setTaskCompletion(
    userId: string,
    taskId: string,
    completed: boolean,
    version: number,
  ): Promise<PreparationTaskDto | 'VERSION_CONFLICT' | null>;
  abstract createSnapshot(
    userId: string,
    planId: string,
    snapshot: Omit<ReadinessSnapshotDto, 'id'>,
  ): Promise<ReadinessSnapshotDto | null>;
}
