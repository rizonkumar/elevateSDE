import type { InterviewReadinessStatus, ReadinessEvidenceSource } from '@elevatesde/shared-types';

export interface ReadinessNarrativeInput {
  score: number | null;
  status: InterviewReadinessStatus;
  confidence: number;
  coverage: number;
  rounds: Array<{
    title: string;
    score: number | null;
    status: InterviewReadinessStatus;
    confidence: number;
    missingEvidence: ReadinessEvidenceSource[];
  }>;
  deterministicRecommendations: string[];
}

export interface ReadinessNarrativeResult {
  explanation: string;
  recommendations: string[];
}

export abstract class IReadinessNarrativeProvider {
  abstract generate(input: ReadinessNarrativeInput): Promise<ReadinessNarrativeResult>;
}
