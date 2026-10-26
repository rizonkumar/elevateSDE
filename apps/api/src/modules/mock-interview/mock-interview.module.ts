import { Module } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { MockInterviewService } from './application/mock-interview.service';
import { IMockInterviewRepository } from './domain/interfaces/mock-interview-repository.interface';
import { IMockInterviewer } from './domain/interfaces/mock-interviewer.interface';
import { DeterministicMockInterviewer } from './infrastructure/interviewers/deterministic-mock-interviewer';
import { OpenAiCompatibleMockInterviewer } from './infrastructure/interviewers/openai-compatible-mock-interviewer';
import { ResilientMockInterviewer } from './infrastructure/interviewers/resilient-mock-interviewer';
import { MockInterviewScoringProcessor } from './infrastructure/processors/mock-interview-scoring.processor';
import { MockInterviewRepository } from './infrastructure/repositories/mock-interview.repository';
import { MockInterviewController } from './presentation/controllers/mock-interview.controller';

@Module({
  controllers: [MockInterviewController],
  providers: [
    MockInterviewService,
    MockInterviewScoringProcessor,
    DeterministicMockInterviewer,
    OpenAiCompatibleMockInterviewer,
    PrismaService,
    { provide: IMockInterviewer, useClass: ResilientMockInterviewer },
    { provide: IMockInterviewRepository, useClass: MockInterviewRepository },
  ],
  exports: [MockInterviewService],
})
export class MockInterviewModule {}
