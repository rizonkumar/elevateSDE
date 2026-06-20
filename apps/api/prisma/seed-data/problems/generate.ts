import { GeneratedProblem, ProblemFamily } from './types';
import { makeRng } from './rng';
import { ARRAY_FAMILIES } from './families/arrays';
import { STRING_FAMILIES } from './families/strings';
import { MATH_FAMILIES } from './families/math';
import { SEARCH_SORT_FAMILIES } from './families/search-sort';
import { DP_FAMILIES } from './families/dynamic-programming';
import { STACK_MISC_FAMILIES } from './families/stack-misc';
import { MATRIX_FAMILIES } from './families/matrix';

export const ALL_FAMILIES: ProblemFamily[] = [
  ...ARRAY_FAMILIES,
  ...STRING_FAMILIES,
  ...MATH_FAMILIES,
  ...SEARCH_SORT_FAMILIES,
  ...DP_FAMILIES,
  ...STACK_MISC_FAMILIES,
  ...MATRIX_FAMILIES,
];

function stringifyArgs(args: unknown[]): string {
  return args.map((arg) => JSON.stringify(arg)).join(', ');
}

export function generateProblems(): GeneratedProblem[] {
  const problems: GeneratedProblem[] = [];
  for (const family of ALL_FAMILIES) {
    for (let variant = 0; variant < family.variants; variant += 1) {
      const rng = makeRng(`${family.slugBase}:${variant}`);
      const cases = family.buildCases(variant, rng);
      const visibleCount = family.visibleCount ?? 2;
      const testCases = cases.map((args, index) => ({
        input: stringifyArgs(args),
        expectedOutput: JSON.stringify(family.reference(args)),
        isHidden: index >= visibleCount,
      }));
      const slug = variant === 0 ? family.slugBase : `${family.slugBase}-${variant + 1}`;
      const title = variant === 0 ? family.title : `${family.title} (Set ${variant + 1})`;
      problems.push({
        slug,
        title,
        difficulty: family.difficulty,
        description: family.description,
        constraints: family.constraints,
        tags: family.tags,
        starterCode: family.starterCode,
        examples: family.examples,
        functionName: family.functionName,
        harness: family.harness,
        referenceSolution: { javascript: family.reference.toString() },
        comparisonMode: family.comparisonMode ?? 'EXACT',
        timeLimitMinutes: family.timeLimitMinutes,
        testCases,
      });
    }
  }
  return problems;
}
