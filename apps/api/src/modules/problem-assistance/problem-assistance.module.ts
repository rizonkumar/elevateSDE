import { Module } from '@nestjs/common';
import { ProblemModule } from '../problem/problem.module';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { IProblemAssistanceRepository } from './domain/interfaces/problem-assistance-repository.interface';
import { ProblemAssistanceRepository } from './infrastructure/repositories/problem-assistance.repository';
import { ProblemAssistanceService } from './application/problem-assistance.service';
import { ProblemAssistanceListener } from './application/listeners/problem-assistance.listener';
import { ProblemAssistanceController } from './presentation/controllers/problem-assistance.controller';
import { ProblemGuidanceAdminController } from './presentation/controllers/problem-guidance-admin.controller';

@Module({
  imports: [ProblemModule],
  controllers: [ProblemAssistanceController, ProblemGuidanceAdminController],
  providers: [
    ProblemAssistanceService,
    ProblemAssistanceListener,
    PrismaService,
    {
      provide: IProblemAssistanceRepository,
      useClass: ProblemAssistanceRepository,
    },
  ],
  exports: [ProblemAssistanceService],
})
export class ProblemAssistanceModule {}
