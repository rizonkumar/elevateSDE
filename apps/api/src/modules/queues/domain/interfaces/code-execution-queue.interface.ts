import { AssessmentLanguage } from '@elevatesde/shared-types';

export interface CodeExecutionJobData {
  submissionId: string;
  userId: string;
  problemId: string;
  language: AssessmentLanguage;
  code: string;
}

export abstract class ICodeExecutionQueue {
  abstract enqueue(data: CodeExecutionJobData): Promise<void>;
}
