import { Module } from '@nestjs/common';
import { IForumRepository } from './domain/interfaces/forum-repository.interface';
import { ForumRepository } from './infrastructure/repositories/forum.repository';
import { ForumService } from './application/forum.service';
import { ForumController } from './presentation/controllers/forum.controller';
import { ForumModerationController } from './presentation/controllers/forum-moderation.controller';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

@Module({
  controllers: [ForumController, ForumModerationController],
  providers: [
    ForumService,
    PrismaService,
    {
      provide: IForumRepository,
      useClass: ForumRepository,
    },
  ],
  exports: [ForumService],
})
export class ForumModule {}
