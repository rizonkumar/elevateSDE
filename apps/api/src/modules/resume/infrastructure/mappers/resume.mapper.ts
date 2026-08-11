import { Prisma, Resume as PrismaResume } from '@prisma/client';
import { ResumeFeedbackItem, ResumeStatus } from '@elevatesde/shared-types';
import { ResumeAnalysis } from '../../domain/entities/resume-analysis';

export interface ResumeAnalysisUpdateData {
  status: ResumeStatus;
  atsScore: number | null;
  parsedSkills: string[];
  missingSkills: string[];
  structureFeedback: Prisma.InputJsonValue;
  actionableTips: string[];
  summary: string | null;
  failureReason: string | null;
}

export class ResumeMapper {
  static toDomain(record: PrismaResume): ResumeAnalysis {
    return ResumeAnalysis.reconstitute({
      id: record.id,
      userId: record.userId,
      tenantId: record.tenantId,
      fileName: record.fileName,
      status: record.status,
      atsScore: record.atsScore,
      parsedSkills: record.parsedSkills,
      missingSkills: record.missingSkills,
      structureFeedback: (record.structureFeedback as ResumeFeedbackItem[] | null) ?? [],
      actionableTips: record.actionableTips,
      summary: record.summary,
      failureReason: record.failureReason,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }

  static toPersistence(
    resume: ResumeAnalysis,
  ): Pick<PrismaResume, 'id' | 'userId' | 'tenantId' | 'fileName'> & ResumeAnalysisUpdateData {
    return {
      id: resume.getId(),
      userId: resume.getUserId(),
      tenantId: resume.getTenantId(),
      fileName: resume.getFileName(),
      ...ResumeMapper.toAnalysisUpdate(resume),
    };
  }

  static toAnalysisUpdate(resume: ResumeAnalysis): ResumeAnalysisUpdateData {
    return {
      status: resume.getStatus(),
      atsScore: resume.getAtsScore(),
      parsedSkills: resume.getParsedSkills(),
      missingSkills: resume.getMissingSkills(),
      structureFeedback: resume.getStructureFeedback() as unknown as Prisma.InputJsonValue,
      actionableTips: resume.getActionableTips(),
      summary: resume.getSummary(),
      failureReason: resume.getFailureReason(),
    };
  }
}
