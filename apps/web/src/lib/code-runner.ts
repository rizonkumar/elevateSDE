import type {
  AssessmentLanguage,
  AssessmentRunResultDto,
  AssessmentRunStatus,
  TestCaseResultDto,
  TestCaseResultStatus,
} from '@elevatesde/shared-types';
import type { AssessmentProblemSeed } from '@/lib/assessment-problems';

function hashString(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.codePointAt(index) ?? 0;
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash);
}

function resolveStatus(empty: boolean, passed: boolean): TestCaseResultStatus {
  if (empty) return 'ERROR';
  return passed ? 'PASS' : 'FAIL';
}

function resolveActualOutput(empty: boolean, passed: boolean, expected: string): string {
  if (empty) return '';
  return passed ? expected : deriveWrongOutput(expected);
}

function stripNoise(code: string): string {
  return code
    .replace(/\/\/.*$/gm, '')
    .replace(/#.*$/gm, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function isEmptyAttempt(code: string, starter: string): boolean {
  const cleaned = stripNoise(code);
  if (cleaned.length === 0) return true;
  const cleanedStarter = stripNoise(starter.replace(/\bpass\b/g, ''));
  return cleaned === stripNoise(starter) || cleaned === cleanedStarter;
}

function countMatchedSignals(code: string, signals: string[]): number {
  const cleaned = stripNoise(code);
  return signals.reduce(
    (total, signal) => (cleaned.includes(signal.toLowerCase()) ? total + 1 : total),
    0,
  );
}

function deriveWrongOutput(expected: string): string {
  if (expected === 'true') return 'false';
  if (expected === 'false') return 'true';
  if (expected.startsWith('[')) return '[]';
  return 'null';
}

const RUN_DELAY_FLOOR_MS = 650;
const RUN_DELAY_RANGE_MS = 700;

function deterministicDelay(seed: number): number {
  return RUN_DELAY_FLOOR_MS + (seed % RUN_DELAY_RANGE_MS);
}

export function runCode(
  problem: AssessmentProblemSeed,
  language: AssessmentLanguage,
  code: string,
  customVisibleInputs?: string[],
): Promise<AssessmentRunResultDto> {
  const starter = problem.starterCode[language];
  const empty = isEmptyAttempt(code, starter);
  const totalCount = problem.testCases.length;
  const matched = empty ? 0 : countMatchedSignals(code, problem.solutionSignals);
  const ratio = problem.solutionSignals.length === 0 ? 1 : matched / problem.solutionSignals.length;
  const passCount = empty ? 0 : Math.min(totalCount, Math.round(ratio * totalCount));
  const baseSeed = hashString(`${problem.id}:${language}:${stripNoise(code)}`);

  const results: TestCaseResultDto[] = problem.testCases.map((testCase, index) => {
    const seed = hashString(`${baseSeed}:${testCase.id}:${index}`);
    const passed = index < passCount;
    const status = resolveStatus(empty, passed);
    const actualOutput = resolveActualOutput(empty, passed, testCase.expectedOutput);
    const visibleIndex = problem.testCases.filter(
      (item, position) => !item.isHidden && position <= index,
    ).length;
    const customInput = testCase.isHidden ? undefined : customVisibleInputs?.[visibleIndex - 1];
    const displayedInput = customInput && customInput.trim().length > 0 ? customInput : testCase.input;
    return {
      testCaseId: testCase.id,
      label: testCase.isHidden ? `Hidden case ${index + 1}` : `Case ${visibleIndex}`,
      status,
      input: testCase.isHidden ? 'Hidden' : displayedInput,
      expectedOutput: testCase.isHidden ? 'Hidden' : testCase.expectedOutput,
      actualOutput: testCase.isHidden && status !== 'PASS' ? 'Hidden' : actualOutput,
      isHidden: testCase.isHidden,
      runtimeMs: 4 + (seed % 96),
      memoryKb: 1600 + (seed % 7200),
    };
  });

  const passedCount = results.filter((result) => result.status === 'PASS').length;
  const totalRuntimeMs = results.reduce((total, result) => total + result.runtimeMs, 0);
  const peakMemoryKb = results.reduce((peak, result) => Math.max(peak, result.memoryKb), 0);

  let status: AssessmentRunStatus = 'WRONG_ANSWER';
  if (passedCount === totalCount) {
    status = 'ACCEPTED';
  } else if (empty) {
    status = 'RUNTIME_ERROR';
  }

  const stdout = empty
    ? `No solution detected. Implement your logic before running.\nLanguage: ${language}`
    : `Executed ${totalCount} test case(s).\nPassed ${passedCount} / ${totalCount}.`;

  const result: AssessmentRunResultDto = {
    status,
    results,
    passedCount,
    totalCount,
    totalRuntimeMs,
    peakMemoryKb,
    stdout,
    ranAt: new Date().toISOString(),
  };

  return new Promise((resolve) => {
    setTimeout(() => resolve(result), deterministicDelay(baseSeed));
  });
}
