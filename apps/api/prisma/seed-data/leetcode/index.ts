import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export interface DatasetExample {
  input: string;
  output: string;
  explanation: string | null;
}

export interface DatasetTestCase {
  input: string;
  expectedOutput: string;
  isHidden: boolean;
}

export interface DatasetHarness {
  paramTypes: string[];
  returnType: string;
  cpp: { signature: string };
}

export type DatasetComparisonMode = 'EXACT' | 'UNORDERED' | 'FLOAT_TOLERANT';

export interface DatasetProblem {
  slug: string;
  frontendId: string;
  title: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  description: string;
  constraints: string[];
  tags: string[];
  functionName: string;
  starterCode: { javascript: string; python: string; cpp: string };
  examples: DatasetExample[];
  timeLimitMinutes: number;
  testCases: DatasetTestCase[];
  harness?: DatasetHarness;
  comparisonMode?: DatasetComparisonMode;
}

export function loadDatasetProblems(): DatasetProblem[] {
  const filePath = join(__dirname, 'problems.dataset.json');
  const raw = readFileSync(filePath, 'utf8');
  return JSON.parse(raw) as DatasetProblem[];
}

export function loadRunnableDatasetProblems(): DatasetProblem[] {
  const filePath = join(__dirname, 'runnable-problems.dataset.json');
  const raw = readFileSync(filePath, 'utf8');
  return JSON.parse(raw) as DatasetProblem[];
}
