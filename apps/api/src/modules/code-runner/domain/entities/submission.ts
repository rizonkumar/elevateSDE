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
  updatedAt: Date;
}

export interface QueuedSubmissionProps {
  id: string;
  userId: string;
  problemId: string;
  language: AssessmentLanguage;
  sourceCode: string;
  createdAt: Date;
}

export interface SubmissionOutcome {
  status: SubmissionStatus;
  passedCount: number;
  totalCount: number;
  totalRuntimeMs: number;
  peakMemoryKb: number;
  stdout: string;
  results: SubmissionResult[];
}

export class Submission {
  private constructor(private readonly props: SubmissionProps) {}

  static createQueued(props: QueuedSubmissionProps): Submission {
    return new Submission({
      ...props,
      status: SubmissionStatus.QUEUED,
      passedCount: 0,
      totalCount: 0,
      totalRuntimeMs: 0,
      peakMemoryKb: 0,
      stdout: '',
      results: [],
      updatedAt: props.createdAt,
    });
  }

  static reconstitute(props: SubmissionProps): Submission {
    return new Submission(props);
  }

  markRunning(): void {
    this.props.status = SubmissionStatus.RUNNING;
  }

  applyOutcome(outcome: SubmissionOutcome): void {
    this.props.status = outcome.status;
    this.props.passedCount = outcome.passedCount;
    this.props.totalCount = outcome.totalCount;
    this.props.totalRuntimeMs = outcome.totalRuntimeMs;
    this.props.peakMemoryKb = outcome.peakMemoryKb;
    this.props.stdout = outcome.stdout;
    this.props.results = outcome.results;
  }

  markFailed(message: string): void {
    this.props.status = SubmissionStatus.RUNTIME_ERROR;
    this.props.stdout = message;
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

  getUpdatedAt(): Date {
    return this.props.updatedAt;
  }
}
