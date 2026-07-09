import { Module } from '@nestjs/common';
import { ILearningPathRepository } from './domain/interfaces/learning-path-repository.interface';
import { LearningPathRepository } from './infrastructure/repositories/learning-path.repository';
import { LearningPathService } from './application/learning-path.service';
import { LearningPathController } from './presentation/controllers/learning-path.controller';
import { LearningPathManagementController } from './presentation/controllers/learning-path-management.controller';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

@Module({
  controllers: [LearningPathController, LearningPathManagementController],
  providers: [
    LearningPathService,
    PrismaService,
    {
      provide: ILearningPathRepository,
      useClass: LearningPathRepository,
    },
  ],
  exports: [LearningPathService],
})
export class LearningPathModule {}
