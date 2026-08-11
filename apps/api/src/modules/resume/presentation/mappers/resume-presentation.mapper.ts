import { ResumeAnalysis } from '../../domain/entities/resume-analysis';
import { ResumeResponseDto } from '../dtos/resume-response.dto';

export class ResumePresentationMapper {
  static toResponse(resume: ResumeAnalysis): ResumeResponseDto {
    const dto = new ResumeResponseDto();
    dto.id = resume.getId();
    dto.userId = resume.getUserId();
    dto.fileName = resume.getFileName();
    dto.fileUrl = null;
    dto.status = resume.getStatus();
    dto.atsScore = resume.getAtsScore();
    dto.parsedSkills = resume.getParsedSkills();
    dto.missingSkills = resume.getMissingSkills();
    dto.structureFeedback = resume.getStructureFeedback();
    dto.actionableTips = resume.getActionableTips();
    dto.summary = resume.getSummary();
    dto.createdAt = resume.getCreatedAt().toISOString();
    dto.updatedAt = resume.getUpdatedAt().toISOString();
    return dto;
  }
}
