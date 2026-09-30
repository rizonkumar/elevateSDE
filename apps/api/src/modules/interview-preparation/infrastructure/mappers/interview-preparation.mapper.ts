import { Prisma } from '@prisma/client';
import type {
  InterviewPreparationPlanDto,
  InterviewPreparationPlanSummaryDto,
  JobApplicationDto,
  PeerPracticeParticipantDto,
  PeerPracticeSessionDto,
  PeerScorecardDto,
  PreparationRoundDto,
  PreparationTaskDto,
  ReadinessSnapshotDto,
} from '@elevatesde/shared-types';

export const planInclude = {
  jobApplication: true,
  rounds: { orderBy: { ordinal: 'asc' as const } },
  tasks: { orderBy: { ordinal: 'asc' as const } },
  snapshots: { orderBy: { calculatedAt: 'desc' as const }, take: 20 },
  peerSessions: {
    orderBy: { startsAt: 'asc' as const },
    include: {
      organizer: true,
      invitee: true,
      scorecards: { include: { evaluator: true }, orderBy: { submittedAt: 'asc' as const } },
    },
  },
} satisfies Prisma.InterviewPreparationPlanInclude;

export type PlanRecord = Prisma.InterviewPreparationPlanGetPayload<{ include: typeof planInclude }>;
type SnapshotRecord = PlanRecord['snapshots'][number];
type TaskRecord = PlanRecord['tasks'][number];
type RoundRecord = PlanRecord['rounds'][number];
type PeerSessionRecord = PlanRecord['peerSessions'][number];
type ScorecardRecord = PeerSessionRecord['scorecards'][number];
type UserRecord = PeerSessionRecord['organizer'];

type SnapshotRoundPayload = ReadinessSnapshotDto['rounds'];

function participant(user: UserRecord): PeerPracticeParticipantDto {
  const displayName = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
  return { id: user.id, displayName: displayName || user.email.split('@')[0] || 'Candidate' };
}

function snapshot(record: SnapshotRecord): ReadinessSnapshotDto {
  return {
    id: record.id,
    formulaVersion: record.formulaVersion as ReadinessSnapshotDto['formulaVersion'],
    score: record.score,
    status: record.status,
    confidence: record.confidence,
    coverage: record.coverage,
    rounds: record.rounds as unknown as SnapshotRoundPayload,
    deterministicRecommendations: record.deterministicRecommendations,
    aiExplanation: record.aiExplanation,
    aiSnapshotId: record.aiSnapshotId,
    calculatedAt: record.calculatedAt.toISOString(),
  };
}

function task(record: TaskRecord): PreparationTaskDto {
  return {
    id: record.id,
    roundId: record.roundId,
    type: record.type,
    title: record.title,
    description: record.description,
    status: record.status,
    dueAt: record.dueAt?.toISOString() ?? null,
    completedAt: record.completedAt?.toISOString() ?? null,
    resourceType: record.resourceType,
    resourceId: record.resourceId,
    deepLink: record.deepLink,
    ordinal: record.ordinal,
    version: record.version,
  };
}

function scorecard(record: ScorecardRecord): PeerScorecardDto {
  return {
    id: record.id,
    sessionId: record.sessionId,
    evaluator: participant(record.evaluator),
    communication: record.communication,
    problemSolving: record.problemSolving,
    technicalDepth: record.technicalDepth,
    structure: record.structure,
    strengths: record.strengths,
    improvements: record.improvements,
    submittedAt: record.submittedAt.toISOString(),
  };
}

function peerSession(record: PeerSessionRecord): PeerPracticeSessionDto {
  return {
    id: record.id,
    planId: record.planId,
    roundId: record.roundId,
    organizer: participant(record.organizer),
    invitee: participant(record.invitee),
    status: record.status,
    startsAt: record.startsAt.toISOString(),
    timeZone: record.timeZone,
    durationMinutes: record.durationMinutes,
    meetingUrl: record.meetingUrl,
    scorecards: record.scorecards.map(scorecard),
    version: record.version,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

function latestReadiness(record: PlanRecord): InterviewPreparationPlanSummaryDto['latestReadiness'] {
  const latest = record.snapshots[0];
  if (!latest) return null;
  return {
    score: latest.score,
    status: latest.status,
    confidence: latest.confidence,
    coverage: latest.coverage,
    calculatedAt: latest.calculatedAt.toISOString(),
  };
}

export class InterviewPreparationMapper {
  static toSummary(record: PlanRecord): InterviewPreparationPlanSummaryDto {
    return {
      id: record.id,
      jobApplicationId: record.jobApplicationId,
      company: record.jobApplication.company,
      role: record.jobApplication.role,
      targetAt: record.targetAt.toISOString(),
      timeZone: record.timeZone,
      archetype: record.archetype,
      status: record.status,
      version: record.version,
      latestReadiness: latestReadiness(record),
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
    };
  }

  static toPlan(record: PlanRecord): InterviewPreparationPlanDto {
    const latest = record.snapshots[0];
    const readinessByRound = new Map(latest ? snapshot(latest).rounds.map((item) => [item.roundId, item]) : []);
    const tasksByRound = new Map<string, PreparationTaskDto[]>();
    for (const recordTask of record.tasks) {
      if (recordTask.roundId === null) continue;
      const existing = tasksByRound.get(recordTask.roundId) ?? [];
      existing.push(task(recordTask));
      tasksByRound.set(recordTask.roundId, existing);
    }
    const rounds: PreparationRoundDto[] = record.rounds.map((recordRound: RoundRecord) => ({
      id: recordRound.id,
      type: recordRound.type,
      title: recordRound.title,
      weight: recordRound.weight,
      ordinal: recordRound.ordinal,
      version: recordRound.version,
      tasks: tasksByRound.get(recordRound.id) ?? [],
      readiness: readinessByRound.get(recordRound.id) ?? null,
    }));
    return {
      ...InterviewPreparationMapper.toSummary(record),
      rounds,
      snapshots: record.snapshots.map(snapshot),
      peerSessions: record.peerSessions.map(peerSession),
    };
  }

  static toTask(record: TaskRecord): PreparationTaskDto {
    return task(record);
  }

  static toSnapshot(record: SnapshotRecord): ReadinessSnapshotDto {
    return snapshot(record);
  }

  static toJobApplication(record: PlanRecord['jobApplication']): JobApplicationDto {
    return {
      id: record.id,
      userId: record.userId,
      company: record.company,
      role: record.role,
      status: record.status,
      salaryRange: record.salaryRange,
      jobDescriptionUrl: record.jobDescriptionUrl,
      interviewDate: record.interviewDate?.toISOString() ?? null,
      boardPosition: record.boardPosition,
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
    };
  }
}
