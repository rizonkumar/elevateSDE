import { SubmissionStatusValue } from '@elevatesde/shared-types';
import { Submission } from '../../domain/entities/submission';
import { SubmissionPage } from '../../domain/interfaces/submission-repository.interface';
import { SubmissionPageResponseDto } from '../dtos/submission-page-response.dto';
import { fromPrismaLanguage } from '../../application/language';
import { SubmissionResponseDto } from '../dtos/submission-response.dto';

export class SubmissionPresentationMapper {
  static toResponse(submission: Submission): SubmissionResponseDto {
    const dto = new SubmissionResponseDto();
    dto.id = submission.getId();
    dto.problemId = submission.getProblemId();
    dto.language = fromPrismaLanguage[submission.getLanguage()];
    dto.status = submission.getStatus() as SubmissionStatusValue;
    dto.passedCount = submission.getPassedCount();
    dto.totalCount = submission.getTotalCount();
    dto.totalRuntimeMs = submission.getTotalRuntimeMs();
    dto.peakMemoryKb = submission.getPeakMemoryKb();
    dto.runtimePercentile = submission.getRuntimePercentile();
    dto.memoryPercentile = submission.getMemoryPercentile();
    dto.createdAt = submission.getCreatedAt().toISOString();
    return dto;
  }

  static toPageResponse(page: SubmissionPage): SubmissionPageResponseDto {
    const dto = new SubmissionPageResponseDto();
    dto.items = page.items.map((submission) => SubmissionPresentationMapper.toResponse(submission));
    dto.nextCursor = page.nextCursor;
    return dto;
  }
}
