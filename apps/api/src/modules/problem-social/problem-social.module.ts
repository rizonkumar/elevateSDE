import { Module } from '@nestjs/common';
import { IProblemSocialRepository } from './domain/interfaces/problem-social-repository.interface';
import { ProblemSocialRepository } from './infrastructure/repositories/problem-social.repository';
import { ProblemSocialService } from './application/problem-social.service';
import { ProblemDiscussionController } from './presentation/controllers/problem-discussion.controller';
import { DiscussionController } from './presentation/controllers/discussion.controller';
import { MeCurationController } from './presentation/controllers/me-curation.controller';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

@Module({
  controllers: [ProblemDiscussionController, DiscussionController, MeCurationController],
  providers: [
    ProblemSocialService,
    PrismaService,
    {
      provide: IProblemSocialRepository,
      useClass: ProblemSocialRepository,
    },
  ],
  exports: [ProblemSocialService],
})
export class ProblemSocialModule {}
