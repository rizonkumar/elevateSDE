import { ContestDetailView, ContestSummaryView } from '../../domain/read-models/contest-view';
import {
  ContestDetailResponseDto,
  ContestProblemResponseDto,
} from '../dtos/contest-detail-response.dto';
import { ContestSummaryResponseDto } from '../dtos/contest-summary-response.dto';

export class ContestPresentationMapper {
  static toSummary(view: ContestSummaryView): ContestSummaryResponseDto {
    const dto = new ContestSummaryResponseDto();
    dto.id = view.id;
    dto.slug = view.slug;
    dto.title = view.title;
    dto.status = view.status;
    dto.startsAt = view.startsAt.toISOString();
    dto.endsAt = view.endsAt.toISOString();
    dto.problemCount = view.problemCount;
    dto.createdAt = view.createdAt.toISOString();
    dto.updatedAt = view.updatedAt.toISOString();
    return dto;
  }

  static toDetail(view: ContestDetailView): ContestDetailResponseDto {
    const dto = new ContestDetailResponseDto();
    dto.id = view.id;
    dto.slug = view.slug;
    dto.title = view.title;
    dto.status = view.status;
    dto.startsAt = view.startsAt.toISOString();
    dto.endsAt = view.endsAt.toISOString();
    dto.problemCount = view.problemCount;
    dto.createdAt = view.createdAt.toISOString();
    dto.updatedAt = view.updatedAt.toISOString();
    dto.description = view.description;
    dto.problems = view.problems.map((problem) => {
      const problemDto = new ContestProblemResponseDto();
      problemDto.id = problem.id;
      problemDto.problemId = problem.problemId;
      problemDto.title = problem.title;
      problemDto.difficulty = problem.difficulty;
      problemDto.ordinal = problem.ordinal;
      problemDto.points = problem.points;
      return problemDto;
    });
    return dto;
  }
}
