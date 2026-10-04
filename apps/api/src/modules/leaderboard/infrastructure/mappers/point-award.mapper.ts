import { randomUUID } from 'node:crypto';
import { Prisma } from '@prisma/client';
import { PointAward } from '../../domain/entities/point-award';

interface StatsDeltas {
  points: number;
  periodPoints: number;
  assessments: number;
}

export class PointAwardMapper {
  static toLedgerRecord(
    award: PointAward,
    tenantId: string | null,
  ): Prisma.PointLedgerUncheckedCreateInput {
    return {
      id: randomUUID(),
      userId: award.getUserId(),
      tenantId,
      source: award.getSource(),
      refId: award.getRefId(),
      delta: award.getDelta(),
    };
  }

  static toStatsIncrement(award: PointAward): Prisma.UserStatsUpdateInput {
    const deltas = toStatsDeltas(award);
    return {
      points: { increment: deltas.points },
      weeklyPoints: { increment: deltas.periodPoints },
      monthlyPoints: { increment: deltas.periodPoints },
      assessmentsCompleted: { increment: deltas.assessments },
    };
  }

  static toStatsCreate(award: PointAward): Prisma.UserStatsUncheckedCreateInput {
    const deltas = toStatsDeltas(award);
    return {
      userId: award.getUserId(),
      points: deltas.points,
      weeklyPoints: deltas.periodPoints,
      monthlyPoints: deltas.periodPoints,
      assessmentsCompleted: deltas.assessments,
    };
  }
}

function toStatsDeltas(award: PointAward): StatsDeltas {
  const points = award.getDelta();
  return {
    points,
    periodPoints: award.affectsPeriodTotals() ? points : 0,
    assessments: award.countsAsAssessment() ? 1 : 0,
  };
}
