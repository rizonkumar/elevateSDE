import { Submission } from '../../domain/entities/submission';
import { fromPrismaLanguage } from '../../application/language';
import { SubmissionResponseDto } from '../dtos/submission-response.dto';

export class SubmissionPresentationMapper {
  static toResponse(submission: Submission): SubmissionResponseDto {
    const dto = new SubmissionResponseDto();
    dto.id = submission.getId();
    dto.problemId = submission.getProblemId();
    dto.language = fromPrismaLanguage[submission.getLanguage()];
    dto.status = submission.getStatus();
    dto.passedCount = submission.getPassedCount();
    dto.totalCount = submission.getTotalCount();
    dto.totalRuntimeMs = submission.getTotalRuntimeMs();
    dto.peakMemoryKb = submission.getPeakMemoryKb();
    dto.createdAt = submission.getCreatedAt().toISOString();
    return dto;
  }
}
