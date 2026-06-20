import { Problem } from '../../domain/entities/problem';
import { CodingProblemResponseDto } from '../dtos/coding-problem-response.dto';
import { ProblemSummaryResponseDto } from '../dtos/problem-summary-response.dto';

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
    dto.id = problem.getId();
    dto.title = problem.getTitle();
    dto.difficulty = problem.getDifficulty();
    dto.description = problem.getDescription();
    dto.constraints = problem.getConstraints();
    dto.tags = problem.getTags();
    dto.starterCode = problem.getStarterCode();
    dto.examples = problem.getExamples();
    dto.testCases = problem.getVisibleTestCases().map((testCase) => ({
      id: testCase.getId(),
      input: testCase.getInput(),
      expectedOutput: testCase.getExpectedOutput(),
      isHidden: false,
    }));
    dto.timeLimitMinutes = problem.getTimeLimitMinutes();
    return dto;
  }
}
