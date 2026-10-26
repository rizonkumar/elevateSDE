import { Prisma } from '@prisma/client';
import type {
  InterviewCompetencyScore,
  MockInterviewDimensionScores,
  MockInterviewFeedback,
  MockInterviewSummaryDto,
} from '@elevatesde/shared-types';
import {
  MockInterviewSession,
  MockInterviewTurnState,
} from '../../domain/entities/mock-interview-session';
import { severityFor } from '../../domain/scoring/mock-interview-scoring';

export const SESSION_WITH_TURNS = {
  turns: { orderBy: { ordinal: 'asc' as const } },
} satisfies Prisma.MockInterviewSessionInclude;

type SessionRecord = Prisma.MockInterviewSessionGetPayload<{ include: typeof SESSION_WITH_TURNS }>;
type TurnRecord = SessionRecord['turns'][number];
type SummaryRecord = Prisma.MockInterviewSessionGetPayload<{
  include: { _count: { select: { turns: { where: { answer: { not: null } } } } } };
}>;

function toDimensionScores(value: Prisma.JsonValue | null): MockInterviewDimensionScores | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const scores: MockInterviewDimensionScores = {};
  for (const [key, score] of Object.entries(value)) {
    if (typeof score === 'number') scores[key] = score;
  }
  return scores;
}

function toCompetencies(value: Prisma.JsonValue | null): InterviewCompetencyScore[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) return [];
    const { key, label, score } = item;
    if (typeof key !== 'string' || typeof label !== 'string' || typeof score !== 'number') return [];
    return [{ key, label, score, severity: severityFor(score) }];
  });
}

function toReport(record: SessionRecord): MockInterviewFeedback | null {
  if (record.status !== 'COMPLETED' || record.overallScore === null) return null;
  return {
    overallScore: record.overallScore,
    competencies: toCompetencies(record.competencies),
    strengths: record.strengths,
    improvements: record.improvements,
    summary: record.summary ?? '',
  };
}

function toTurn(record: TurnRecord): MockInterviewTurnState {
  return {
    id: record.id,
    ordinal: record.ordinal,
    question: record.question,
    askedAt: record.askedAt,
    answer: record.answer,
    answeredAt: record.answeredAt,
    dimensionScores: toDimensionScores(record.scores),
    score: record.score,
    feedback: record.feedback,
  };
}

export const MockInterviewMapper = {
  toDomain(record: SessionRecord): MockInterviewSession {
    return MockInterviewSession.restore({
      id: record.id,
      userId: record.userId,
      tenantId: record.tenantId,
      config: {
        topic: record.topic,
        roleLevel: record.roleLevel,
        companyStyle: record.companyStyle,
        durationMinutes: record.durationMinutes,
      },
      status: record.status,
      engine: record.engine,
      preparationTaskId: record.preparationTaskId,
      startedAt: record.startedAt,
      deadlineAt: record.deadlineAt,
      endedAt: record.endedAt,
      report: toReport(record),
      failureReason: record.failureReason,
      version: record.version,
      turns: record.turns.map(toTurn),
    });
  },

  toSummary(record: SummaryRecord): MockInterviewSummaryDto {
    return {
      id: record.id,
      config: {
        topic: record.topic,
        roleLevel: record.roleLevel,
        companyStyle: record.companyStyle,
        durationMinutes: record.durationMinutes,
      },
      status: record.status,
      engine: record.engine,
      startedAt: record.startedAt.toISOString(),
      endedAt: record.endedAt?.toISOString() ?? null,
      overallScore: record.overallScore,
      answeredCount: record._count.turns,
    };
  },

  toCompetenciesJson(competencies: readonly InterviewCompetencyScore[]): Prisma.InputJsonValue {
    return competencies.map(({ key, label, score }) => ({ key, label, score }));
  },

  toScoresJson(scores: MockInterviewDimensionScores | null): Prisma.InputJsonValue | typeof Prisma.DbNull {
    return scores ? { ...scores } : Prisma.DbNull;
  },
};
