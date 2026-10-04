import { ConflictException, NotFoundException } from '@nestjs/common';
import type {
  InterviewPreparationPlanDto,
  JobApplicationDto,
} from '@elevatesde/shared-types';
import { InterviewPreparationService } from './interview-preparation.service';
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
    }),
    createPlan: jest.fn().mockResolvedValue(plan),
    updatePlan: jest.fn().mockResolvedValue(plan),
    setPlanStatus: jest.fn().mockResolvedValue(plan),
    createRound: jest.fn(),
    updateRound: jest.fn(),
    createTask: jest.fn(),
    updateTask: jest.fn(),
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
});
