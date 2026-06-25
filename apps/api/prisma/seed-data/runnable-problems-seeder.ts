import { Prisma, PrismaClient } from '@prisma/client';

type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';

interface GeneratedTestCase {
  input: string;
  expectedOutput: string;
  isHidden: boolean;
}

interface GeneratedProblem {
  slug: string;
  title: string;
  difficulty: Difficulty;
  tags: string[];
  description: string;
  constraints: string[];
  functionName: string;
  paramTypes: string[];
  returnType: string;
  cppSignature: string;
  timeLimitMinutes: number;
  starterCode: { javascript: string; python: string; cpp: string };
  testCases: GeneratedTestCase[];
}

function serialize(value: unknown): string {
  return JSON.stringify(value === undefined ? null : value);
}

function toInput(args: unknown[]): string {
  return args.map((arg) => JSON.stringify(arg)).join(', ');
}

function makeRng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function randInt(rng: () => number, min: number, max: number): number {
  return min + Math.floor(rng() * (max - min + 1));
}

function randArray(rng: () => number, length: number, min: number, max: number): number[] {
  return Array.from({ length }, () => randInt(rng, min, max));
}

function buildCases(args: unknown[][], reference: (...args: number[]) => unknown): GeneratedTestCase[] {
  const visibleCount = Math.ceil(args.length / 2);
  return args.map((tuple, index) => ({
    input: toInput(tuple),
    expectedOutput: serialize(reference(...(tuple as number[]))),
    isHidden: index >= visibleCount,
  }));
}

function gcd(a: number, b: number): number {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y !== 0) {
    [x, y] = [y, x % y];
  }
  return x;
}

interface IntToIntSpec {
  base: string;
  title: string;
  difficulty: Difficulty;
  tags: string[];
  fn: string;
  params: number[];
  describe: (p: number) => string;
  reference: (p: number, x: number) => number;
  xs: (p: number, rng: () => number) => number[];
}

function intToInt(spec: IntToIntSpec, templateIndex: number): GeneratedProblem[] {
  return spec.params.map((p, variantIndex) => {
    const rng = makeRng(templateIndex * 1000 + variantIndex);
    const args = spec.xs(p, rng).map((x) => [x]);
    return {
      slug: `rp-${spec.base}-k${p}`,
      title: `${spec.title} (k=${p})`,
      difficulty: spec.difficulty,
      tags: spec.tags,
      description: spec.describe(p),
      constraints: ['-100 <= x <= 100'],
      functionName: spec.fn,
      paramTypes: ['int'],
      returnType: 'int',
      cppSignature: `int ${spec.fn}(int x)`,
      timeLimitMinutes: 15,
      starterCode: {
        javascript: `function ${spec.fn}(x) {\n  return 0;\n}`,
        python: `def ${spec.fn}(x):\n    return 0`,
        cpp: `int ${spec.fn}(int x) {\n    return 0;\n}`,
      },
      testCases: buildCases(args, (x) => spec.reference(p, x)),
    };
  });
}

interface ArrToIntSpec {
  base: string;
  title: string;
  difficulty: Difficulty;
  tags: string[];
  fn: string;
  params: number[];
  describe: (p: number) => string;
  reference: (p: number, a: number[]) => number;
  arrays: (p: number, rng: () => number) => number[][];
}

function arrToInt(spec: ArrToIntSpec, templateIndex: number): GeneratedProblem[] {
  return spec.params.map((p, variantIndex) => {
    const rng = makeRng(templateIndex * 1000 + variantIndex);
    const args = spec.arrays(p, rng).map((a) => [a]);
    return {
      slug: `rp-${spec.base}-k${p}`,
      title: `${spec.title} (k=${p})`,
      difficulty: spec.difficulty,
      tags: spec.tags,
      description: spec.describe(p),
      constraints: ['1 <= arr.length <= 8', '-100 <= arr[i] <= 100'],
      functionName: spec.fn,
      paramTypes: ['int[]'],
      returnType: 'int',
      cppSignature: `int ${spec.fn}(vector<int>& a)`,
      timeLimitMinutes: 20,
      starterCode: {
        javascript: `function ${spec.fn}(a) {\n  return 0;\n}`,
        python: `def ${spec.fn}(a):\n    return 0`,
        cpp: `int ${spec.fn}(vector<int>& a) {\n    return 0;\n}`,
      },
      testCases: buildCases(args, (a) => spec.reference(p, a as unknown as number[])),
    };
  });
}

interface ArrToArrSpec {
  base: string;
  title: string;
  difficulty: Difficulty;
  tags: string[];
  fn: string;
  params: number[];
  describe: (p: number) => string;
  reference: (p: number, a: number[]) => number[];
  arrays: (p: number, rng: () => number) => number[][];
}

function arrToArr(spec: ArrToArrSpec, templateIndex: number): GeneratedProblem[] {
  return spec.params.map((p, variantIndex) => {
    const rng = makeRng(templateIndex * 1000 + variantIndex);
    const args = spec.arrays(p, rng).map((a) => [a]);
    return {
      slug: `rp-${spec.base}-k${p}`,
      title: `${spec.title} (k=${p})`,
      difficulty: spec.difficulty,
      tags: spec.tags,
      description: spec.describe(p),
      constraints: ['1 <= arr.length <= 8', '-100 <= arr[i] <= 100'],
      functionName: spec.fn,
      paramTypes: ['int[]'],
      returnType: 'int[]',
      cppSignature: `vector<int> ${spec.fn}(vector<int>& a)`,
      timeLimitMinutes: 20,
      starterCode: {
        javascript: `function ${spec.fn}(a) {\n  return [];\n}`,
        python: `def ${spec.fn}(a):\n    return []`,
        cpp: `vector<int> ${spec.fn}(vector<int>& a) {\n    return {};\n}`,
      },
      testCases: buildCases(args, (a) => spec.reference(p, a as unknown as number[])),
    };
  });
}

interface StrToStrSpec {
  base: string;
  title: string;
  difficulty: Difficulty;
  tags: string[];
  fn: string;
  params: number[];
  describe: (p: number) => string;
  reference: (p: number, s: string) => string;
  strings: (p: number, rng: () => number) => string[];
}

function strToStr(spec: StrToStrSpec, templateIndex: number): GeneratedProblem[] {
  return spec.params.map((p, variantIndex) => {
    const rng = makeRng(templateIndex * 1000 + variantIndex);
    const args = spec.strings(p, rng).map((s) => [s]);
    return {
      slug: `rp-${spec.base}-k${p}`,
      title: `${spec.title} (k=${p})`,
      difficulty: spec.difficulty,
      tags: spec.tags,
      description: spec.describe(p),
      constraints: ['1 <= s.length <= 12'],
      functionName: spec.fn,
      paramTypes: ['string'],
      returnType: 'string',
      cppSignature: `string ${spec.fn}(string s)`,
      timeLimitMinutes: 15,
      starterCode: {
        javascript: `function ${spec.fn}(s) {\n  return "";\n}`,
        python: `def ${spec.fn}(s):\n    return ""`,
        cpp: `string ${spec.fn}(string s) {\n    return "";\n}`,
      },
      testCases: buildCases(args, (s) => spec.reference(p, s as unknown as string)),
    };
  });
}

const WORDS = ['ab', 'xy', 'go', 'hi', 'lo', 'qe', 'mn', 'rt'];

function intDomain(rng: () => number): number[] {
  return [0, 1, -1, 10, -10, randInt(rng, -50, 50), randInt(rng, -50, 50), randInt(rng, -50, 50)];
}

function nonNegativeDomain(rng: () => number): number[] {
  return [0, 1, 6, 12, 25, randInt(rng, 0, 100), randInt(rng, 0, 100), randInt(rng, 0, 100)];
}

function arrayDomain(rng: () => number): number[][] {
  return [
    [1, 2, 3, 4],
    [0, 0, 0],
    [-5, 5, -10, 10],
    randArray(rng, 5, -20, 50),
    randArray(rng, 6, -20, 50),
    randArray(rng, 7, -20, 50),
    randArray(rng, 8, -20, 50),
    randArray(rng, 4, -20, 50),
  ];
}

function fixedLengthArrayDomain(rng: () => number): number[][] {
  return [
    [1, 2, 3, 4, 5, 6, 7, 8],
    [0, 0, 0, 0, 0, 0, 0, 0],
    randArray(rng, 8, 0, 30),
    randArray(rng, 8, 0, 30),
    randArray(rng, 8, 0, 30),
    randArray(rng, 8, 0, 30),
    randArray(rng, 8, 0, 30),
    randArray(rng, 8, 0, 30),
  ];
}

function stringDomain(rng: () => number): string[] {
  return [
    'a',
    'ab',
    WORDS[randInt(rng, 0, WORDS.length - 1)] ?? 'zz',
    WORDS[randInt(rng, 0, WORDS.length - 1)] ?? 'yy',
    'xz',
    'qq',
  ];
}

function buildAllProblems(): GeneratedProblem[] {
  const groups: GeneratedProblem[][] = [
    intToInt(
      {
        base: 'add-constant',
        title: 'Add Constant',
        difficulty: 'EASY',
        tags: ['Math'],
        fn: 'addConstant',
        params: [1, 5, 10, 42, 100, 256, 7, 999],
        describe: (p) => `Given an integer x, return x + ${p}.`,
        reference: (p, x) => x + p,
        xs: (_p, rng) => intDomain(rng),
      },
      1,
    ),
    intToInt(
      {
        base: 'multiply-constant',
        title: 'Multiply Constant',
        difficulty: 'EASY',
        tags: ['Math'],
        fn: 'multiplyConstant',
        params: [2, 3, 4, 5, 6, 7, 8, 9],
        describe: (p) => `Given an integer x, return x multiplied by ${p}.`,
        reference: (p, x) => x * p,
        xs: (_p, rng) => intDomain(rng),
      },
      2,
    ),
    intToInt(
      {
        base: 'modulo-k',
        title: 'Non-negative Modulo',
        difficulty: 'EASY',
        tags: ['Math'],
        fn: 'moduloK',
        params: [2, 3, 5, 7, 9, 10, 11, 13],
        describe: (p) => `Given a non-negative integer x, return x modulo ${p}.`,
        reference: (p, x) => x % p,
        xs: (_p, rng) => nonNegativeDomain(rng),
      },
      3,
    ),
    intToInt(
      {
        base: 'gcd-with-k',
        title: 'GCD With Constant',
        difficulty: 'MEDIUM',
        tags: ['Math', 'Number Theory'],
        fn: 'gcdWithK',
        params: [6, 8, 12, 15, 18, 24, 30, 100],
        describe: (p) => `Given a non-negative integer x, return the greatest common divisor of x and ${p}.`,
        reference: (p, x) => gcd(x, p),
        xs: (_p, rng) => nonNegativeDomain(rng),
      },
      4,
    ),
    arrToInt(
      {
        base: 'sum-plus-k',
        title: 'Array Sum Plus K',
        difficulty: 'EASY',
        tags: ['Array'],
        fn: 'sumPlusK',
        params: [0, 1, 10, 50, 100, 5, 25, 7],
        describe: (p) => `Given an array of integers, return the sum of its elements plus ${p}.`,
        reference: (p, a) => a.reduce((acc, value) => acc + value, 0) + p,
        arrays: (_p, rng) => arrayDomain(rng),
      },
      5,
    ),
    arrToInt(
      {
        base: 'count-multiples',
        title: 'Count Multiples',
        difficulty: 'EASY',
        tags: ['Array', 'Math'],
        fn: 'countMultiples',
        params: [2, 3, 4, 5, 6, 7, 8, 9],
        describe: (p) => `Given an array of integers, return how many elements are divisible by ${p}.`,
        reference: (p, a) => a.filter((value) => value % p === 0).length,
        arrays: (_p, rng) => arrayDomain(rng),
      },
      6,
    ),
    arrToInt(
      {
        base: 'sum-multiples',
        title: 'Sum Of Multiples',
        difficulty: 'MEDIUM',
        tags: ['Array', 'Math'],
        fn: 'sumMultiples',
        params: [2, 3, 4, 5, 6, 7, 10, 12],
        describe: (p) => `Given an array of integers, return the sum of elements divisible by ${p}.`,
        reference: (p, a) => a.filter((value) => value % p === 0).reduce((acc, value) => acc + value, 0),
        arrays: (_p, rng) => arrayDomain(rng),
      },
      7,
    ),
    arrToInt(
      {
        base: 'count-greater',
        title: 'Count Greater Than K',
        difficulty: 'EASY',
        tags: ['Array'],
        fn: 'countGreater',
        params: [0, 3, 5, 10, 20, 30, -5, 40],
        describe: (p) => `Given an array of integers, return how many elements are strictly greater than ${p}.`,
        reference: (p, a) => a.filter((value) => value > p).length,
        arrays: (_p, rng) => arrayDomain(rng),
      },
      8,
    ),
    arrToArr(
      {
        base: 'clamp-max',
        title: 'Clamp To Maximum',
        difficulty: 'MEDIUM',
        tags: ['Array'],
        fn: 'clampMax',
        params: [5, 10, 0, 7, 20, 3, 50, 15],
        describe: (p) => `Given an array of integers, return a new array where each element is capped at ${p}.`,
        reference: (p, a) => a.map((value) => Math.min(value, p)),
        arrays: (_p, rng) => arrayDomain(rng),
      },
      9,
    ),
    arrToArr(
      {
        base: 'add-k-each',
        title: 'Add K To Each',
        difficulty: 'EASY',
        tags: ['Array'],
        fn: 'addKEach',
        params: [1, 2, 3, 5, 10, 100, 7, 25],
        describe: (p) => `Given an array of integers, return a new array with ${p} added to each element.`,
        reference: (p, a) => a.map((value) => value + p),
        arrays: (_p, rng) => arrayDomain(rng),
      },
      10,
    ),
    arrToArr(
      {
        base: 'take-first-k',
        title: 'Take First K',
        difficulty: 'EASY',
        tags: ['Array'],
        fn: 'takeFirstK',
        params: [1, 2, 3, 4, 5, 6, 7, 8],
        describe: (p) => `Given an array of 8 integers, return the first ${p} elements in order.`,
        reference: (p, a) => a.slice(0, p),
        arrays: (_p, rng) => fixedLengthArrayDomain(rng),
      },
      11,
    ),
    arrToInt(
      {
        base: 'sum-first-k',
        title: 'Sum Of First K',
        difficulty: 'EASY',
        tags: ['Array', 'Prefix Sum'],
        fn: 'sumFirstK',
        params: [1, 2, 3, 4, 5, 6, 7, 8],
        describe: (p) => `Given an array of 8 integers, return the sum of the first ${p} elements.`,
        reference: (p, a) => a.slice(0, p).reduce((acc, value) => acc + value, 0),
        arrays: (_p, rng) => fixedLengthArrayDomain(rng),
      },
      12,
    ),
    strToStr(
      {
        base: 'repeat-string',
        title: 'Repeat String',
        difficulty: 'EASY',
        tags: ['String'],
        fn: 'repeatString',
        params: [1, 2, 3, 4],
        describe: (p) => `Given a string s, return s repeated ${p} time(s).`,
        reference: (p, s) => s.repeat(p),
        strings: (_p, rng) => stringDomain(rng),
      },
      13,
    ),
  ];

  return groups.flat().slice(0, 100);
}

export async function seedRunnableProblems(prisma: PrismaClient): Promise<number> {
  const problems = buildAllProblems();
  const slugs = problems.map((problem) => problem.slug);

  await prisma.problem.deleteMany({
    where: { slug: { startsWith: 'rp-' }, NOT: { slug: { in: slugs } } },
  });

  for (const problem of problems) {
    const harness = {
      paramTypes: problem.paramTypes,
      returnType: problem.returnType,
      cpp: { signature: problem.cppSignature },
    } as unknown as Prisma.InputJsonValue;
    const examples = problem.testCases
      .filter((testCase) => !testCase.isHidden)
      .slice(0, 2)
      .map((testCase) => ({
        input: testCase.input,
        output: testCase.expectedOutput,
        explanation: null,
      })) as unknown as Prisma.InputJsonValue;
    const starterCode = problem.starterCode as unknown as Prisma.InputJsonValue;

    const record = await prisma.problem.upsert({
      where: { slug: problem.slug },
      update: {
        title: problem.title,
        difficulty: problem.difficulty,
        description: problem.description,
        constraints: problem.constraints,
        tags: problem.tags,
        starterCode,
        examples,
        functionName: problem.functionName,
        harness,
        comparisonMode: 'EXACT',
        timeLimitMinutes: problem.timeLimitMinutes,
        isPublished: true,
      },
      create: {
        slug: problem.slug,
        title: problem.title,
        difficulty: problem.difficulty,
        description: problem.description,
        constraints: problem.constraints,
        tags: problem.tags,
        starterCode,
        examples,
        functionName: problem.functionName,
        harness,
        referenceSolution: {},
        comparisonMode: 'EXACT',
        timeLimitMinutes: problem.timeLimitMinutes,
        isPublished: true,
      },
    });

    await prisma.problemTestCase.deleteMany({ where: { problemId: record.id } });
    await prisma.problemTestCase.createMany({
      data: problem.testCases.map((testCase, index) => ({
        problemId: record.id,
        ordinal: index,
        input: testCase.input,
        expectedOutput: testCase.expectedOutput,
        isHidden: testCase.isHidden,
      })),
    });
  }

  return problems.length;
}
