import { ProblemFamily } from '../types';

function starter(js: string, py: string, cpp: string): Record<'javascript' | 'python' | 'cpp', string> {
  return { javascript: js, python: py, cpp };
}

export const ARRAY_FAMILIES: ProblemFamily[] = [
  {
    slugBase: 'two-sum',
    title: 'Two Sum',
    difficulty: 'EASY',
    tags: ['Array', 'Hash Map'],
    functionName: 'twoSum',
    harness: { paramTypes: ['int[]', 'int'], returnType: 'int[]', cpp: { signature: 'vector<int> twoSum(vector<int>& nums, int target)' } },
    timeLimitMinutes: 30,
    description:
      'Given an array of integers `nums` and an integer `target`, return the indices of the two numbers that add up to `target`. Each input has exactly one solution and you may not use the same element twice. Return the indices in ascending order.',
    constraints: ['2 <= nums.length <= 1000', '-10^6 <= nums[i] <= 10^6', 'Exactly one valid answer exists.'],
    starterCode: starter(
      'function twoSum(nums, target) {\n  // Write your solution here\n}\n',
      'def twoSum(nums, target):\n    # Write your solution here\n    pass\n',
      '#include <bits/stdc++.h>\nusing namespace std;\n\nvector<int> twoSum(vector<int>& nums, int target) {\n    // Write your solution here\n}\n',
    ),
    examples: [
      { input: 'nums = [2,7,11,15], target = 9', output: '[0,1]', explanation: 'nums[0] + nums[1] == 9.' },
    ],
    reference: (args) => {
      const nums = args[0] as number[];
      const target = args[1] as number;
      const seen = new Map<number, number>();
      for (let i = 0; i < nums.length; i += 1) {
        const need = target - (nums[i] as number);
        if (seen.has(need)) {
          return [seen.get(need) as number, i];
        }
        seen.set(nums[i] as number, i);
      }
      return [];
    },
    variants: 16,
    buildCases: (_variant, rng) => {
      const cases: unknown[][] = [];
      for (let c = 0; c < 7; c += 1) {
        const size = rng.int(4, 8);
        const values = rng.distinct(size, -40, 40);
        const i = rng.int(0, values.length - 2);
        const j = rng.int(i + 1, values.length - 1);
        const target = (values[i] as number) + (values[j] as number);
        cases.push([values, target]);
      }
      return cases;
    },
  },
  {
    slugBase: 'max-subarray',
    title: 'Maximum Subarray',
    difficulty: 'MEDIUM',
    tags: ['Array', 'Dynamic Programming'],
    functionName: 'maxSubArray',
    harness: { paramTypes: ['int[]'], returnType: 'int', cpp: { signature: 'int maxSubArray(vector<int>& nums)' } },
    timeLimitMinutes: 25,
    description:
      'Given an integer array `nums`, find the contiguous subarray (containing at least one number) which has the largest sum and return its sum.',
    constraints: ['1 <= nums.length <= 1000', '-10^4 <= nums[i] <= 10^4'],
    starterCode: starter(
      'function maxSubArray(nums) {\n  // Write your solution here\n}\n',
      'def maxSubArray(nums):\n    # Write your solution here\n    pass\n',
      '#include <bits/stdc++.h>\nusing namespace std;\n\nint maxSubArray(vector<int>& nums) {\n    // Write your solution here\n}\n',
    ),
    examples: [{ input: 'nums = [-2,1,-3,4,-1,2,1,-5,4]', output: '6', explanation: '[4,-1,2,1] has the largest sum 6.' }],
    reference: (args) => {
      const nums = args[0] as number[];
      let best = nums[0] as number;
      let current = nums[0] as number;
      for (let i = 1; i < nums.length; i += 1) {
        current = Math.max(nums[i] as number, current + (nums[i] as number));
        best = Math.max(best, current);
      }
      return best;
    },
    variants: 16,
    buildCases: (_variant, rng) => {
      const cases: unknown[][] = [];
      for (let c = 0; c < 7; c += 1) {
        cases.push([rng.array(rng.int(3, 10), -20, 20)]);
      }
      return cases;
    },
  },
  {
    slugBase: 'running-sum',
    title: 'Running Sum of 1d Array',
    difficulty: 'EASY',
    tags: ['Array', 'Prefix Sum'],
    functionName: 'runningSum',
    harness: { paramTypes: ['int[]'], returnType: 'int[]', cpp: { signature: 'vector<int> runningSum(vector<int>& nums)' } },
    timeLimitMinutes: 15,
    description:
      'Given an array `nums`, return the running sum where `result[i] = nums[0] + nums[1] + ... + nums[i]`.',
    constraints: ['1 <= nums.length <= 1000', '-10^6 <= nums[i] <= 10^6'],
    starterCode: starter(
      'function runningSum(nums) {\n  // Write your solution here\n}\n',
      'def runningSum(nums):\n    # Write your solution here\n    pass\n',
      '#include <bits/stdc++.h>\nusing namespace std;\n\nvector<int> runningSum(vector<int>& nums) {\n    // Write your solution here\n}\n',
    ),
    examples: [{ input: 'nums = [1,2,3,4]', output: '[1,3,6,10]', explanation: 'Running totals.' }],
    reference: (args) => {
      const nums = args[0] as number[];
      const out: number[] = [];
      let total = 0;
      for (const value of nums) {
        total += value;
        out.push(total);
      }
      return out;
    },
    variants: 15,
    buildCases: (_variant, rng) => Array.from({ length: 7 }, () => [rng.array(rng.int(3, 9), -30, 30)]),
  },
  {
    slugBase: 'best-time-to-buy-sell-stock',
    title: 'Best Time to Buy and Sell Stock',
    difficulty: 'EASY',
    tags: ['Array', 'Dynamic Programming'],
    functionName: 'maxProfit',
    harness: { paramTypes: ['int[]'], returnType: 'int', cpp: { signature: 'int maxProfit(vector<int>& prices)' } },
    timeLimitMinutes: 20,
    description:
      'You are given an array `prices` where `prices[i]` is the price of a stock on day `i`. Maximize your profit by choosing a single day to buy and a later day to sell. Return the maximum profit, or 0 if no profit is possible.',
    constraints: ['1 <= prices.length <= 1000', '0 <= prices[i] <= 10^4'],
    starterCode: starter(
      'function maxProfit(prices) {\n  // Write your solution here\n}\n',
      'def maxProfit(prices):\n    # Write your solution here\n    pass\n',
      '#include <bits/stdc++.h>\nusing namespace std;\n\nint maxProfit(vector<int>& prices) {\n    // Write your solution here\n}\n',
    ),
    examples: [{ input: 'prices = [7,1,5,3,6,4]', output: '5', explanation: 'Buy at 1, sell at 6.' }],
    reference: (args) => {
      const prices = args[0] as number[];
      let min = Infinity;
      let best = 0;
      for (const price of prices) {
        min = Math.min(min, price);
        best = Math.max(best, price - min);
      }
      return best;
    },
    variants: 15,
    buildCases: (_variant, rng) => Array.from({ length: 7 }, () => [rng.array(rng.int(2, 10), 0, 50)]),
  },
  {
    slugBase: 'majority-element',
    title: 'Majority Element',
    difficulty: 'EASY',
    tags: ['Array', 'Hash Map'],
    functionName: 'majorityElement',
    harness: { paramTypes: ['int[]'], returnType: 'int', cpp: { signature: 'int majorityElement(vector<int>& nums)' } },
    timeLimitMinutes: 15,
    description:
      'Given an array `nums` of size `n`, return the majority element (the element that appears more than `n / 2` times). The majority element always exists.',
    constraints: ['1 <= nums.length <= 1000', 'The majority element always exists.'],
    starterCode: starter(
      'function majorityElement(nums) {\n  // Write your solution here\n}\n',
      'def majorityElement(nums):\n    # Write your solution here\n    pass\n',
      '#include <bits/stdc++.h>\nusing namespace std;\n\nint majorityElement(vector<int>& nums) {\n    // Write your solution here\n}\n',
    ),
    examples: [{ input: 'nums = [2,2,1,1,1,2,2]', output: '2', explanation: '2 appears 4 times.' }],
    reference: (args) => {
      const nums = args[0] as number[];
      let count = 0;
      let candidate = 0;
      for (const value of nums) {
        if (count === 0) {
          candidate = value;
        }
        count += value === candidate ? 1 : -1;
      }
      return candidate;
    },
    variants: 15,
    buildCases: (_variant, rng) => {
      const cases: unknown[][] = [];
      for (let c = 0; c < 7; c += 1) {
        const half = rng.int(2, 5);
        const major = rng.int(-9, 9);
        const values: number[] = Array.from({ length: half + 1 }, () => major);
        for (let k = 0; k < half; k += 1) {
          values.push(rng.int(-9, 9));
        }
        for (let k = values.length - 1; k > 0; k -= 1) {
          const swap = rng.int(0, k);
          const tmp = values[k] as number;
          values[k] = values[swap] as number;
          values[swap] = tmp;
        }
        cases.push([values]);
      }
      return cases;
    },
  },
  {
    slugBase: 'contains-duplicate',
    title: 'Contains Duplicate',
    difficulty: 'EASY',
    tags: ['Array', 'Hash Set'],
    functionName: 'containsDuplicate',
    harness: { paramTypes: ['int[]'], returnType: 'bool', cpp: { signature: 'bool containsDuplicate(vector<int>& nums)' } },
    timeLimitMinutes: 15,
    description:
      'Given an integer array `nums`, return `true` if any value appears at least twice, and `false` if every element is distinct.',
    constraints: ['1 <= nums.length <= 1000', '-10^9 <= nums[i] <= 10^9'],
    starterCode: starter(
      'function containsDuplicate(nums) {\n  // Write your solution here\n}\n',
      'def containsDuplicate(nums):\n    # Write your solution here\n    pass\n',
      '#include <bits/stdc++.h>\nusing namespace std;\n\nbool containsDuplicate(vector<int>& nums) {\n    // Write your solution here\n}\n',
    ),
    examples: [{ input: 'nums = [1,2,3,1]', output: 'true', explanation: '1 appears twice.' }],
    reference: (args) => {
      const nums = args[0] as number[];
      return new Set(nums).size !== nums.length;
    },
    variants: 15,
    buildCases: (_variant, rng) => {
      const cases: unknown[][] = [];
      for (let c = 0; c < 7; c += 1) {
        if (c % 2 === 0) {
          cases.push([rng.distinct(rng.int(3, 8), -20, 20)]);
        } else {
          const values = rng.array(rng.int(4, 8), -5, 5);
          cases.push([values]);
        }
      }
      return cases;
    },
  },
  {
    slugBase: 'single-number',
    title: 'Single Number',
    difficulty: 'EASY',
    tags: ['Array', 'Bit Manipulation'],
    functionName: 'singleNumber',
    harness: { paramTypes: ['int[]'], returnType: 'int', cpp: { signature: 'int singleNumber(vector<int>& nums)' } },
    timeLimitMinutes: 15,
    description:
      'Given a non-empty array `nums` where every element appears twice except for one, find that single element.',
    constraints: ['1 <= nums.length <= 1000', 'Exactly one element appears once; all others appear twice.'],
    starterCode: starter(
      'function singleNumber(nums) {\n  // Write your solution here\n}\n',
      'def singleNumber(nums):\n    # Write your solution here\n    pass\n',
      '#include <bits/stdc++.h>\nusing namespace std;\n\nint singleNumber(vector<int>& nums) {\n    // Write your solution here\n}\n',
    ),
    examples: [{ input: 'nums = [4,1,2,1,2]', output: '4', explanation: '4 appears once.' }],
    reference: (args) => {
      const nums = args[0] as number[];
      return nums.reduce((acc, value) => acc ^ value, 0);
    },
    variants: 15,
    buildCases: (_variant, rng) => {
      const cases: unknown[][] = [];
      for (let c = 0; c < 7; c += 1) {
        const pairs = rng.distinct(rng.int(2, 5), -30, 30);
        const single = rng.int(40, 80);
        const values: number[] = [single];
        for (const value of pairs) {
          values.push(value, value);
        }
        for (let k = values.length - 1; k > 0; k -= 1) {
          const swap = rng.int(0, k);
          const tmp = values[k] as number;
          values[k] = values[swap] as number;
          values[swap] = tmp;
        }
        cases.push([values]);
      }
      return cases;
    },
  },
  {
    slugBase: 'move-zeroes',
    title: 'Move Zeroes',
    difficulty: 'EASY',
    tags: ['Array', 'Two Pointers'],
    functionName: 'moveZeroes',
    harness: { paramTypes: ['int[]'], returnType: 'int[]', cpp: { signature: 'vector<int> moveZeroes(vector<int>& nums)' } },
    timeLimitMinutes: 15,
    description:
      'Given an integer array `nums`, move all `0`s to the end while keeping the relative order of the non-zero elements. Return the resulting array.',
    constraints: ['1 <= nums.length <= 1000', '-10^6 <= nums[i] <= 10^6'],
    starterCode: starter(
      'function moveZeroes(nums) {\n  // Write your solution here\n}\n',
      'def moveZeroes(nums):\n    # Write your solution here\n    pass\n',
      '#include <bits/stdc++.h>\nusing namespace std;\n\nvector<int> moveZeroes(vector<int>& nums) {\n    // Write your solution here\n}\n',
    ),
    examples: [{ input: 'nums = [0,1,0,3,12]', output: '[1,3,12,0,0]', explanation: 'Zeroes pushed to the end.' }],
    reference: (args) => {
      const nums = args[0] as number[];
      const nonZero = nums.filter((value) => value !== 0);
      const zeros = nums.length - nonZero.length;
      return [...nonZero, ...Array.from({ length: zeros }, () => 0)];
    },
    variants: 15,
    buildCases: (_variant, rng) =>
      Array.from({ length: 7 }, () => [rng.array(rng.int(4, 9), -3, 3)]),
  },
];
