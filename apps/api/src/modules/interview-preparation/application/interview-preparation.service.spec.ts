import { ConflictException, NotFoundException } from '@nestjs/common';
import type {
  InterviewPreparationPlanDto,
  JobApplicationDto,
} from '@elevatesde/shared-types';
import { InterviewPreparationService, mockInterviewMetricFor } from './interview-preparation.service';
import { IInterviewPreparationRepository } from '../domain/interfaces/interview-preparation-repository.interface';

const application: JobApplicationDto = {
  id: 'application-1',
  userId: 'user-1',
  company: 'Example',
  role: 'Software Engineer',
  status: 'INTERVIEW',
  salaryRange: null,
  jobDescriptionUrl: null,
  interviewDate: '2026-10-15T15:00:00.000Z',
  boardPosition: 0,
  createdAt: '2026-09-01T00:00:00.000Z',
  updatedAt: '2026-09-30T00:00:00.000Z',
};

const plan: InterviewPreparationPlanDto = {
  id: 'plan-1',
  jobApplicationId: application.id,
  company: application.company,
  role: application.role,
  targetAt: '2026-10-15T15:00:00.000Z',
  timeZone: 'America/New_York',
  archetype: 'GENERAL',
  status: 'ACTIVE',
  version: 0,
  latestReadiness: null,
  createdAt: '2026-09-30T00:00:00.000Z',
  updatedAt: '2026-09-30T00:00:00.000Z',
  rounds: [
    {
      id: 'round-1',
      type: 'CODING',
      title: 'Coding',
      weight: 1,
      ordinal: 0,
      version: 0,
      tasks: [],
      readiness: null,
    },
  ],
  snapshots: [],
  peerSessions: [],
};

function repository(): jest.Mocked<IInterviewPreparationRepository> {
  return {
    getOverview: jest.fn(),
    listUpcomingPreparationTargets: jest.fn().mockResolvedValue([]),
    findOwnedJobApplication: jest.fn().mockResolvedValue(application),
    findOwnedPlan: jest.fn().mockResolvedValue(plan),
    getReadinessEvidence: jest.fn().mockResolvedValue({
      revision: 0,
      coding: { score: null, observedAt: null },
      review: { score: null, observedAt: null },
      learning: { score: null, observedAt: null },
      resume: { score: null, observedAt: null },
      peer: { score: null, observedAt: null },
      mockInterviews: [],
    }),
    createPlan: jest.fn().mockResolvedValue(plan),
    updatePlan: jest.fn().mockResolvedValue(plan),
    setPlanStatus: jest.fn().mockResolvedValue(plan),
    createRound: jest.fn(),
    updateRound: jest.fn(),
    createTask: jest.fn(),
    updateTask: jest.fn(),
    invalidateActivePlans: jest.fn().mockResolvedValue(0),
    completeMockInterviewTask: jest.fn().mockResolvedValue(false),
    setTaskCompletion: jest.fn(),
    createSnapshot: jest.fn(),
    saveSnapshotExplanation: jest.fn(),
    createPeerSession: jest.fn(),
    findPeerSessionForParticipant: jest.fn(),
    updatePeerSessionStatus: jest.fn(),
    reschedulePeerSession: jest.fn(),
    createScorecard: jest.fn(),
  };
}

const createInput = {
  jobApplicationId: application.id,
  targetAt: '2026-10-15T15:00:00.000Z',
  timeZone: 'America/New_York',
  archetype: 'GENERAL' as const,
  rounds: [{ type: 'CODING' as const, title: 'Coding', weight: 1 }],
};

describe('InterviewPreparationService', () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date('2026-09-30T12:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('creates an owned plan with generated usable tasks', async () => {
    const repo = repository();
    const service = new InterviewPreparationService(repo);

    await expect(service.create('user-1', createInput)).resolves.toEqual(plan);

    const record = repo.createPlan.mock.calls[0]?.[0];
    expect(record?.tasks.length).toBeGreaterThan(0);
    expect(record?.tasks.every((task) => task.deepLink?.startsWith('/dashboard/'))).toBe(true);
  });

  it('does not expose whether another user owns an application', async () => {
    const repo = repository();
    repo.findOwnedJobApplication.mockResolvedValue(null);
    const service = new InterviewPreparationService(repo);

    await expect(service.preview('user-2', createInput)).rejects.toBeInstanceOf(NotFoundException);
    expect(repo.createPlan).not.toHaveBeenCalled();
  });

  it('translates duplicate plan creation into a conflict', async () => {
    const repo = repository();
    repo.createPlan.mockResolvedValue('DUPLICATE');
    const service = new InterviewPreparationService(repo);

    await expect(service.create('user-1', createInput)).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects stale optimistic versions', async () => {
    const repo = repository();
    repo.updatePlan.mockResolvedValue('VERSION_CONFLICT');
    const service = new InterviewPreparationService(repo);

    await expect(
      service.updatePlan('user-1', plan.id, { version: 4, status: 'COMPLETED' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('creates insufficient evidence instead of a zero readiness score', async () => {
    const repo = repository();
    repo.createSnapshot.mockImplementation(async (_userId, _planId, snapshot) => ({
      id: 'snapshot-1',
      ...snapshot,
    }));
    const service = new InterviewPreparationService(repo);

    const snapshot = await service.refreshSnapshot('user-1', plan.id);

    expect(snapshot.score).toBeNull();
    expect(snapshot.status).toBe('INSUFFICIENT_EVIDENCE');
    expect(snapshot.rounds[0]?.missingEvidence).toContain('CODING_SUBMISSIONS');
  });

  it('counts the latest matching mock interviews as round evidence', async () => {
    const repo = repository();
    repo.getReadinessEvidence.mockResolvedValue({
      revision: 0,
      coding: { score: null, observedAt: null },
      review: { score: null, observedAt: null },
      learning: { score: null, observedAt: null },
      resume: { score: null, observedAt: null },
      peer: { score: null, observedAt: null },
      mockInterviews: [
        { topic: 'DSA', score: 80, observedAt: new Date('2026-09-29T12:00:00.000Z') },
        { topic: 'SYSTEM_DESIGN', score: 20, observedAt: new Date('2026-09-29T13:00:00.000Z') },
      ],
    });
    repo.createSnapshot.mockImplementation(async (_userId, _planId, snapshot) => ({
      id: 'snapshot-1',
      ...snapshot,
    }));
    const service = new InterviewPreparationService(repo);

    const snapshot = await service.refreshSnapshot('user-1', plan.id);

    expect(snapshot.formulaVersion).toBe('v2');
    const evidence = snapshot.rounds[0]?.evidence.find((item) => item.source === 'MOCK_INTERVIEW');
    expect(evidence?.score).toBe(80);
    expect(snapshot.rounds[0]?.missingEvidence).not.toContain('MOCK_INTERVIEW');
  });

  it('records a completed mock interview against its task and active plans', async () => {
    const repo = repository();
    const service = new InterviewPreparationService(repo);

    await service.recordMockInterviewCompleted('user-1', 'task-1');
    await service.recordMockInterviewCompleted('user-1', null);

    expect(repo.completeMockInterviewTask).toHaveBeenCalledTimes(1);
    expect(repo.completeMockInterviewTask).toHaveBeenCalledWith('user-1', 'task-1');
    expect(repo.invalidateActivePlans).toHaveBeenCalledTimes(2);
  });
});

describe('mockInterviewMetricFor', () => {
  const at = (hour: number): Date => new Date(`2026-09-29T${String(hour).padStart(2, '0')}:00:00.000Z`);

  it('averages the three most recent sessions for the round topics', () => {
    const metric = mockInterviewMetricFor('CODING', [
      { topic: 'CODING', score: 10, observedAt: at(1) },
      { topic: 'DSA', score: 60, observedAt: at(2) },
      { topic: 'CODING', score: 70, observedAt: at(3) },
      { topic: 'BEHAVIORAL', score: 100, observedAt: at(4) },
      { topic: 'DSA', score: 80, observedAt: at(5) },
    ]);

    expect(metric).toEqual({ score: 70, observedAt: at(5) });
  });

  it('maps role-fit rounds to behavioral sessions and reports missing evidence', () => {
    expect(
      mockInterviewMetricFor('RESUME_ROLE_FIT', [{ topic: 'BEHAVIORAL', score: 64, observedAt: at(1) }]),
    ).toEqual({ score: 64, observedAt: at(1) });
    expect(mockInterviewMetricFor('SYSTEM_DESIGN', [{ topic: 'CODING', score: 90, observedAt: at(1) }])).toEqual({
      score: null,
      observedAt: null,
    });
  });
});
