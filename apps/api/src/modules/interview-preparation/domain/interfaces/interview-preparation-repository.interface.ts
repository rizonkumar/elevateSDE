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
  PreviewInterviewPreparationPlanDto,
  ReadinessSnapshotDto,
  ReschedulePeerPracticeSessionDto,
  SubmitPeerScorecardDto,
  UpdateInterviewPreparationPlanDto,
  UpdatePreparationRoundDto,
  UpdatePreparationTaskDto,
} from '@elevatesde/shared-types';

export interface CreatePlanRecordInput extends PreviewInterviewPreparationPlanDto {
  userId: string;
  tasks: Array<CreatePreparationTaskDto & { roundOrdinal: number | null }>;
}

export interface InterviewPreparationEvidence {
  coding: { score: number | null; observedAt: Date | null };
  review: { score: number | null; observedAt: Date | null };
  learning: { score: number | null; observedAt: Date | null };
  resume: { score: number | null; observedAt: Date | null };
  peer: { score: number | null; observedAt: Date | null };
}

export interface CreatePeerSessionRecordInput {
  planId: string;
  roundId: string;
  organizerId: string;
  inviteeId: string;
  startsAt: Date;
  timeZone: string;
  durationMinutes: number;
  meetingUrl: string;
}

export abstract class IInterviewPreparationRepository {
  abstract getOverview(userId: string): Promise<InterviewPreparationOverviewDto>;
  abstract findOwnedJobApplication(
    userId: string,
    jobApplicationId: string,
  ): Promise<JobApplicationDto | null>;
  abstract findOwnedPlan(userId: string, planId: string): Promise<InterviewPreparationPlanDto | null>;
  abstract getReadinessEvidence(
    userId: string,
    planId: string,
    now: Date,
  ): Promise<InterviewPreparationEvidence | null>;
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
  abstract createRound(
    userId: string,
    planId: string,
    input: CreatePreparationRoundDto,
  ): Promise<PreparationRoundDto | null>;
  abstract updateRound(
    userId: string,
    roundId: string,
    input: UpdatePreparationRoundDto,
  ): Promise<PreparationRoundDto | 'VERSION_CONFLICT' | null>;
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
  abstract saveSnapshotExplanation(
    userId: string,
    planId: string,
    snapshotId: string,
    explanation: string,
  ): Promise<ReadinessSnapshotDto | null>;
  abstract createPeerSession(
    input: CreatePeerSessionRecordInput,
  ): Promise<PeerPracticeSessionDto | 'DUPLICATE' | null>;
  abstract findPeerSessionForParticipant(
    userId: string,
    sessionId: string,
  ): Promise<PeerPracticeSessionDto | null>;
  abstract updatePeerSessionStatus(
    userId: string,
    sessionId: string,
    status: PeerPracticeStatus,
    version: number,
  ): Promise<PeerPracticeSessionDto | 'VERSION_CONFLICT' | null>;
  abstract reschedulePeerSession(
    userId: string,
    sessionId: string,
    input: ReschedulePeerPracticeSessionDto,
  ): Promise<PeerPracticeSessionDto | 'VERSION_CONFLICT' | null>;
  abstract createScorecard(
    userId: string,
    sessionId: string,
    input: SubmitPeerScorecardDto,
  ): Promise<PeerScorecardDto | 'DUPLICATE' | null>;
}
