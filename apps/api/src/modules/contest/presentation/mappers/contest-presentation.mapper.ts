import { buildDisplayName } from '../../../../common/display-name';
import {
  ContestCandidateDetailView,
  ContestCandidateSummaryView,
  ContestDetailView,
  ContestStandingRowView,
  ContestSummaryView,
} from '../../domain/read-models/contest-view';
import {
  ContestDetailResponseDto,
  ContestProblemResponseDto,
} from '../dtos/contest-detail-response.dto';
import { ContestSummaryResponseDto } from '../dtos/contest-summary-response.dto';
import {
  ContestCandidateDetailResponseDto,
  ContestCandidateProblemResponseDto,
  ContestCandidateSummaryResponseDto,
  ContestStandingRowResponseDto,
} from '../dtos/contest-candidate-response.dto';

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

  static toCandidateSummary(view: ContestCandidateSummaryView): ContestCandidateSummaryResponseDto {
    const dto = new ContestCandidateSummaryResponseDto();
    dto.id = view.id;
    dto.slug = view.slug;
    dto.title = view.title;
    dto.status = view.status;
    dto.startsAt = view.startsAt.toISOString();
    dto.endsAt = view.endsAt.toISOString();
    dto.problemCount = view.problemCount;
    dto.participantCount = view.participantCount;
    dto.registered = view.registered;
    return dto;
  }

  static toCandidateDetail(view: ContestCandidateDetailView): ContestCandidateDetailResponseDto {
    const dto = new ContestCandidateDetailResponseDto();
    Object.assign(dto, ContestPresentationMapper.toCandidateSummary(view));
    dto.description = view.description;
    dto.problems = view.problems.map((problem) => {
      const problemDto = new ContestCandidateProblemResponseDto();
      problemDto.id = problem.id;
      problemDto.problemId = problem.problemId;
      problemDto.title = problem.title;
      problemDto.difficulty = problem.difficulty;
      problemDto.ordinal = problem.ordinal;
      problemDto.points = problem.points;
      problemDto.solved = problem.solved;
      return problemDto;
    });
    return dto;
  }

  static toStandingRow(view: ContestStandingRowView): ContestStandingRowResponseDto {
    const dto = new ContestStandingRowResponseDto();
    dto.rank = view.rank;
    dto.userId = view.userId;
    dto.name = buildDisplayName(view.firstName, view.lastName);
    dto.solvedCount = view.solvedCount;
    dto.score = view.score;
    dto.penaltySeconds = view.penaltySeconds;
    dto.isCurrentUser = view.isCurrentUser;
    return dto;
  }
}
