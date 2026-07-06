import { Module } from '@nestjs/common';
import { IContestRepository } from './domain/interfaces/contest-repository.interface';
import { ContestRepository } from './infrastructure/repositories/contest.repository';
import { ContestService } from './application/contest.service';
import { ContestManagementController } from './presentation/controllers/contest-management.controller';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

@Module({
  controllers: [ContestManagementController],
  providers: [
    ContestService,
    PrismaService,
    {
      provide: IContestRepository,
      useClass: ContestRepository,
    },
  ],
  exports: [ContestService],
})
export class ContestModule {}
