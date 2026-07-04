import { ProblemSummaryResponseDto } from '../../../problem/presentation/dtos/problem-summary-response.dto';
import { ReviewItemView } from '../../domain/read-models/review-item-view';
import { ReviewItemResponseDto } from '../dtos/review-item-response.dto';

export class ReviewPresentationMapper {
  static toItem(view: ReviewItemView): ReviewItemResponseDto {
    const problem = new ProblemSummaryResponseDto();
    problem.id = view.problem.id;
    problem.title = view.problem.title;
    problem.difficulty = view.problem.difficulty;
    problem.tags = view.problem.tags;
    problem.timeLimitMinutes = view.problem.timeLimitMinutes;

    const dto = new ReviewItemResponseDto();
    dto.problem = problem;
    dto.ease = view.ease;
    dto.intervalDays = view.intervalDays;
    dto.repetitions = view.repetitions;
    dto.dueAt = view.dueAt.toISOString();
    dto.lastReviewedAt = view.lastReviewedAt ? view.lastReviewedAt.toISOString() : null;
    return dto;
  }
}
