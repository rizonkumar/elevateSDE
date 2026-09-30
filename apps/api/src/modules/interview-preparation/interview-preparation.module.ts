import { Module } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { UsersModule } from '../users/users.module';
import { InterviewPreparationService } from './application/interview-preparation.service';
import { PeerPracticeService } from './application/peer-practice.service';
import { ReadinessNarrativeService } from './application/readiness-narrative.service';
import { IReadinessNarrativeProvider } from './domain/interfaces/readiness-narrative-provider.interface';
import { IInterviewPreparationRepository } from './domain/interfaces/interview-preparation-repository.interface';
import { InterviewPreparationRepository } from './infrastructure/repositories/interview-preparation.repository';
import { OpenAiCompatibleReadinessProvider } from './infrastructure/providers/openai-compatible-readiness.provider';
import { InterviewPreparationController } from './presentation/controllers/interview-preparation.controller';

@Module({
  imports: [UsersModule],
  controllers: [InterviewPreparationController],
  providers: [
    InterviewPreparationService,
    PeerPracticeService,
    ReadinessNarrativeService,
    PrismaService,
    { provide: IReadinessNarrativeProvider, useClass: OpenAiCompatibleReadinessProvider },
    { provide: IInterviewPreparationRepository, useClass: InterviewPreparationRepository },
  ],
  exports: [InterviewPreparationService],
})
export class InterviewPreparationModule {}
