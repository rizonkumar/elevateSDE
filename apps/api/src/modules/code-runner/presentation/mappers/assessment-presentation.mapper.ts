import { SubmissionStatus } from '@prisma/client';
import { AssessmentRunStatus, TestCaseResultStatus } from '@elevatesde/shared-types';
import { AssessmentRunOutcome, CaseOutcome } from '../../application/assessment-outcome';
import { AssessmentRunResponseDto } from '../dtos/assessment-run-response.dto';
import { TestCaseResultResponseDto } from '../dtos/test-case-result-response.dto';

export const HIDDEN_PLACEHOLDER = 'Hidden';

function toRunStatus(status: SubmissionStatus): AssessmentRunStatus {
  if (status === SubmissionStatus.ACCEPTED) {
    return 'ACCEPTED';
  }
  if (status === SubmissionStatus.WRONG_ANSWER) {
    return 'WRONG_ANSWER';
  }
  return 'RUNTIME_ERROR';
}

function toCaseResult(outcome: CaseOutcome): TestCaseResultResponseDto {
  const dto = new TestCaseResultResponseDto();
  dto.testCaseId = outcome.testCaseId;
  dto.label = outcome.label;
  dto.status = outcome.status as TestCaseResultStatus;
  dto.isHidden = outcome.isHidden;
  dto.runtimeMs = outcome.runtimeMs;
  dto.memoryKb = outcome.memoryKb;
  dto.input = outcome.isHidden ? HIDDEN_PLACEHOLDER : outcome.input;
  dto.expectedOutput = outcome.isHidden ? HIDDEN_PLACEHOLDER : outcome.expectedOutput;
  dto.actualOutput = outcome.isHidden ? HIDDEN_PLACEHOLDER : outcome.actualOutput;
  return dto;
}

export class AssessmentPresentationMapper {
  static toResponse(outcome: AssessmentRunOutcome, ranAt: string): AssessmentRunResponseDto {
    const dto = new AssessmentRunResponseDto();
    dto.status = toRunStatus(outcome.status);
    dto.results = outcome.results.map((result) => toCaseResult(result));
    dto.passedCount = outcome.passedCount;
    dto.totalCount = outcome.totalCount;
    dto.totalRuntimeMs = outcome.totalRuntimeMs;
    dto.peakMemoryKb = outcome.peakMemoryKb;
    dto.stdout = outcome.stdout;
    dto.ranAt = ranAt;
    return dto;
  }
}
