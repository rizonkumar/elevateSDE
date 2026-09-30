import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  CreateInterviewPreparationPlanDto,
  CreatePreparationRoundDto,
  CreatePreparationTaskDto,
  InterviewLoopTemplateDto,
  InterviewPreparationOverviewDto,
  InterviewPreparationPlanDto,
  PreviewInterviewPreparationPlanDto,
  PreparationRoundDto,
  PreparationTaskDto,
  ReadinessEvidenceSource,
  ReadinessSnapshotDto,
  UpdateInterviewPreparationPlanDto,
  UpdatePreparationRoundDto,
  UpdatePreparationTaskDto,
} from '@elevatesde/shared-types';
import { IInterviewPreparationRepository } from '../domain/interfaces/interview-preparation-repository.interface';
import { InterviewPreparationPlan } from '../domain/entities/interview-preparation-plan';
import { PreparationTask } from '../domain/entities/preparation-task';
import {
  getInterviewLoopTemplate,
  getInterviewLoopTemplates,
} from '../domain/templates/interview-loop-templates';
import { calculateInterviewReadinessV1 } from '../domain/scoring/interview-readiness-calculator';

interface GeneratedTask extends CreatePreparationTaskDto {
  roundOrdinal: number;
}

const TASK_BLUEPRINTS: Record<ReadinessEvidenceSource, { title: string; deepLink: string }> = {
  CODING_SUBMISSIONS: { title: 'Complete a timed coding problem', deepLink: '/dashboard/assessment' },
  SPACED_REPETITION: { title: 'Review due coding problems', deepLink: '/dashboard/review' },
  LEARNING_PATH: { title: 'Continue a preparation track', deepLink: '/dashboard/paths' },
  RESUME_ANALYSIS: { title: 'Analyze your resume for role fit', deepLink: '/dashboard/resume' },
  TASK_COMPLETION: { title: 'Complete your preparation tasks', deepLink: '/dashboard/interview-readiness' },
  MOCK_INTERVIEW: { title: 'Run a focused mock interview', deepLink: '/dashboard/mock-interview' },
  PEER_SCORECARD: { title: 'Schedule peer practice', deepLink: '/dashboard/interview-readiness' },
};

function evidenceSourcesFor(roundType: PreviewInterviewPreparationPlanDto['rounds'][number]['type']): ReadinessEvidenceSource[] {
  if (roundType === 'CODING') return ['CODING_SUBMISSIONS', 'SPACED_REPETITION', 'TASK_COMPLETION', 'MOCK_INTERVIEW'];
  if (roundType === 'SYSTEM_DESIGN') return ['LEARNING_PATH', 'TASK_COMPLETION', 'MOCK_INTERVIEW', 'PEER_SCORECARD'];
  if (roundType === 'BEHAVIORAL') return ['TASK_COMPLETION', 'MOCK_INTERVIEW', 'PEER_SCORECARD'];
  if (roundType === 'RESUME_ROLE_FIT') return ['RESUME_ANALYSIS', 'TASK_COMPLETION', 'MOCK_INTERVIEW'];
  return ['TASK_COMPLETION', 'PEER_SCORECARD'];
}

function taskTypeFor(source: ReadinessEvidenceSource): CreatePreparationTaskDto['type'] {
  if (source === 'CODING_SUBMISSIONS') return 'SOLVE_PROBLEM';
  if (source === 'SPACED_REPETITION') return 'REVIEW_PROBLEM';
  if (source === 'LEARNING_PATH') return 'COMPLETE_PATH';
  if (source === 'RESUME_ANALYSIS') return 'ANALYZE_RESUME';
  if (source === 'MOCK_INTERVIEW') return 'RUN_MOCK_INTERVIEW';
  if (source === 'PEER_SCORECARD') return 'SCHEDULE_PEER_PRACTICE';
  return 'CUSTOM';
}

function buildGeneratedTasks(rounds: PreviewInterviewPreparationPlanDto['rounds']): GeneratedTask[] {
  let ordinal = 0;
  return rounds.flatMap((round, roundOrdinal) =>
    evidenceSourcesFor(round.type)
      .filter((source) => source !== 'TASK_COMPLETION')
      .slice(0, 2)
      .map((source) => {
        const blueprint = TASK_BLUEPRINTS[source];
        const task: GeneratedTask = {
          type: taskTypeFor(source),
          title: blueprint.title,
          deepLink: blueprint.deepLink,
          ordinal,
          roundOrdinal,
        };
        ordinal += 1;
        return task;
      }),
  );
}

@Injectable()
export class InterviewPreparationService {
  constructor(private readonly repository: IInterviewPreparationRepository) {}

  getTemplates(): InterviewLoopTemplateDto[] {
    return getInterviewLoopTemplates();
  }

  async getOverview(userId: string): Promise<InterviewPreparationOverviewDto> {
    return this.repository.getOverview(userId);
  }

  async preview(
    userId: string,
    input: PreviewInterviewPreparationPlanDto,
  ): Promise<PreviewInterviewPreparationPlanDto> {
    await this.validatePlanInput(userId, input);
    return {
      ...input,
      rounds: input.rounds.map((round) => ({ ...round })),
    };
  }

  async create(
    userId: string,
    input: CreateInterviewPreparationPlanDto,
  ): Promise<InterviewPreparationPlanDto> {
    await this.validatePlanInput(userId, input);
    const created = await this.repository.createPlan({
      ...input,
      userId,
      tasks: buildGeneratedTasks(input.rounds),
    });
    if (created === 'DUPLICATE') {
      throw new ConflictException('This application already has a preparation plan');
    }
    return created;
  }

  async getPlan(userId: string, planId: string): Promise<InterviewPreparationPlanDto> {
    const plan = await this.repository.findOwnedPlan(userId, planId);
    if (!plan) throw new NotFoundException('Preparation plan not found');
    return plan;
  }

  async updatePlan(
    userId: string,
    planId: string,
    input: UpdateInterviewPreparationPlanDto,
  ): Promise<InterviewPreparationPlanDto> {
    if (input.targetAt) this.validateTargetAndTimeZone(input.targetAt, input.timeZone);
    if (input.timeZone && !input.targetAt) this.assertTimeZone(input.timeZone);
    const result = await this.repository.updatePlan(userId, planId, input);
    return this.resolveVersioned(result, 'Preparation plan');
  }

  async archivePlan(
    userId: string,
    planId: string,
    version: number,
  ): Promise<InterviewPreparationPlanDto> {
    const result = await this.repository.setPlanStatus(userId, planId, 'ARCHIVED', version);
    return this.resolveVersioned(result, 'Preparation plan');
  }

  async createRound(
    userId: string,
    planId: string,
    input: CreatePreparationRoundDto,
  ): Promise<PreparationRoundDto> {
    try {
      InterviewPreparationPlan.validateRounds([input]);
    } catch (error) {
      throw new BadRequestException(error instanceof Error ? error.message : 'Invalid interview round');
    }
    const round = await this.repository.createRound(userId, planId, input);
    if (!round) throw new NotFoundException('Preparation plan not found');
    return round;
  }

  async updateRound(
    userId: string,
    roundId: string,
    input: UpdatePreparationRoundDto,
  ): Promise<PreparationRoundDto> {
    if (input.weight !== undefined && input.weight <= 0) {
      throw new BadRequestException('Round weight must be greater than zero');
    }
    const result = await this.repository.updateRound(userId, roundId, input);
    return this.resolveVersioned(result, 'Preparation round');
  }

  async createTask(
    userId: string,
    planId: string,
    input: CreatePreparationTaskDto,
  ): Promise<PreparationTaskDto> {
    try {
      PreparationTask.create({
        id: 'pending',
        planId,
        roundId: input.roundId ?? null,
        type: input.type,
        title: input.title,
        description: input.description ?? null,
        status: 'PENDING',
        dueAt: input.dueAt ? new Date(input.dueAt) : null,
        completedAt: null,
        resourceType: input.resourceType ?? null,
        resourceId: input.resourceId ?? null,
        deepLink: input.deepLink ?? null,
        ordinal: input.ordinal,
        version: 0,
      });
    } catch (error) {
      throw new BadRequestException(error instanceof Error ? error.message : 'Invalid task');
    }
    const task = await this.repository.createTask(userId, planId, input);
    if (!task) throw new NotFoundException('Preparation plan or round not found');
    return task;
  }

  async updateTask(
    userId: string,
    taskId: string,
    input: UpdatePreparationTaskDto,
  ): Promise<PreparationTaskDto> {
    const result = await this.repository.updateTask(userId, taskId, input);
    return this.resolveVersioned(result, 'Preparation task');
  }

  async setTaskCompletion(
    userId: string,
    taskId: string,
    completed: boolean,
    version: number,
  ): Promise<PreparationTaskDto> {
    const result = await this.repository.setTaskCompletion(userId, taskId, completed, version);
    return this.resolveVersioned(result, 'Preparation task');
  }

  async refreshSnapshot(userId: string, planId: string): Promise<ReadinessSnapshotDto> {
    const plan = await this.getPlan(userId, planId);
    const calculatedAt = new Date();
    const readiness = calculateInterviewReadinessV1({
      calculatedAt,
      rounds: plan.rounds.map((round) => {
        const completed = round.tasks.filter((task) => task.status === 'COMPLETED').length;
        const taskScore = round.tasks.length === 0 ? null : (completed / round.tasks.length) * 100;
        const observedAt = round.tasks
          .map((task) => task.completedAt)
          .filter((date): date is string => date !== null)
          .sort()
          .at(-1);
        return {
          roundId: round.id,
          roundType: round.type,
          title: round.title,
          weight: round.weight,
          evidence: evidenceSourcesFor(round.type).map((source) => ({
            source,
            score: source === 'TASK_COMPLETION' ? taskScore : null,
            weight: source === 'TASK_COMPLETION' ? 1.2 : 1,
            observedAt: source === 'TASK_COMPLETION' && observedAt ? new Date(observedAt) : null,
            applicable: true,
          })),
        };
      }),
    });
    const recommendations = readiness.rounds
      .flatMap((round) => round.missingEvidence)
      .filter((source, index, all) => all.indexOf(source) === index)
      .slice(0, 3)
      .map((source) => TASK_BLUEPRINTS[source].title);
    const rounds = readiness.rounds.map((round) => ({
      roundId: round.roundId,
      roundType: round.roundType,
      title: round.title,
      score: round.score,
      status: round.status,
      confidence: round.confidence,
      coverage: round.coverage,
      evidence: round.evidence.map((item) => ({
        source: item.source,
        label: TASK_BLUEPRINTS[item.source].title,
        score: item.score,
        weight: item.weight,
        observedAt: null,
        stale: item.stale,
        detail: item.score === null ? 'No durable evidence is available yet.' : 'Measured from completed preparation tasks.',
        deepLink: TASK_BLUEPRINTS[item.source].deepLink,
      })),
      missingEvidence: round.missingEvidence,
    }));
    const snapshot = await this.repository.createSnapshot(userId, planId, {
      formulaVersion: readiness.formulaVersion,
      score: readiness.score,
      status: readiness.status,
      confidence: readiness.confidence,
      coverage: readiness.coverage,
      rounds,
      deterministicRecommendations: recommendations,
      aiExplanation: null,
      aiSnapshotId: null,
      calculatedAt: calculatedAt.toISOString(),
    });
    if (!snapshot) throw new NotFoundException('Preparation plan not found');
    return snapshot;
  }

  templatePreview(archetype: PreviewInterviewPreparationPlanDto['archetype']): InterviewLoopTemplateDto {
    return getInterviewLoopTemplate(archetype);
  }

  private async validatePlanInput(
    userId: string,
    input: PreviewInterviewPreparationPlanDto,
  ): Promise<void> {
    const application = await this.repository.findOwnedJobApplication(userId, input.jobApplicationId);
    if (!application) throw new NotFoundException('Job application not found');
    this.validateTargetAndTimeZone(input.targetAt, input.timeZone);
    try {
      InterviewPreparationPlan.validateRounds(
        input.rounds.map((round, ordinal) => ({ ...round, ordinal })),
      );
    } catch (error) {
      throw new BadRequestException(error instanceof Error ? error.message : 'Invalid interview rounds');
    }
  }

  private validateTargetAndTimeZone(targetAt: string, timeZone: string | undefined): void {
    const target = new Date(targetAt);
    if (!Number.isFinite(target.getTime())) throw new BadRequestException('Target date is invalid');
    if (target.getTime() <= Date.now()) throw new BadRequestException('Target date must be in the future');
    if (timeZone) this.assertTimeZone(timeZone);
  }

  private assertTimeZone(timeZone: string): void {
    try {
      new Intl.DateTimeFormat('en-US', { timeZone }).format();
    } catch {
      throw new BadRequestException('Time zone must be a valid IANA identifier');
    }
  }

  private resolveVersioned<T>(result: T | 'VERSION_CONFLICT' | null, label: string): T {
    if (result === null) throw new NotFoundException(`${label} not found`);
    if (result === 'VERSION_CONFLICT') {
      throw new ConflictException(`${label} was modified; refresh and retry`);
    }
    return result;
  }
}
