import type { InterviewPreparationPlanDto, ReadinessSnapshotDto } from '@elevatesde/shared-types';
import { IInterviewPreparationRepository } from '../domain/interfaces/interview-preparation-repository.interface';
import { IReadinessNarrativeProvider } from '../domain/interfaces/readiness-narrative-provider.interface';
import { ReadinessNarrativeService } from './readiness-narrative.service';

const snapshot: ReadinessSnapshotDto = {
  id: 'snapshot-1',
  formulaVersion: 'v1',
  sourceRevision: 0,
  score: 72,
  status: 'PROGRESSING',
  confidence: 0.6,
  coverage: 0.75,
  rounds: [{
    roundId: 'round-1',
    roundType: 'CODING',
    title: 'Coding',
    score: 72,
    status: 'PROGRESSING',
    confidence: 0.6,
    coverage: 0.75,
    evidence: [],
    missingEvidence: ['MOCK_INTERVIEW'],
  }],
  deterministicRecommendations: ['Run a focused mock interview'],
  aiExplanation: null,
  aiSnapshotId: null,
  calculatedAt: '2026-09-30T12:00:00.000Z',
};

const plan: InterviewPreparationPlanDto = {
  id: 'plan-1',
  jobApplicationId: 'application-1',
  company: 'Private Company Name',
  role: 'Software Engineer',
  targetAt: '2026-10-10T12:00:00.000Z',
  timeZone: 'UTC',
  archetype: 'GENERAL',
  status: 'ACTIVE',
  version: 0,
  latestReadiness: snapshot,
  createdAt: '2026-09-30T00:00:00.000Z',
  updatedAt: '2026-09-30T00:00:00.000Z',
  rounds: [],
  snapshots: [snapshot],
  peerSessions: [],
};

function repository(): jest.Mocked<IInterviewPreparationRepository> {
  return {
    getOverview: jest.fn(),
    findOwnedJobApplication: jest.fn(),
    findOwnedPlan: jest.fn().mockResolvedValue(plan),
    getReadinessEvidence: jest.fn(),
    createPlan: jest.fn(),
    updatePlan: jest.fn(),
    setPlanStatus: jest.fn(),
    createRound: jest.fn(),
    updateRound: jest.fn(),
    createTask: jest.fn(),
    updateTask: jest.fn(),
    setTaskCompletion: jest.fn(),
    createSnapshot: jest.fn(),
    saveSnapshotExplanation: jest.fn().mockResolvedValue(snapshot),
    createPeerSession: jest.fn(),
    findPeerSessionForParticipant: jest.fn(),
    updatePeerSessionStatus: jest.fn(),
    reschedulePeerSession: jest.fn(),
    createScorecard: jest.fn(),
  };
}

function provider(): jest.Mocked<IReadinessNarrativeProvider> {
  return {
    generate: jest.fn().mockResolvedValue({
      explanation: 'Coding evidence is progressing with one missing signal.',
      recommendations: ['Run a coding mock interview'],
    }),
  };
}

describe('ReadinessNarrativeService', () => {
  const originalFlag = process.env.INTERVIEW_READINESS_AI_ENABLED;

  afterEach(() => {
    process.env.INTERVIEW_READINESS_AI_ENABLED = originalFlag;
  });

  it('returns deterministic fallback when AI is disabled', async () => {
    process.env.INTERVIEW_READINESS_AI_ENABLED = 'false';
    const ai = provider();
    const service = new ReadinessNarrativeService(repository(), ai);

    const result = await service.generate('user-1', plan.id, snapshot.id);

    expect(result.fallback).toBe(true);
    expect(result.recommendations).toEqual(snapshot.deterministicRecommendations);
    expect(ai.generate).not.toHaveBeenCalled();
  });

  it('sends only structured readiness evidence to the provider', async () => {
    process.env.INTERVIEW_READINESS_AI_ENABLED = 'true';
    const ai = provider();
    const service = new ReadinessNarrativeService(repository(), ai);

    const result = await service.generate('user-1', plan.id, snapshot.id);

    expect(result.fallback).toBe(false);
    const payload = JSON.stringify(ai.generate.mock.calls[0]?.[0]);
    expect(payload).not.toContain(plan.company);
    expect(payload).not.toContain(plan.role);
    expect(payload).toContain('MOCK_INTERVIEW');
  });

  it('falls back when the provider fails', async () => {
    process.env.INTERVIEW_READINESS_AI_ENABLED = 'true';
    const ai = provider();
    ai.generate.mockRejectedValue(new Error('timeout'));
    const service = new ReadinessNarrativeService(repository(), ai);

    const result = await service.generate('user-1', plan.id, snapshot.id);

    expect(result.fallback).toBe(true);
  });

  it('rejects generation for stale snapshots without calling the provider', async () => {
    process.env.INTERVIEW_READINESS_AI_ENABLED = 'true';
    const repo = repository();
    repo.findOwnedPlan.mockResolvedValue({ ...plan, snapshots: [{ ...snapshot, id: 'new' }, snapshot] });
    const ai = provider();
    const service = new ReadinessNarrativeService(repo, ai);

    const result = await service.generate('user-1', plan.id, snapshot.id);

    expect(result.fallback).toBe(true);
    expect(ai.generate).not.toHaveBeenCalled();
  });
});
