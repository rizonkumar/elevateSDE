import { ProblemFamily } from '../types';

function starter(js: string, py: string, cpp: string): Record<'javascript' | 'python' | 'cpp', string> {
  return { javascript: js, python: py, cpp };
}

export const SEARCH_SORT_FAMILIES: ProblemFamily[] = [
  {
    slugBase: 'binary-search',
    title: 'Binary Search',
    difficulty: 'EASY',
    tags: ['Array', 'Binary Search'],
    functionName: 'search',
    harness: { paramTypes: ['int[]', 'int'], returnType: 'int', cpp: { signature: 'int search(vector<int>& nums, int target)' } },
    timeLimitMinutes: 15,
    description:
      'Given a sorted (ascending) array `nums` of distinct integers and a `target`, return the index of `target` or `-1` if it is not present.',
    constraints: ['1 <= nums.length <= 10^4', 'nums is sorted in ascending order with distinct values.'],
    starterCode: starter(
      'function search(nums, target) {\n  // Write your solution here\n}\n',
      'def search(nums, target):\n    # Write your solution here\n    pass\n',
      '#include <bits/stdc++.h>\nusing namespace std;\n\nint search(vector<int>& nums, int target) {\n    // Write your solution here\n}\n',
    ),
    examples: [{ input: 'nums = [-1,0,3,5,9,12], target = 9', output: '4', explanation: '9 is at index 4.' }],
    reference: (args) => {
      const nums = args[0] as number[];
      const target = args[1] as number;
      let lo = 0;
      let hi = nums.length - 1;
      while (lo <= hi) {
        const mid = (lo + hi) >> 1;
        const value = nums[mid] as number;
        if (value === target) {
          return mid;
        }
        if (value < target) {
          lo = mid + 1;
        } else {
          hi = mid - 1;
        }
      }
      return -1;
    },
    variants: 15,
    buildCases: (_variant, rng) => {
      const cases: unknown[][] = [];
      for (let c = 0; c < 7; c += 1) {
        const values = rng.distinct(rng.int(4, 9), -30, 30).sort((a, b) => a - b);
        const target = c % 2 === 0 ? (values[rng.int(0, values.length - 1)] as number) : rng.int(31, 60);
        cases.push([values, target]);
      }
      return cases;
    },
  },
  {
    slugBase: 'search-insert-position',
    title: 'Search Insert Position',
    difficulty: 'EASY',
    tags: ['Array', 'Binary Search'],
    functionName: 'searchInsert',
    harness: { paramTypes: ['int[]', 'int'], returnType: 'int', cpp: { signature: 'int searchInsert(vector<int>& nums, int target)' } },
    timeLimitMinutes: 15,
    description:
      'Given a sorted array of distinct integers and a `target`, return the index if found. If not, return the index where it would be inserted to keep the array sorted.',
    constraints: ['1 <= nums.length <= 10^4', 'nums is sorted ascending with distinct values.'],
    starterCode: starter(
      'function searchInsert(nums, target) {\n  // Write your solution here\n}\n',
      'def searchInsert(nums, target):\n    # Write your solution here\n    pass\n',
      '#include <bits/stdc++.h>\nusing namespace std;\n\nint searchInsert(vector<int>& nums, int target) {\n    // Write your solution here\n}\n',
    ),
    examples: [{ input: 'nums = [1,3,5,6], target = 5', output: '2', explanation: '5 is at index 2.' }],
    reference: (args) => {
      const nums = args[0] as number[];
      const target = args[1] as number;
      let lo = 0;
      let hi = nums.length;
      while (lo < hi) {
        const mid = (lo + hi) >> 1;
        if ((nums[mid] as number) < target) {
          lo = mid + 1;
        } else {
          hi = mid;
        }
      }
      return lo;
    },
    variants: 15,
    buildCases: (_variant, rng) => {
      const cases: unknown[][] = [];
      for (let c = 0; c < 7; c += 1) {
        const values = rng.distinct(rng.int(4, 8), -20, 20).sort((a, b) => a - b);
        cases.push([values, rng.int(-25, 25)]);
      }
      return cases;
    },
  },
  {
    slugBase: 'sort-array',
    title: 'Sort an Array',
    difficulty: 'MEDIUM',
    tags: ['Array', 'Sorting'],
    functionName: 'sortArray',
    harness: { paramTypes: ['int[]'], returnType: 'int[]', cpp: { signature: 'vector<int> sortArray(vector<int>& nums)' } },
    timeLimitMinutes: 20,
    description: 'Given an array of integers `nums`, sort it in ascending order and return it.',
    constraints: ['1 <= nums.length <= 5 * 10^4', '-5 * 10^4 <= nums[i] <= 5 * 10^4'],
    starterCode: starter(
      'function sortArray(nums) {\n  // Write your solution here\n}\n',
      'def sortArray(nums):\n    # Write your solution here\n    pass\n',
      '#include <bits/stdc++.h>\nusing namespace std;\n\nvector<int> sortArray(vector<int>& nums) {\n    // Write your solution here\n}\n',
    ),
    examples: [{ input: 'nums = [5,2,3,1]', output: '[1,2,3,5]', explanation: 'Sorted ascending.' }],
    reference: (args) => {
      const nums = args[0] as number[];
      return [...nums].sort((a, b) => a - b);
    },
    variants: 15,
    buildCases: (_variant, rng) => Array.from({ length: 7 }, () => [rng.array(rng.int(4, 10), -40, 40)]),
  },
  {
    slugBase: 'kth-largest-element',
    title: 'Kth Largest Element in an Array',
    difficulty: 'MEDIUM',
    tags: ['Array', 'Sorting', 'Heap'],
    functionName: 'findKthLargest',
    harness: { paramTypes: ['int[]', 'int'], returnType: 'int', cpp: { signature: 'int findKthLargest(vector<int>& nums, int k)' } },
    timeLimitMinutes: 20,
    description: 'Given an integer array `nums` and an integer `k`, return the `k`th largest element in the array.',
    constraints: ['1 <= k <= nums.length <= 10^4', '-10^4 <= nums[i] <= 10^4'],
    starterCode: starter(
      'function findKthLargest(nums, k) {\n  // Write your solution here\n}\n',
      'def findKthLargest(nums, k):\n    # Write your solution here\n    pass\n',
      '#include <bits/stdc++.h>\nusing namespace std;\n\nint findKthLargest(vector<int>& nums, int k) {\n    // Write your solution here\n}\n',
    ),
    examples: [{ input: 'nums = [3,2,1,5,6,4], k = 2', output: '5', explanation: 'The 2nd largest is 5.' }],
    reference: (args) => {
      const nums = args[0] as number[];
      const k = args[1] as number;
      const sorted = [...nums].sort((a, b) => b - a);
      return sorted[k - 1] as number;
    },
    variants: 15,
    buildCases: (_variant, rng) => {
      const cases: unknown[][] = [];
      for (let c = 0; c < 7; c += 1) {
        const values = rng.distinct(rng.int(4, 9), -30, 30);
        cases.push([values, rng.int(1, values.length)]);
      }
      return cases;
    },
  },
  {
    slugBase: 'merge-sorted-arrays',
    title: 'Merge Two Sorted Arrays',
    difficulty: 'EASY',
    tags: ['Array', 'Two Pointers'],
    functionName: 'mergeSorted',
    harness: { paramTypes: ['int[]', 'int[]'], returnType: 'int[]', cpp: { signature: 'vector<int> mergeSorted(vector<int>& a, vector<int>& b)' } },
    timeLimitMinutes: 15,
    description:
      'Given two ascending sorted integer arrays `a` and `b`, merge them into a single ascending sorted array and return it.',
    constraints: ['0 <= a.length, b.length <= 10^4', 'Both arrays are sorted ascending.'],
    starterCode: starter(
      'function mergeSorted(a, b) {\n  // Write your solution here\n}\n',
      'def mergeSorted(a, b):\n    # Write your solution here\n    pass\n',
      '#include <bits/stdc++.h>\nusing namespace std;\n\nvector<int> mergeSorted(vector<int>& a, vector<int>& b) {\n    // Write your solution here\n}\n',
    ),
    examples: [{ input: 'a = [1,3,5], b = [2,4,6]', output: '[1,2,3,4,5,6]', explanation: 'Merged in order.' }],
    reference: (args) => {
      const a = args[0] as number[];
      const b = args[1] as number[];
      return [...a, ...b].sort((x, y) => x - y);
    },
    variants: 15,
    buildCases: (_variant, rng) => {
      const cases: unknown[][] = [];
      for (let c = 0; c < 7; c += 1) {
        const a = rng.array(rng.int(2, 6), -20, 20).sort((x, y) => x - y);
        const b = rng.array(rng.int(2, 6), -20, 20).sort((x, y) => x - y);
        cases.push([a, b]);
      }
      return cases;
    },
  },
];
