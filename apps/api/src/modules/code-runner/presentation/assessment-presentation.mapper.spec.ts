import { SubmissionStatus, TestCaseResultStatus } from '@prisma/client';
import { AssessmentPresentationMapper } from './mappers/assessment-presentation.mapper';
import { AssessmentRunOutcome } from '../application/assessment-outcome';

function outcome(status: SubmissionStatus): AssessmentRunOutcome {
  return {
    status,
    passedCount: 1,
    totalCount: 2,
    totalRuntimeMs: 10,
    peakMemoryKb: 2048,
    stdout: 'out',
    results: [
      {
        testCaseId: 'v1',
        label: 'Case 1',
        status: TestCaseResultStatus.PASS,
        input: 'visible-input',
        expectedOutput: 'visible-expected',
        actualOutput: 'visible-actual',
        isHidden: false,
        runtimeMs: 5,
        memoryKb: 1024,
      },
      {
        testCaseId: 'h1',
        label: 'Hidden case 1',
        status: TestCaseResultStatus.FAIL,
        input: 'secret-input',
        expectedOutput: 'secret-expected',
        actualOutput: 'secret-actual',
        isHidden: true,
        runtimeMs: 6,
        memoryKb: 2048,
      },
    ],
  };
}

describe('AssessmentPresentationMapper', () => {
  it('redacts hidden case input/expected/actual but keeps status and metrics', () => {
    const dto = AssessmentPresentationMapper.toResponse(
      outcome(SubmissionStatus.WRONG_ANSWER),
      '2026-06-20T00:00:00.000Z',
    );
    const hidden = dto.results[1];
    expect(hidden?.input).toBe('Hidden');
    expect(hidden?.expectedOutput).toBe('Hidden');
    expect(hidden?.actualOutput).toBe('Hidden');
    expect(hidden?.status).toBe('FAIL');
    expect(hidden?.memoryKb).toBe(2048);
    expect(dto.results[0]?.input).toBe('visible-input');
  });

  it('collapses richer submission statuses to the three run statuses', () => {
    expect(AssessmentPresentationMapper.toResponse(outcome(SubmissionStatus.ACCEPTED), 't').status).toBe(
      'ACCEPTED',
    );
    expect(
      AssessmentPresentationMapper.toResponse(outcome(SubmissionStatus.WRONG_ANSWER), 't').status,
    ).toBe('WRONG_ANSWER');
    expect(
      AssessmentPresentationMapper.toResponse(outcome(SubmissionStatus.COMPILE_ERROR), 't').status,
    ).toBe('RUNTIME_ERROR');
    expect(
      AssessmentPresentationMapper.toResponse(outcome(SubmissionStatus.TIME_LIMIT_EXCEEDED), 't')
        .status,
    ).toBe('RUNTIME_ERROR');
  });
});
