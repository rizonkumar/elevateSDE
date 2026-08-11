import { ResumeFeedbackItem } from '@elevatesde/shared-types';

export interface ResumeScoreResult {
  atsScore: number;
  parsedSkills: string[];
  missingSkills: string[];
  structureFeedback: ResumeFeedbackItem[];
  actionableTips: string[];
  summary: string;
}

export abstract class IResumeAnalyzer {
  abstract analyze(text: string): Promise<ResumeScoreResult>;
}
