import { randomUUID } from 'node:crypto';
import { ResumeFeedbackItem, ResumeStatus } from '@elevatesde/shared-types';
import { ResumeScoreResult } from '../interfaces/resume-analyzer.interface';

export interface ResumeAnalysisProps {
  id: string;
  userId: string;
  tenantId: string | null;
  fileName: string;
  status: ResumeStatus;
  atsScore: number | null;
  parsedSkills: string[];
  missingSkills: string[];
  structureFeedback: ResumeFeedbackItem[];
  actionableTips: string[];
  summary: string | null;
  failureReason: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePendingResumeInput {
  userId: string;
  tenantId: string | null;
  fileName: string;
  now: Date;
}

export class ResumeAnalysis {
  private constructor(private readonly props: ResumeAnalysisProps) {}

  static createPending(input: CreatePendingResumeInput): ResumeAnalysis {
    return new ResumeAnalysis({
      id: randomUUID(),
      userId: input.userId,
      tenantId: input.tenantId,
      fileName: input.fileName,
      status: 'PROCESSING',
      atsScore: null,
      parsedSkills: [],
      missingSkills: [],
      structureFeedback: [],
      actionableTips: [],
      summary: null,
      failureReason: null,
      createdAt: input.now,
      updatedAt: input.now,
    });
  }

  static reconstitute(props: ResumeAnalysisProps): ResumeAnalysis {
    return new ResumeAnalysis(props);
  }

  markCompleted(result: ResumeScoreResult, completedAt: Date): ResumeAnalysis {
    return ResumeAnalysis.reconstitute({
      ...this.props,
      status: 'COMPLETED',
      atsScore: result.atsScore,
      parsedSkills: result.parsedSkills,
      missingSkills: result.missingSkills,
      structureFeedback: result.structureFeedback,
      actionableTips: result.actionableTips,
      summary: result.summary,
      updatedAt: completedAt,
    });
  }

  markFailed(reason: string, failedAt: Date): ResumeAnalysis {
    return ResumeAnalysis.reconstitute({
      ...this.props,
      status: 'FAILED',
      failureReason: reason,
      updatedAt: failedAt,
    });
  }

  getId(): string {
    return this.props.id;
  }

  getUserId(): string {
    return this.props.userId;
  }

  getTenantId(): string | null {
    return this.props.tenantId;
  }

  getFileName(): string {
    return this.props.fileName;
  }

  getStatus(): ResumeStatus {
    return this.props.status;
  }

  getAtsScore(): number | null {
    return this.props.atsScore;
  }

  getParsedSkills(): string[] {
    return this.props.parsedSkills;
  }

  getMissingSkills(): string[] {
    return this.props.missingSkills;
  }

  getStructureFeedback(): ResumeFeedbackItem[] {
    return this.props.structureFeedback;
  }

  getActionableTips(): string[] {
    return this.props.actionableTips;
  }

  getSummary(): string | null {
    return this.props.summary;
  }

  getFailureReason(): string | null {
    return this.props.failureReason;
  }

  getCreatedAt(): Date {
    return this.props.createdAt;
  }

  getUpdatedAt(): Date {
    return this.props.updatedAt;
  }
}
