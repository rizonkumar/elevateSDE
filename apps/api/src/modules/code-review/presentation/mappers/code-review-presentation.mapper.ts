import { CodeReviewQuota } from '../../application/code-review.service';
import { SubmissionReviewView } from '../../domain/review/submission-review-view';
import {
  CodeReviewQuotaResponseDto,
  SubmissionReviewResponseDto,
} from '../dtos/submission-review-response.dto';

export class CodeReviewPresentationMapper {
  static toResponse(view: SubmissionReviewView): SubmissionReviewResponseDto {
    const dto = new SubmissionReviewResponseDto();
    dto.id = view.id;
    dto.submissionId = view.submissionId;
    dto.status = view.status;
    dto.engine = view.engine;
    dto.timeComplexity = view.timeComplexity;
    dto.spaceComplexity = view.spaceComplexity;
    dto.summary = view.summary;
    dto.findings = view.findings.map((finding) => ({ ...finding }));
    dto.failureReason = view.failureReason;
    dto.createdAt = view.createdAt.toISOString();
    dto.completedAt = view.completedAt ? view.completedAt.toISOString() : null;
    return dto;
  }

  static toQuotaResponse(quota: CodeReviewQuota): CodeReviewQuotaResponseDto {
    const dto = new CodeReviewQuotaResponseDto();
    dto.limit = quota.limit;
    dto.used = quota.used;
    dto.remaining = quota.remaining;
    dto.enabled = quota.enabled;
    return dto;
  }
}
