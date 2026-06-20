export type Language = 'javascript' | 'python' | 'cpp';

export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';

export type ComparisonMode = 'EXACT' | 'UNORDERED' | 'FLOAT_TOLERANT';

export interface FamilyHarness {
  paramTypes: string[];
  returnType: string;
  cpp: { signature: string };
}

export interface FamilyExample {
  input: string;
  output: string;
  explanation: string | null;
}

export interface Rng {
  next: () => number;
  int: (min: number, max: number) => number;
  array: (length: number, min: number, max: number) => number[];
  distinct: (length: number, min: number, max: number) => number[];
  pick: <T>(items: readonly T[]) => T;
}

export interface ProblemFamily {
  slugBase: string;
  title: string;
  difficulty: Difficulty;
  tags: string[];
  functionName: string;
  harness: FamilyHarness;
  comparisonMode?: ComparisonMode;
  timeLimitMinutes: number;
  description: string;
  constraints: string[];
  starterCode: Record<Language, string>;
  examples: FamilyExample[];
  reference: (args: unknown[]) => unknown;
  variants: number;
  visibleCount?: number;
  buildCases: (variant: number, rng: Rng) => unknown[][];
}

export interface GeneratedTestCase {
  input: string;
  expectedOutput: string;
  isHidden: boolean;
}

export interface GeneratedProblem {
  slug: string;
  title: string;
  difficulty: Difficulty;
  description: string;
  constraints: string[];
  tags: string[];
  starterCode: Record<Language, string>;
  examples: FamilyExample[];
  functionName: string;
  harness: FamilyHarness;
  referenceSolution: Record<string, string>;
  comparisonMode: ComparisonMode;
  timeLimitMinutes: number;
  testCases: GeneratedTestCase[];
}
