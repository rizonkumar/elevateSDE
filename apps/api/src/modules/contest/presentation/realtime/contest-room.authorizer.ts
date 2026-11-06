import { Injectable, OnModuleInit } from '@nestjs/common';
import { RoomAuthorizerRegistry } from '../../../realtime/application/room-authorizer.registry';
import { RealtimeViewer, RoomAuthorizer } from '../../../realtime/domain/room-authorizer';
import { ContestParticipationService } from '../../application/contest-participation.service';

@Injectable()
export class ContestRoomAuthorizer implements RoomAuthorizer, OnModuleInit {
  readonly kind = 'contest' as const;

  constructor(
    private readonly registry: RoomAuthorizerRegistry,
    private readonly participationService: ContestParticipationService,
  ) {}

  onModuleInit(): void {
    this.registry.register(this);
  }

  async canJoin(_viewer: RealtimeViewer, contestId: string): Promise<boolean> {
    return this.participationService.isVisibleContest(contestId);
  }
}
