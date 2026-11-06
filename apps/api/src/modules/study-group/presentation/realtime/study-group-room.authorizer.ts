import { Injectable, OnModuleInit } from '@nestjs/common';
import { RoomAuthorizerRegistry } from '../../../realtime/application/room-authorizer.registry';
import { RealtimeViewer, RoomAuthorizer } from '../../../realtime/domain/room-authorizer';
import { StudyGroupService } from '../../application/study-group.service';

@Injectable()
export class StudyGroupRoomAuthorizer implements RoomAuthorizer, OnModuleInit {
  readonly kind = 'group' as const;

  constructor(
    private readonly registry: RoomAuthorizerRegistry,
    private readonly studyGroupService: StudyGroupService,
  ) {}

  onModuleInit(): void {
    this.registry.register(this);
  }

  async canJoin(viewer: RealtimeViewer, groupId: string): Promise<boolean> {
    return this.studyGroupService.canJoinRoom(viewer.userId, viewer.tenantId, groupId);
  }
}
