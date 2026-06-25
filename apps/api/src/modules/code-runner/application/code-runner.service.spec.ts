import { AssessmentDifficulty, ComparisonMode, SubmissionStatus } from '@prisma/client';
import { CodeRunnerService } from './code-runner.service';
import { SubmissionService } from './submission.service';
import { DailyChallengeService } from '../../daily-challenge/application/daily-challenge.service';
import { ProblemService } from '../../problem/application/problem.service';
import { Problem } from '../../problem/domain/entities/problem';
import { ProblemTestCase } from '../../problem/domain/entities/problem-test-case';
import { ISandboxRunner } from '../domain/interfaces/sandbox-runner.interface';
import { RawRunOutput } from '../domain/value-objects/raw-run-output';
import { RunSpec } from '../domain/value-objects/run-spec';

function buildProblem(): Problem {
  const testCases = [
    ProblemTestCase.reconstitute({
      id: 'c1',
      ordinal: 0,
      input: '[1,2], 3',
      expectedOutput: '3',
      isHidden: false,
    }),
    ProblemTestCase.reconstitute({
      id: 'c2',
      ordinal: 1,
      input: '[2,2], 4',
      expectedOutput: '4',
      isHidden: false,
    }),
    ProblemTestCase.reconstitute({
      id: 'c3',
      ordinal: 2,
      input: '[0,0], 0',
      expectedOutput: '0',
      isHidden: true,
    }),
  ];
  return Problem.reconstitute({
    id: 'p1',
    tenantId: null,
    slug: 'sum',
    title: 'Sum',
    difficulty: AssessmentDifficulty.EASY,
    description: '',
    constraints: [],
    tags: [],
    starterCode: { javascript: '', python: '', cpp: '' },
    examples: [],
    functionName: 'solve',
    harness: { paramTypes: ['int[]', 'int'], returnType: 'int', cpp: { signature: '' } },
    referenceSolution: {},
    comparisonMode: ComparisonMode.EXACT,
    timeLimitMinutes: 30,
    isPublished: true,
    testCases,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

interface RawConfig {
  outputs?: Record<string, string>;
  errorIds?: string[];
  compileError?: string;
  timedOut?: boolean;
  omitIds?: string[];
}

function makeRaw(spec: RunSpec, config: RawConfig): RawRunOutput {
  if (config.compileError) {
    return {
      caseResults: [],
      userStdout: '',
      exitCode: 1,
      timedOut: false,
      wallMs: 100,
      compileError: config.compileError,
    };
  }
  const caseResults = spec.cases
    .filter((testCase) => !config.omitIds?.includes(testCase.id))
    .map((testCase) => {
      if (config.errorIds?.includes(testCase.id)) {
        return {
          caseId: testCase.id,
          status: 'error' as const,
          error: 'boom',
          runtimeMs: 1,
          peakMemoryKb: 1000,
        };
      }
      return {
        caseId: testCase.id,
        status: 'ok' as const,
        output: config.outputs?.[testCase.id] ?? '',
        runtimeMs: 5,
        peakMemoryKb: 2000,
      };
    });
  return {
    caseResults,
    userStdout: 'logged',
    exitCode: 0,
    timedOut: config.timedOut ?? false,
    wallMs: 200,
    compileError: null,
  };
}

function buildService(
  run: (spec: RunSpec) => Promise<RawRunOutput>,
  record = jest.fn().mockResolvedValue({ getId: () => 'submission-test' }),
): { service: CodeRunnerService; record: jest.Mock; runSpy: jest.Mock } {
  const problem = buildProblem();
  const problemService = { getById: jest.fn().mockResolvedValue(problem) } as unknown as ProblemService;
  const runSpy = jest.fn(run);
  const sandboxRunner = { run: runSpy } as unknown as ISandboxRunner;
  const submissionService = { record } as unknown as SubmissionService;
  const dailyChallengeService = {
    registerCompletion: jest.fn().mockResolvedValue(undefined),
  } as unknown as DailyChallengeService;
  return {
    service: new CodeRunnerService(
      problemService,
      sandboxRunner,
      submissionService,
      dailyChallengeService,
    ),
    record,
    runSpy,
  };
}

describe('CodeRunnerService', () => {
  it('runs only visible test cases when not persisting', async () => {
    const { service, runSpy, record } = buildService((spec) =>
      Promise.resolve(makeRaw(spec, { outputs: { c1: '3', c2: '999' } })),
    );

    const outcome = await service.execute({
      userId: 'u1',
      problemId: 'p1',
      language: 'javascript',
      code: 'x',
      persist: false,
    });

    const spec = runSpy.mock.calls[0]?.[0] as RunSpec;
    expect(spec.cases.map((c) => c.id)).toEqual(['c1', 'c2']);
    expect(outcome.totalCount).toBe(2);
    expect(outcome.passedCount).toBe(1);
    expect(outcome.status).toBe(SubmissionStatus.WRONG_ANSWER);
    expect(outcome.results[0]?.status).toBe('PASS');
    expect(outcome.results[1]?.status).toBe('FAIL');
    expect(outcome.results[0]?.label).toBe('Case 1');
    expect(record).not.toHaveBeenCalled();
  });

  it('runs all test cases and persists on submit, accepting a correct solution', async () => {
    const { service, runSpy, record } = buildService((spec) =>
      Promise.resolve(makeRaw(spec, { outputs: { c1: '3', c2: '4', c3: '0' } })),
    );

    const outcome = await service.execute({
      userId: 'u1',
      problemId: 'p1',
      language: 'javascript',
      code: 'x',
      persist: true,
    });

    const spec = runSpy.mock.calls[0]?.[0] as RunSpec;
    expect(spec.cases.map((c) => c.id)).toEqual(['c1', 'c2', 'c3']);
    expect(outcome.status).toBe(SubmissionStatus.ACCEPTED);
    expect(outcome.passedCount).toBe(3);
    expect(outcome.results[2]?.isHidden).toBe(true);
    expect(outcome.results[2]?.label).toBe('Hidden case 1');
    expect(record).toHaveBeenCalledTimes(1);
  });

  it('maps a runtime error case to ERROR and overall RUNTIME_ERROR', async () => {
    const { service } = buildService((spec) =>
      Promise.resolve(makeRaw(spec, { outputs: { c1: '3' }, errorIds: ['c2'] })),
    );
    const outcome = await service.execute({
      userId: 'u1',
      problemId: 'p1',
      language: 'javascript',
      code: 'x',
      persist: false,
    });
    expect(outcome.results[1]?.status).toBe('ERROR');
    expect(outcome.status).toBe(SubmissionStatus.RUNTIME_ERROR);
  });

  it('reports COMPILE_ERROR and surfaces the message in stdout', async () => {
    const { service } = buildService((spec) =>
      Promise.resolve(makeRaw(spec, { compileError: 'syntax error on line 3' })),
    );
    const outcome = await service.execute({
      userId: 'u1',
      problemId: 'p1',
      language: 'cpp',
      code: 'x',
      persist: false,
    });
    expect(outcome.status).toBe(SubmissionStatus.COMPILE_ERROR);
    expect(outcome.stdout).toBe('syntax error on line 3');
    expect(outcome.results.every((r) => r.status === 'ERROR')).toBe(true);
  });

  it('reports TIME_LIMIT_EXCEEDED when the container times out', async () => {
    const { service } = buildService((spec) =>
      Promise.resolve(makeRaw(spec, { outputs: { c1: '3' }, omitIds: ['c2'], timedOut: true })),
    );
    const outcome = await service.execute({
      userId: 'u1',
      problemId: 'p1',
      language: 'javascript',
      code: 'x',
      persist: false,
    });
    expect(outcome.status).toBe(SubmissionStatus.TIME_LIMIT_EXCEEDED);
  });
});
