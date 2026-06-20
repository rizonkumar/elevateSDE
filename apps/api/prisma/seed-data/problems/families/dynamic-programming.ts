import { ProblemFamily } from '../types';

function starter(js: string, py: string, cpp: string): Record<'javascript' | 'python' | 'cpp', string> {
  return { javascript: js, python: py, cpp };
}

export const DP_FAMILIES: ProblemFamily[] = [
  {
    slugBase: 'climbing-stairs',
    title: 'Climbing Stairs',
    difficulty: 'EASY',
    tags: ['Dynamic Programming'],
    functionName: 'climbStairs',
    harness: { paramTypes: ['int'], returnType: 'int', cpp: { signature: 'int climbStairs(int n)' } },
    timeLimitMinutes: 15,
    description:
      'You are climbing a staircase that takes `n` steps to reach the top. Each time you can climb 1 or 2 steps. Return the number of distinct ways to reach the top.',
    constraints: ['1 <= n <= 40'],
    starterCode: starter(
      'function climbStairs(n) {\n  // Write your solution here\n}\n',
      'def climbStairs(n):\n    # Write your solution here\n    pass\n',
      '#include <bits/stdc++.h>\nusing namespace std;\n\nint climbStairs(int n) {\n    // Write your solution here\n}\n',
    ),
    examples: [{ input: 'n = 3', output: '3', explanation: '1+1+1, 1+2, 2+1.' }],
    reference: (args) => {
      const n = args[0] as number;
      let a = 1;
      let b = 1;
      for (let i = 0; i < n; i += 1) {
        [a, b] = [b, a + b];
      }
      return a;
    },
    variants: 15,
    buildCases: (_variant, rng) => Array.from({ length: 7 }, () => [rng.int(1, 30)]),
  },
  {
    slugBase: 'fibonacci-number',
    title: 'Fibonacci Number',
    difficulty: 'EASY',
    tags: ['Dynamic Programming', 'Math'],
    functionName: 'fib',
    harness: { paramTypes: ['int'], returnType: 'int', cpp: { signature: 'long long fib(int n)' } },
    timeLimitMinutes: 10,
    description: 'Given `n`, return the `n`th Fibonacci number where `fib(0) = 0`, `fib(1) = 1`.',
    constraints: ['0 <= n <= 50'],
    starterCode: starter(
      'function fib(n) {\n  // Write your solution here\n}\n',
      'def fib(n):\n    # Write your solution here\n    pass\n',
      '#include <bits/stdc++.h>\nusing namespace std;\n\nlong long fib(int n) {\n    // Write your solution here\n}\n',
    ),
    examples: [{ input: 'n = 4', output: '3', explanation: '0,1,1,2,3.' }],
    reference: (args) => {
      const n = args[0] as number;
      let a = 0;
      let b = 1;
      for (let i = 0; i < n; i += 1) {
        [a, b] = [b, a + b];
      }
      return a;
    },
    variants: 15,
    buildCases: (_variant, rng) => Array.from({ length: 7 }, () => [rng.int(0, 40)]),
  },
  {
    slugBase: 'house-robber',
    title: 'House Robber',
    difficulty: 'MEDIUM',
    tags: ['Dynamic Programming', 'Array'],
    functionName: 'rob',
    harness: { paramTypes: ['int[]'], returnType: 'int', cpp: { signature: 'int rob(vector<int>& nums)' } },
    timeLimitMinutes: 20,
    description:
      'Given an integer array `nums` representing money in each house, return the maximum amount you can rob without robbing two adjacent houses.',
    constraints: ['1 <= nums.length <= 100', '0 <= nums[i] <= 400'],
    starterCode: starter(
      'function rob(nums) {\n  // Write your solution here\n}\n',
      'def rob(nums):\n    # Write your solution here\n    pass\n',
      '#include <bits/stdc++.h>\nusing namespace std;\n\nint rob(vector<int>& nums) {\n    // Write your solution here\n}\n',
    ),
    examples: [{ input: 'nums = [2,7,9,3,1]', output: '12', explanation: 'Rob houses 0, 2, 4.' }],
    reference: (args) => {
      const nums = args[0] as number[];
      let prev = 0;
      let curr = 0;
      for (const value of nums) {
        [prev, curr] = [curr, Math.max(curr, prev + value)];
      }
      return curr;
    },
    variants: 15,
    buildCases: (_variant, rng) => Array.from({ length: 7 }, () => [rng.array(rng.int(2, 9), 0, 50)]),
  },
  {
    slugBase: 'coin-change',
    title: 'Coin Change',
    difficulty: 'MEDIUM',
    tags: ['Dynamic Programming'],
    functionName: 'coinChange',
    harness: { paramTypes: ['int[]', 'int'], returnType: 'int', cpp: { signature: 'int coinChange(vector<int>& coins, int amount)' } },
    timeLimitMinutes: 25,
    description:
      'Given coin denominations `coins` and an integer `amount`, return the fewest number of coins needed to make up that amount. If it cannot be made, return `-1`.',
    constraints: ['1 <= coins.length <= 12', '1 <= coins[i] <= 100', '0 <= amount <= 1000'],
    starterCode: starter(
      'function coinChange(coins, amount) {\n  // Write your solution here\n}\n',
      'def coinChange(coins, amount):\n    # Write your solution here\n    pass\n',
      '#include <bits/stdc++.h>\nusing namespace std;\n\nint coinChange(vector<int>& coins, int amount) {\n    // Write your solution here\n}\n',
    ),
    examples: [{ input: 'coins = [1,2,5], amount = 11', output: '3', explanation: '5 + 5 + 1.' }],
    reference: (args) => {
      const coins = args[0] as number[];
      const amount = args[1] as number;
      const dp = new Array<number>(amount + 1).fill(Infinity);
      dp[0] = 0;
      for (let value = 1; value <= amount; value += 1) {
        for (const coin of coins) {
          if (coin <= value) {
            dp[value] = Math.min(dp[value] as number, (dp[value - coin] as number) + 1);
          }
        }
      }
      const result = dp[amount] as number;
      return result === Infinity ? -1 : result;
    },
    variants: 15,
    buildCases: (_variant, rng) => {
      const cases: unknown[][] = [];
      for (let c = 0; c < 7; c += 1) {
        const coins = rng.distinct(rng.int(2, 4), 1, 9);
        cases.push([coins, rng.int(0, 40)]);
      }
      return cases;
    },
  },
];
