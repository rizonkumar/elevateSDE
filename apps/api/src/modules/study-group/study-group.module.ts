import { Module } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { IStudyGroupRepository } from './domain/interfaces/study-group-repository.interface';
import { StudyGroupRepository } from './infrastructure/repositories/study-group.repository';
import { StudyGroupService } from './application/study-group.service';
import { StudyGroupActivityService } from './application/study-group-activity.service';
import { StudyGroupActivityListener } from './presentation/listeners/study-group-activity.listener';
import { StudyGroupRoomAuthorizer } from './presentation/realtime/study-group-room.authorizer';
import { StudyGroupsController } from './presentation/controllers/study-groups.controller';

@Module({
  controllers: [StudyGroupsController],
  providers: [
    StudyGroupService,
    StudyGroupActivityService,
    StudyGroupActivityListener,
    StudyGroupRoomAuthorizer,
    PrismaService,
    {
      provide: IStudyGroupRepository,
      useClass: StudyGroupRepository,
    },
  ],
  exports: [StudyGroupService],
})
export class StudyGroupModule {}
