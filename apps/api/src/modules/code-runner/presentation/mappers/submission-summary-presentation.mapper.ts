import { SubmissionStatusValue } from '@elevatesde/shared-types';
import { SubmissionListPage, SubmissionSummaryView } from '../../domain/read-models/submission-summary-view';
import { fromPrismaLanguage } from '../../application/language';
import { SubmissionListResponseDto } from '../dtos/submission-list-response.dto';
import { SubmissionSummaryResponseDto } from '../dtos/submission-summary-response.dto';

export class SubmissionSummaryPresentationMapper {
  static toResponse(view: SubmissionSummaryView): SubmissionSummaryResponseDto {
    const dto = new SubmissionSummaryResponseDto();
    dto.id = view.id;
    dto.problemId = view.problemId;
    dto.problemTitle = view.problemTitle;
    dto.problemDifficulty = view.problemDifficulty;
    dto.language = fromPrismaLanguage[view.language];
    dto.status = view.status as SubmissionStatusValue;
    dto.passedCount = view.passedCount;
    dto.totalCount = view.totalCount;
    dto.totalRuntimeMs = view.totalRuntimeMs;
    dto.peakMemoryKb = view.peakMemoryKb;
    dto.createdAt = view.createdAt.toISOString();
    return dto;
  }

  static toListResponse(
    page: SubmissionListPage,
    pageNumber: number,
    pageSize: number,
  ): SubmissionListResponseDto {
    const dto = new SubmissionListResponseDto();
    dto.items = page.items.map((item) => this.toResponse(item));
    dto.total = page.total;
    dto.page = pageNumber;
    dto.pageSize = pageSize;
    return dto;
  }
}
