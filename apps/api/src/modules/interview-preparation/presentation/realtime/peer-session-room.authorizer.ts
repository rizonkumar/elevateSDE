import { Injectable, OnModuleInit } from '@nestjs/common';
import { RoomAuthorizerRegistry } from '../../../realtime/application/room-authorizer.registry';
import { RealtimeViewer, RoomAuthorizer } from '../../../realtime/domain/room-authorizer';
import { PeerPracticeService } from '../../application/peer-practice.service';

@Injectable()
export class PeerSessionRoomAuthorizer implements RoomAuthorizer, OnModuleInit {
  readonly kind = 'peer' as const;

  constructor(
    private readonly registry: RoomAuthorizerRegistry,
    private readonly peerPracticeService: PeerPracticeService,
  ) {}

  onModuleInit(): void {
    this.registry.register(this);
  }

  async canJoin(viewer: RealtimeViewer, sessionId: string): Promise<boolean> {
    return this.peerPracticeService.isParticipant(viewer.userId, sessionId);
  }
}
