import { BadRequestException, ConflictException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import type { PeerPracticeSessionDto } from '@elevatesde/shared-types';
import { UsersService } from '../../users/application/users.service';
import { IInterviewPreparationRepository } from '../domain/interfaces/interview-preparation-repository.interface';
import { PeerPracticeService } from './peer-practice.service';

const session: PeerPracticeSessionDto = {
  id: 'session-1',
  planId: 'plan-1',
  roundId: 'round-1',
  organizer: { id: 'organizer-1', displayName: 'Organizer' },
  invitee: { id: 'invitee-1', displayName: 'Invitee' },
  status: 'PENDING',
  startsAt: '2026-10-01T12:00:00.000Z',
  timeZone: 'UTC',
  durationMinutes: 60,
  meetingUrl: 'https://meet.example.com/room',
  scorecards: [],
  version: 0,
  createdAt: '2026-09-30T00:00:00.000Z',
  updatedAt: '2026-09-30T00:00:00.000Z',
};

function repository(): jest.Mocked<IInterviewPreparationRepository> {
  return {
    getOverview: jest.fn(),
    findOwnedJobApplication: jest.fn(),
    findOwnedPlan: jest.fn(),
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
    saveSnapshotExplanation: jest.fn(),
    createPeerSession: jest.fn().mockResolvedValue(session),
    findPeerSessionForParticipant: jest.fn().mockResolvedValue(session),
    updatePeerSessionStatus: jest.fn(),
    reschedulePeerSession: jest.fn(),
    createScorecard: jest.fn(),
  };
}

function users(inviteeId = 'invitee-1'): jest.Mocked<UsersService> {
  return {
    findByEmail: jest.fn().mockResolvedValue({ getId: () => inviteeId }),
  } as unknown as jest.Mocked<UsersService>;
}

function emitter(): jest.Mocked<EventEmitter2> {
  return { emit: jest.fn() } as unknown as jest.Mocked<EventEmitter2>;
}

const createInput = {
  roundId: 'round-1',
  inviteeEmail: 'invitee@example.com',
  startsAt: '2026-10-01T12:00:00.000Z',
  timeZone: 'UTC',
  durationMinutes: 60,
  meetingUrl: 'https://meet.example.com/room',
};

describe('PeerPracticeService', () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date('2026-09-30T12:00:00.000Z'));
  });

  afterEach(() => jest.useRealTimers());

  it('creates an invitation and emits a participant notification', async () => {
    const repo = repository();
    const events = emitter();
    const service = new PeerPracticeService(repo, users(), events);

    await expect(service.create('organizer-1', 'plan-1', createInput)).resolves.toEqual(session);
    expect(events.emit).toHaveBeenCalledWith('notification.peer-invitation', expect.objectContaining({ recipientId: 'invitee-1' }));
  });

  it('rejects self-invites without revealing account details', async () => {
    const service = new PeerPracticeService(repository(), users('organizer-1'), emitter());

    await expect(service.create('organizer-1', 'plan-1', createInput)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects duplicate invitations', async () => {
    const repo = repository();
    repo.createPeerSession.mockResolvedValue('DUPLICATE');
    const service = new PeerPracticeService(repo, users(), emitter());

    await expect(service.create('organizer-1', 'plan-1', createInput)).rejects.toBeInstanceOf(ConflictException);
  });

  it('enforces invitee-only acceptance', async () => {
    const service = new PeerPracticeService(repository(), users(), emitter());

    await expect(service.updateStatus('organizer-1', session.id, 'ACCEPTED', 0)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('submits one participant-owned scorecard', async () => {
    const repo = repository();
    repo.findPeerSessionForParticipant.mockResolvedValue({ ...session, status: 'COMPLETED' });
    repo.createScorecard.mockResolvedValue('DUPLICATE');
    const service = new PeerPracticeService(repo, users(), emitter());

    await expect(
      service.submitScorecard('organizer-1', session.id, {
        communication: 80,
        problemSolving: 80,
        technicalDepth: 80,
        structure: 80,
        strengths: ['Clear communication'],
        improvements: ['State tradeoffs earlier'],
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
