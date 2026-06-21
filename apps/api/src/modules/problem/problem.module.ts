import { Module } from '@nestjs/common';
import { IProblemRepository } from './domain/interfaces/problem-repository.interface';
import { ProblemRepository } from './infrastructure/repositories/problem.repository';
import { ProblemService } from './application/problem.service';
import { ProblemsController } from './presentation/controllers/problems.controller';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

@Module({
  controllers: [ProblemsController],
  providers: [
    ProblemService,
    PrismaService,
    {
      provide: IProblemRepository,
      useClass: ProblemRepository,
    },
  ],
  exports: [ProblemService],
})
export class ProblemModule {}
