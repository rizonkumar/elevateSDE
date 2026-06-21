import { AssessmentLanguage, SubmissionStatus } from '@prisma/client';
import { SubmissionResult } from './submission-result';

export interface SubmissionProps {
  id: string;
  userId: string;
  problemId: string;
  language: AssessmentLanguage;
  sourceCode: string;
  status: SubmissionStatus;
  passedCount: number;
  totalCount: number;
  totalRuntimeMs: number;
  peakMemoryKb: number;
  stdout: string;
  results: SubmissionResult[];
  createdAt: Date;
}

export class Submission {
  private constructor(private readonly props: SubmissionProps) {}

  static create(props: SubmissionProps): Submission {
    return new Submission(props);
  }

  static reconstitute(props: SubmissionProps): Submission {
    return new Submission(props);
  }

  getId(): string {
    return this.props.id;
  }

  getUserId(): string {
    return this.props.userId;
  }

  getProblemId(): string {
    return this.props.problemId;
  }

  getLanguage(): AssessmentLanguage {
    return this.props.language;
  }

  getSourceCode(): string {
    return this.props.sourceCode;
  }

  getStatus(): SubmissionStatus {
    return this.props.status;
  }

  getPassedCount(): number {
    return this.props.passedCount;
  }

  getTotalCount(): number {
    return this.props.totalCount;
  }

  getTotalRuntimeMs(): number {
    return this.props.totalRuntimeMs;
  }

  getPeakMemoryKb(): number {
    return this.props.peakMemoryKb;
  }

  getStdout(): string {
    return this.props.stdout;
  }

  getResults(): SubmissionResult[] {
    return this.props.results;
  }

  getCreatedAt(): Date {
    return this.props.createdAt;
  }
}
