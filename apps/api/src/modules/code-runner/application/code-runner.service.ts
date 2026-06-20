import { Injectable } from '@nestjs/common';
import { SubmissionStatus, TestCaseResultStatus } from '@prisma/client';
import { ProblemService } from '../../problem/application/problem.service';
import { Problem, ProblemLanguage } from '../../problem/domain/entities/problem';
import { ProblemTestCase } from '../../problem/domain/entities/problem-test-case';
import { ISandboxRunner } from '../domain/interfaces/sandbox-runner.interface';
import { RawRunOutput } from '../domain/value-objects/raw-run-output';
import { SubmissionService } from './submission.service';
import { AssessmentRunOutcome, CaseOutcome } from './assessment-outcome';
import { outputsMatch } from './output-comparator';

const TIMEOUT_MS_PER_CASE = 2000;
const MEMORY_LIMIT_MB = 256;

export interface ExecuteAssessmentInput {
  userId: string;
  problemId: string;
  language: ProblemLanguage;
  code: string;
  persist: boolean;
}

@Injectable()
export class CodeRunnerService {
  constructor(
    private readonly problemService: ProblemService,
    private readonly sandboxRunner: ISandboxRunner,
    private readonly submissionService: SubmissionService,
  ) {}

  async execute(input: ExecuteAssessmentInput): Promise<AssessmentRunOutcome> {
    const problem = await this.problemService.getById(input.problemId);
    const cases = input.persist ? problem.getTestCases() : problem.getVisibleTestCases();

    const raw = await this.sandboxRunner.run({
      language: input.language,
      functionName: problem.getFunctionName(),
      harness: problem.getHarness(),
      userCode: input.code,
      cases: cases.map((testCase) => ({ id: testCase.getId(), input: testCase.getInput() })),
      timeoutMsPerCase: TIMEOUT_MS_PER_CASE,
      memoryLimitMb: MEMORY_LIMIT_MB,
    });

    const outcome = this.assemble(problem, cases, raw);

    if (input.persist) {
      await this.submissionService.record(
        input.userId,
        problem.getId(),
        input.language,
        input.code,
        outcome,
      );
    }

    return outcome;
  }

  private assemble(
    problem: Problem,
    cases: ProblemTestCase[],
    raw: RawRunOutput,
  ): AssessmentRunOutcome {
    const byCaseId = new Map(raw.caseResults.map((result) => [result.caseId, result]));
    const results: CaseOutcome[] = [];
    let visibleCounter = 0;
    let hiddenCounter = 0;
    let passedCount = 0;
    let totalRuntimeMs = 0;
    let peakMemoryKb = 0;
    let hasRuntimeError = false;
    let hasMissing = false;

    for (const testCase of cases) {
      const hidden = testCase.isHidden();
      const label = hidden ? `Hidden case ${++hiddenCounter}` : `Case ${++visibleCounter}`;
      const rawResult = byCaseId.get(testCase.getId());

      let status: TestCaseResultStatus;
      let actualOutput = '';
      let runtimeMs = 0;
      let memoryKb = 0;

      if (raw.compileError) {
        status = TestCaseResultStatus.ERROR;
        actualOutput = '';
      } else if (!rawResult) {
        status = TestCaseResultStatus.ERROR;
        hasMissing = true;
      } else if (rawResult.status === 'error') {
        status = TestCaseResultStatus.ERROR;
        actualOutput = rawResult.error ?? '';
        runtimeMs = rawResult.runtimeMs;
        memoryKb = rawResult.peakMemoryKb;
        hasRuntimeError = true;
      } else {
        const produced = rawResult.output ?? '';
        const matched = outputsMatch(
          testCase.getExpectedOutput(),
          produced,
          problem.getComparisonMode(),
        );
        status = matched ? TestCaseResultStatus.PASS : TestCaseResultStatus.FAIL;
        actualOutput = produced;
        runtimeMs = rawResult.runtimeMs;
        memoryKb = rawResult.peakMemoryKb;
      }

      if (status === TestCaseResultStatus.PASS) {
        passedCount += 1;
      }
      totalRuntimeMs += runtimeMs;
      peakMemoryKb = Math.max(peakMemoryKb, memoryKb);

      results.push({
        testCaseId: testCase.getId(),
        label,
        status,
        input: testCase.getInput(),
        expectedOutput: testCase.getExpectedOutput(),
        actualOutput,
        isHidden: hidden,
        runtimeMs,
        memoryKb,
      });
    }

    const status = this.deriveStatus(raw, {
      total: cases.length,
      passedCount,
      hasRuntimeError,
      hasMissing,
    });

    return {
      status,
      results,
      passedCount,
      totalCount: cases.length,
      totalRuntimeMs,
      peakMemoryKb,
      stdout: raw.compileError ?? raw.userStdout,
    };
  }

  private deriveStatus(
    raw: RawRunOutput,
    counts: { total: number; passedCount: number; hasRuntimeError: boolean; hasMissing: boolean },
  ): SubmissionStatus {
    if (raw.compileError) {
      return SubmissionStatus.COMPILE_ERROR;
    }
    if (raw.timedOut) {
      return SubmissionStatus.TIME_LIMIT_EXCEEDED;
    }
    if (counts.hasMissing) {
      return SubmissionStatus.RUNTIME_ERROR;
    }
    if (counts.hasRuntimeError) {
      return SubmissionStatus.RUNTIME_ERROR;
    }
    if (counts.total > 0 && counts.passedCount === counts.total) {
      return SubmissionStatus.ACCEPTED;
    }
    return SubmissionStatus.WRONG_ANSWER;
  }
}
