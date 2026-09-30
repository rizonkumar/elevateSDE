import { Injectable, NotFoundException } from '@nestjs/common';
import type { AiReadinessExplanationDto, ReadinessSnapshotDto } from '@elevatesde/shared-types';
import { IInterviewPreparationRepository } from '../domain/interfaces/interview-preparation-repository.interface';
import { IReadinessNarrativeProvider } from '../domain/interfaces/readiness-narrative-provider.interface';

@Injectable()
export class ReadinessNarrativeService {
  constructor(
    private readonly repository: IInterviewPreparationRepository,
    private readonly provider: IReadinessNarrativeProvider,
  ) {}

  async generate(
    userId: string,
    planId: string,
    snapshotId: string,
  ): Promise<AiReadinessExplanationDto> {
    const plan = await this.repository.findOwnedPlan(userId, planId);
    if (!plan) throw new NotFoundException('Preparation plan not found');
    const snapshot = plan.snapshots.find((item) => item.id === snapshotId);
    if (!snapshot) throw new NotFoundException('Readiness snapshot not found');
    if (plan.latestReadiness === null || plan.snapshots[0]?.id !== snapshotId) {
      return this.fallback(snapshot, 'This snapshot is no longer current. Refresh readiness before generating a new explanation.');
    }
    if (process.env.INTERVIEW_READINESS_AI_ENABLED !== 'true') {
      return this.fallback(snapshot, 'AI explanation is disabled. These recommendations come from the deterministic readiness model.');
    }
    try {
      const result = await this.provider.generate({
        score: snapshot.score,
        status: snapshot.status,
        confidence: snapshot.confidence,
        coverage: snapshot.coverage,
        rounds: snapshot.rounds.map((round) => ({
          title: round.title,
          score: round.score,
          status: round.status,
          confidence: round.confidence,
          missingEvidence: round.missingEvidence,
        })),
        deterministicRecommendations: snapshot.deterministicRecommendations,
      });
      const saved = await this.repository.saveSnapshotExplanation(
        userId,
        planId,
        snapshotId,
        snapshot.sourceRevision,
        result.explanation,
      );
      if (!saved) throw new NotFoundException('Readiness snapshot not found');
      return {
        snapshotId,
        explanation: result.explanation,
        recommendations: result.recommendations,
        generatedAt: new Date().toISOString(),
        fallback: false,
      };
    } catch {
      return this.fallback(snapshot, 'AI explanation is temporarily unavailable. These recommendations come from the deterministic readiness model.');
    }
  }

  private fallback(snapshot: ReadinessSnapshotDto, explanation: string): AiReadinessExplanationDto {
    return {
      snapshotId: snapshot.id,
      explanation,
      recommendations: snapshot.deterministicRecommendations,
      generatedAt: new Date().toISOString(),
      fallback: true,
    };
  }
}
