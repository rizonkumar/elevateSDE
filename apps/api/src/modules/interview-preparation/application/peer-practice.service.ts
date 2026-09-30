import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import type {
  CreatePeerPracticeSessionDto,
  PeerPracticeSessionDto,
  PeerPracticeStatus,
  PeerScorecardDto,
  ReschedulePeerPracticeSessionDto,
  SubmitPeerScorecardDto,
} from '@elevatesde/shared-types';
import { UsersService } from '../../users/application/users.service';
import { NOTIFICATION_EVENTS } from '../../notification/domain/events/notification-events';
import { PeerPracticeSession, PeerParticipantRole } from '../domain/entities/peer-practice-session';
import { IInterviewPreparationRepository } from '../domain/interfaces/interview-preparation-repository.interface';

@Injectable()
export class PeerPracticeService {
  constructor(
    private readonly repository: IInterviewPreparationRepository,
    private readonly usersService: UsersService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async get(userId: string, sessionId: string): Promise<PeerPracticeSessionDto> {
    return this.findSession(userId, sessionId);
  }

  async create(
    organizerId: string,
    planId: string,
    input: CreatePeerPracticeSessionDto,
  ): Promise<PeerPracticeSessionDto> {
    const startsAt = new Date(input.startsAt);
    this.validateSchedule(startsAt, input.durationMinutes, input.timeZone, input.meetingUrl);
    const invitee = await this.usersService.findByEmail(input.inviteeEmail.trim().toLowerCase());
    if (!invitee || invitee.getId() === organizerId) {
      throw new BadRequestException('Unable to invite that candidate');
    }
    const session = await this.repository.createPeerSession({
      planId,
      roundId: input.roundId,
      organizerId,
      inviteeId: invitee.getId(),
      startsAt,
      timeZone: input.timeZone,
      durationMinutes: input.durationMinutes,
      meetingUrl: input.meetingUrl,
    });
    if (session === null) throw new NotFoundException('Preparation plan or round not found');
    if (session === 'DUPLICATE') throw new ConflictException('This peer session already exists');
    const organizer = session.organizer.displayName;
    this.eventEmitter.emit(NOTIFICATION_EVENTS.PEER_INVITATION, {
      recipientId: invitee.getId(),
      planId,
      sessionId: session.id,
      organizerName: organizer,
    });
    return session;
  }

  async updateStatus(
    userId: string,
    sessionId: string,
    next: PeerPracticeStatus,
    version: number,
  ): Promise<PeerPracticeSessionDto> {
    const session = await this.findSession(userId, sessionId);
    const actor = this.actorRole(session, userId);
    try {
      PeerPracticeSession.assertTransition(
        session.status,
        next,
        actor,
        new Date(session.startsAt),
        new Date(),
      );
    } catch (error) {
      throw new BadRequestException(error instanceof Error ? error.message : 'Invalid session status');
    }
    const updated = await this.repository.updatePeerSessionStatus(userId, sessionId, next, version);
    const result = this.resolveVersioned(updated);
    const recipientId = actor === 'ORGANIZER' ? result.invitee.id : result.organizer.id;
    this.eventEmitter.emit(NOTIFICATION_EVENTS.PEER_SESSION_CHANGED, {
      recipientId,
      planId: result.planId,
      sessionId: result.id,
      status: result.status,
      dedupeKey: `peer-status:${result.id}:${result.status}:${result.version}:${recipientId}`,
    });
    if (result.status === 'COMPLETED') {
      for (const recipient of [result.organizer.id, result.invitee.id]) {
        this.eventEmitter.emit(NOTIFICATION_EVENTS.SCORECARD_REQUEST, {
          recipientId: recipient,
          planId: result.planId,
          sessionId: result.id,
          dedupeKey: `scorecard-request:${result.id}:${recipient}`,
        });
      }
    }
    return result;
  }

  async reschedule(
    userId: string,
    sessionId: string,
    input: ReschedulePeerPracticeSessionDto,
  ): Promise<PeerPracticeSessionDto> {
    const session = await this.findSession(userId, sessionId);
    if (session.organizer.id !== userId) throw new NotFoundException('Peer session not found');
    if (!['PENDING', 'ACCEPTED'].includes(session.status)) {
      throw new BadRequestException('This session can no longer be rescheduled');
    }
    this.validateSchedule(
      new Date(input.startsAt),
      input.durationMinutes,
      input.timeZone,
      input.meetingUrl,
    );
    const updated = await this.repository.reschedulePeerSession(userId, sessionId, input);
    const result = this.resolveVersioned(updated);
    this.eventEmitter.emit(NOTIFICATION_EVENTS.PEER_SESSION_CHANGED, {
      recipientId: result.invitee.id,
      planId: result.planId,
      sessionId: result.id,
      status: 'RESCHEDULED',
      dedupeKey: `peer-rescheduled:${result.id}:${result.version}:${result.invitee.id}`,
    });
    return result;
  }

  async submitScorecard(
    userId: string,
    sessionId: string,
    input: SubmitPeerScorecardDto,
  ): Promise<PeerScorecardDto> {
    await this.findSession(userId, sessionId);
    const scorecard = await this.repository.createScorecard(userId, sessionId, input);
    if (scorecard === null) throw new NotFoundException('Completed peer session not found');
    if (scorecard === 'DUPLICATE') throw new ConflictException('You already submitted feedback');
    return scorecard;
  }

  private validateSchedule(
    startsAt: Date,
    durationMinutes: number,
    timeZone: string,
    meetingUrl: string,
  ): void {
    try {
      PeerPracticeSession.assertSchedule(startsAt, durationMinutes, timeZone, new Date());
      PeerPracticeSession.assertMeetingUrl(meetingUrl);
    } catch (error) {
      throw new BadRequestException(error instanceof Error ? error.message : 'Invalid peer session');
    }
  }

  private async findSession(userId: string, sessionId: string): Promise<PeerPracticeSessionDto> {
    const session = await this.repository.findPeerSessionForParticipant(userId, sessionId);
    if (!session) throw new NotFoundException('Peer session not found');
    return session;
  }

  private actorRole(session: PeerPracticeSessionDto, userId: string): PeerParticipantRole {
    return session.organizer.id === userId ? 'ORGANIZER' : 'INVITEE';
  }

  private resolveVersioned(
    result: PeerPracticeSessionDto | 'VERSION_CONFLICT' | null,
  ): PeerPracticeSessionDto {
    if (result === null) throw new NotFoundException('Peer session not found');
    if (result === 'VERSION_CONFLICT') {
      throw new ConflictException('Peer session was modified; refresh and retry');
    }
    return result;
  }
}
