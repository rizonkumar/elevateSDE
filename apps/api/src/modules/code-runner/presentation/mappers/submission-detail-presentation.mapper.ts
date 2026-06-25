import { SubmissionStatusValue, TestCaseResultStatus } from '@elevatesde/shared-types';
import { Submission } from '../../domain/entities/submission';
import { SubmissionResult } from '../../domain/entities/submission-result';
import { Problem } from '../../../problem/domain/entities/problem';
import { ProblemTestCase } from '../../../problem/domain/entities/problem-test-case';
import { fromPrismaLanguage } from '../../application/language';
import { SubmissionDetailResponseDto } from '../dtos/submission-detail-response.dto';
import { TestCaseResultResponseDto } from '../dtos/test-case-result-response.dto';
import { HIDDEN_PLACEHOLDER } from './assessment-presentation.mapper';

export class SubmissionDetailPresentationMapper {
  static toResponse(submission: Submission, problem: Problem): SubmissionDetailResponseDto {
    const caseById = new Map(problem.getTestCases().map((testCase) => [testCase.getId(), testCase]));
    const dto = new SubmissionDetailResponseDto();
    dto.id = submission.getId();
    dto.problemId = submission.getProblemId();
    dto.language = fromPrismaLanguage[submission.getLanguage()];
    dto.status = submission.getStatus() as SubmissionStatusValue;
    dto.passedCount = submission.getPassedCount();
    dto.totalCount = submission.getTotalCount();
    dto.totalRuntimeMs = submission.getTotalRuntimeMs();
    dto.peakMemoryKb = submission.getPeakMemoryKb();
    dto.stdout = submission.getStdout();
    dto.results = submission
      .getResults()
      .map((result) => this.toCaseResult(result, caseById.get(result.getTestCaseId())));
    dto.createdAt = submission.getCreatedAt().toISOString();
    dto.updatedAt = submission.getUpdatedAt().toISOString();
    return dto;
  }

  private static toCaseResult(
    result: SubmissionResult,
    testCase: ProblemTestCase | undefined,
  ): TestCaseResultResponseDto {
    const hidden = result.isHidden();
    const dto = new TestCaseResultResponseDto();
    dto.testCaseId = result.getTestCaseId();
    dto.label = result.getLabel();
    dto.status = result.getStatus() as TestCaseResultStatus;
    dto.isHidden = hidden;
    dto.runtimeMs = result.getRuntimeMs();
    dto.memoryKb = result.getMemoryKb();
    dto.input = hidden ? HIDDEN_PLACEHOLDER : (testCase?.getInput() ?? '');
    dto.expectedOutput = hidden ? HIDDEN_PLACEHOLDER : (testCase?.getExpectedOutput() ?? '');
    dto.actualOutput = hidden ? HIDDEN_PLACEHOLDER : result.getActualOutput();
    return dto;
  }
}
