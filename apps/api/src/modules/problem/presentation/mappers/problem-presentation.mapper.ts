import { CodingProblemDto } from '@elevatesde/shared-types';
import { Problem } from '../../domain/entities/problem';
import { CodingProblemResponseDto } from '../dtos/coding-problem-response.dto';
import { ProblemSummaryResponseDto } from '../dtos/problem-summary-response.dto';
import { AdminCodingProblemResponseDto } from '../dtos/admin-coding-problem-response.dto';
import { AdminProblemSummaryResponseDto } from '../dtos/admin-problem-summary-response.dto';

export class ProblemPresentationMapper {
  static toSummary(problem: Problem): ProblemSummaryResponseDto {
    const dto = new ProblemSummaryResponseDto();
    dto.id = problem.getId();
    dto.title = problem.getTitle();
    dto.difficulty = problem.getDifficulty();
    dto.tags = problem.getTags();
    dto.timeLimitMinutes = problem.getTimeLimitMinutes();
    return dto;
  }

  static toCodingProblem(problem: Problem): CodingProblemResponseDto {
    const dto = new CodingProblemResponseDto();
    ProblemPresentationMapper.assignContent(dto, problem);
    dto.testCases = problem.getVisibleTestCases().map((testCase) => ({
      id: testCase.getId(),
      input: testCase.getInput(),
      expectedOutput: testCase.getExpectedOutput(),
      isHidden: false,
    }));
    return dto;
  }

  static toAdminSummary(problem: Problem): AdminProblemSummaryResponseDto {
    const dto = new AdminProblemSummaryResponseDto();
    dto.id = problem.getId();
    dto.title = problem.getTitle();
    dto.difficulty = problem.getDifficulty();
    dto.tags = problem.getTags();
    dto.timeLimitMinutes = problem.getTimeLimitMinutes();
    dto.isPublished = problem.isPublished();
    dto.testCaseCount = problem.getTestCases().length;
    dto.createdAt = problem.getCreatedAt().toISOString();
    dto.updatedAt = problem.getUpdatedAt().toISOString();
    return dto;
  }

  static toAdminCodingProblem(problem: Problem): AdminCodingProblemResponseDto {
    const dto = new AdminCodingProblemResponseDto();
    ProblemPresentationMapper.assignContent(dto, problem);
    dto.testCases = problem.getTestCases().map((testCase) => ({
      id: testCase.getId(),
      input: testCase.getInput(),
      expectedOutput: testCase.getExpectedOutput(),
      isHidden: testCase.isHidden(),
    }));
    dto.isPublished = problem.isPublished();
    dto.createdAt = problem.getCreatedAt().toISOString();
    dto.updatedAt = problem.getUpdatedAt().toISOString();
    return dto;
  }

  private static assignContent(dto: CodingProblemDto, problem: Problem): void {
    dto.id = problem.getId();
    dto.title = problem.getTitle();
    dto.difficulty = problem.getDifficulty();
    dto.description = problem.getDescription();
    dto.constraints = problem.getConstraints();
    dto.tags = problem.getTags();
    dto.starterCode = problem.getStarterCode();
    dto.examples = problem.getExamples();
    dto.timeLimitMinutes = problem.getTimeLimitMinutes();
  }
}
