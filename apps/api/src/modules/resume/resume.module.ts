import { Module } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { ResumeService } from './application/resume.service';
import { IResumeRepository } from './domain/interfaces/resume-repository.interface';
import { ResumeRepository } from './infrastructure/repositories/resume.repository';
import { IResumeAnalyzer } from './domain/interfaces/resume-analyzer.interface';
import { HeuristicResumeAnalyzer } from './infrastructure/analyzers/heuristic-resume.analyzer';
import { IResumeTextExtractor } from './domain/interfaces/resume-text-extractor.interface';
import { ResumeTextExtractor } from './infrastructure/extractors/resume-text.extractor';
import { ResumeAnalysisProcessor } from './infrastructure/processors/resume-analysis.processor';
import { ResumeController } from './presentation/controllers/resume.controller';

@Module({
  controllers: [ResumeController],
  providers: [
    ResumeService,
    PrismaService,
    ResumeAnalysisProcessor,
    { provide: IResumeRepository, useClass: ResumeRepository },
    { provide: IResumeAnalyzer, useClass: HeuristicResumeAnalyzer },
    { provide: IResumeTextExtractor, useClass: ResumeTextExtractor },
  ],
  exports: [ResumeService],
})
export class ResumeModule {}
