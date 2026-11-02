import { AssessmentDifficulty, ComparisonMode } from '@prisma/client';
import { LanguageCodeMap, Problem, ProblemHarness } from './problem';

function problem(starterCode: Partial<LanguageCodeMap>, harness: ProblemHarness): Problem {
  return Problem.reconstitute({
    id: 'p1',
    tenantId: null,
    slug: 'two-sum',
    title: 'Two Sum',
    difficulty: AssessmentDifficulty.EASY,
    description: '',
    constraints: [],
    tags: [],
    starterCode,
    examples: [],
    functionName: 'twoSum',
    harness,
    referenceSolution: {},
    comparisonMode: ComparisonMode.EXACT,
    timeLimitMinutes: 30,
    isPublished: true,
    testCases: [],
    topics: [],
    companies: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

const TYPED_HARNESS: ProblemHarness = {
  paramTypes: ['int[]', 'int'],
  returnType: 'int[]',
  cpp: { signature: 'vector<int> twoSum(vector<int>& nums, int target)' },
};

describe('Problem languages', () => {
  it('generates Java and Go starters from a typed harness', () => {
    const subject = problem(
      { javascript: 'function twoSum() {}', python: 'def twoSum(): pass' },
      TYPED_HARNESS,
    );

    expect(subject.getAvailableLanguages()).toEqual(['javascript', 'python', 'cpp', 'java', 'go']);
    expect(subject.getStarterCodeFor('java')).toContain(
      'public int[] twoSum(int[] nums, int target)',
    );
    expect(subject.getStarterCodeFor('go')).toContain('func twoSum(nums []int, target int) []int');
  });

  it('prefers authored starter code over a generated stub', () => {
    const subject = problem(
      { go: 'func twoSum(a []int, b int) []int { return nil }' },
      TYPED_HARNESS,
    );

    expect(subject.getStarterCodeFor('go')).toBe(
      'func twoSum(a []int, b int) []int { return nil }',
    );
  });

  it('always offers the original three languages but needs a typed harness for Java and Go', () => {
    const subject = problem({ javascript: 'x' }, { paramTypes: [], returnType: '' });

    expect(subject.getAvailableLanguages()).toEqual(['javascript', 'python', 'cpp']);
    expect(subject.getStarterCodeFor('python')).toBe('');
    expect(subject.supportsLanguage('java')).toBe(false);
    expect(subject.supportsLanguage('go')).toBe(false);
  });

  it('resolves only the available languages for candidates', () => {
    const subject = problem({ python: 'def twoSum(): pass' }, TYPED_HARNESS);

    expect(Object.keys(subject.getResolvedStarterCode())).toEqual([
      'javascript',
      'python',
      'cpp',
      'java',
      'go',
    ]);
  });
});
