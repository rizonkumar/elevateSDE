import { Injectable } from '@nestjs/common';
import {
  IResumeAnalyzer,
  ResumeScoreResult,
} from '../../domain/interfaces/resume-analyzer.interface';
import { scoreResumeText } from '../../domain/scoring/resume-scoring';

@Injectable()
export class HeuristicResumeAnalyzer implements IResumeAnalyzer {
  async analyze(text: string): Promise<ResumeScoreResult> {
    return scoreResumeText(text);
  }
}
