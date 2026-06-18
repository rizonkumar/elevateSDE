import type { AssessmentLanguage, CodingProblemDto } from '@elevatesde/shared-types';

export interface AssessmentProblemSeed extends CodingProblemDto {
  solutionSignals: string[];
}

const TWO_SUM: AssessmentProblemSeed = {
  id: 'two-sum',
  title: 'Two Sum',
  difficulty: 'EASY',
  timeLimitMinutes: 30,
  tags: ['Array', 'Hash Map'],
  description: [
    'Given an array of integers `nums` and an integer `target`, return the indices of the two numbers that add up to `target`.',
    '',
    'You may assume that each input has exactly one solution, and you may not use the same element twice. Return the answer in ascending index order.',
  ].join('\n'),
  constraints: [
    '2 <= nums.length <= 10^4',
    '-10^9 <= nums[i] <= 10^9',
    'Exactly one valid answer exists.',
  ],
  examples: [
    {
      input: 'nums = [2, 7, 11, 15], target = 9',
      output: '[0, 1]',
      explanation: 'nums[0] + nums[1] == 9.',
    },
    { input: 'nums = [3, 2, 4], target = 6', output: '[1, 2]', explanation: null },
  ],
  testCases: [
    { id: 'two-sum-1', input: '[2,7,11,15], 9', expectedOutput: '[0,1]', isHidden: false },
    { id: 'two-sum-2', input: '[3,2,4], 6', expectedOutput: '[1,2]', isHidden: false },
    { id: 'two-sum-3', input: '[3,3], 6', expectedOutput: '[0,1]', isHidden: true },
    { id: 'two-sum-4', input: '[-1,-2,-3,-4,-5], -8', expectedOutput: '[2,4]', isHidden: true },
  ],
  starterCode: {
    javascript: ['function twoSum(nums, target) {', '  // Write your solution here', '}'].join(
      '\n',
    ),
    python: ['def two_sum(nums, target):', '    # Write your solution here', '    pass'].join('\n'),
    cpp: [
      '#include <vector>',
      'using namespace std;',
      '',
      'vector<int> twoSum(vector<int>& nums, int target) {',
      '    // Write your solution here',
      '}',
    ].join('\n'),
  },
  solutionSignals: ['for', 'target', 'return', 'map'],
};

const VALID_PARENTHESES: AssessmentProblemSeed = {
  id: 'valid-parentheses',
  title: 'Valid Parentheses',
  difficulty: 'EASY',
  timeLimitMinutes: 25,
  tags: ['String', 'Stack'],
  description: [
    'Given a string `s` containing just the characters `()[]{}`, determine if the input string is valid.',
    '',
    'A string is valid when open brackets are closed by the same type of bracket and in the correct order.',
  ].join('\n'),
  constraints: ['1 <= s.length <= 10^4', 's consists only of the characters ()[]{}.'],
  examples: [
    { input: 's = "()[]{}"', output: 'true', explanation: 'Every bracket is closed correctly.' },
    { input: 's = "(]"', output: 'false', explanation: 'Brackets are mismatched.' },
  ],
  testCases: [
    { id: 'valid-parentheses-1', input: '"()"', expectedOutput: 'true', isHidden: false },
    { id: 'valid-parentheses-2', input: '"()[]{}"', expectedOutput: 'true', isHidden: false },
    { id: 'valid-parentheses-3', input: '"(]"', expectedOutput: 'false', isHidden: true },
    { id: 'valid-parentheses-4', input: '"([)]"', expectedOutput: 'false', isHidden: true },
  ],
  starterCode: {
    javascript: ['function isValid(s) {', '  // Write your solution here', '}'].join('\n'),
    python: ['def is_valid(s):', '    # Write your solution here', '    pass'].join('\n'),
    cpp: [
      '#include <string>',
      'using namespace std;',
      '',
      'bool isValid(string s) {',
      '    // Write your solution here',
      '}',
    ].join('\n'),
  },
  solutionSignals: ['stack', 'push', 'for', 'return'],
};

const MERGE_INTERVALS: AssessmentProblemSeed = {
  id: 'merge-intervals',
  title: 'Merge Intervals',
  difficulty: 'MEDIUM',
  timeLimitMinutes: 40,
  tags: ['Array', 'Sorting'],
  description: [
    'Given an array of `intervals` where `intervals[i] = [start, end]`, merge all overlapping intervals and return an array of the non-overlapping intervals that cover all the intervals in the input.',
  ].join('\n'),
  constraints: [
    '1 <= intervals.length <= 10^4',
    'intervals[i].length == 2',
    '0 <= start <= end <= 10^4',
  ],
  examples: [
    {
      input: 'intervals = [[1,3],[2,6],[8,10],[15,18]]',
      output: '[[1,6],[8,10],[15,18]]',
      explanation: 'Intervals [1,3] and [2,6] overlap, so they merge into [1,6].',
    },
  ],
  testCases: [
    {
      id: 'merge-intervals-1',
      input: '[[1,3],[2,6],[8,10],[15,18]]',
      expectedOutput: '[[1,6],[8,10],[15,18]]',
      isHidden: false,
    },
    { id: 'merge-intervals-2', input: '[[1,4],[4,5]]', expectedOutput: '[[1,5]]', isHidden: false },
    { id: 'merge-intervals-3', input: '[[1,4],[0,4]]', expectedOutput: '[[0,4]]', isHidden: true },
    { id: 'merge-intervals-4', input: '[[1,4],[2,3]]', expectedOutput: '[[1,4]]', isHidden: true },
  ],
  starterCode: {
    javascript: ['function merge(intervals) {', '  // Write your solution here', '}'].join('\n'),
    python: ['def merge(intervals):', '    # Write your solution here', '    pass'].join('\n'),
    cpp: [
      '#include <vector>',
      'using namespace std;',
      '',
      'vector<vector<int>> merge(vector<vector<int>>& intervals) {',
      '    // Write your solution here',
      '}',
    ].join('\n'),
  },
  solutionSignals: ['sort', 'for', 'push', 'return'],
};

export const ASSESSMENT_PROBLEMS: AssessmentProblemSeed[] = [
  TWO_SUM,
  VALID_PARENTHESES,
  MERGE_INTERVALS,
];

export const DEFAULT_PROBLEM: AssessmentProblemSeed = TWO_SUM;

export const ASSESSMENT_LANGUAGE_OPTIONS: { value: AssessmentLanguage; label: string }[] = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'python', label: 'Python' },
  { value: 'cpp', label: 'C++' },
];

export function getProblemById(id: string): AssessmentProblemSeed | undefined {
  const match = ASSESSMENT_PROBLEMS.find((problem) => problem.id === id);
  if (match) return match;
  return id === 'demo-id' ? DEFAULT_PROBLEM : undefined;
}
