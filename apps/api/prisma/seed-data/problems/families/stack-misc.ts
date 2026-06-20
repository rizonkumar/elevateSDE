import { ProblemFamily, Rng } from '../types';

function starter(js: string, py: string, cpp: string): Record<'javascript' | 'python' | 'cpp', string> {
  return { javascript: js, python: py, cpp };
}

export const STACK_MISC_FAMILIES: ProblemFamily[] = [
  {
    slugBase: 'valid-parentheses',
    title: 'Valid Parentheses',
    difficulty: 'EASY',
    tags: ['String', 'Stack'],
    functionName: 'isValid',
    harness: { paramTypes: ['string'], returnType: 'bool', cpp: { signature: 'bool isValid(string s)' } },
    timeLimitMinutes: 20,
    description:
      'Given a string `s` containing just the characters `()[]{}`, determine if the input string is valid. Brackets must close in the correct order and each open bracket must be matched.',
    constraints: ['1 <= s.length <= 1000', "s consists of '()[]{}' only."],
    starterCode: starter(
      'function isValid(s) {\n  // Write your solution here\n}\n',
      'def isValid(s):\n    # Write your solution here\n    pass\n',
      '#include <bits/stdc++.h>\nusing namespace std;\n\nbool isValid(string s) {\n    // Write your solution here\n}\n',
    ),
    examples: [{ input: 's = "()[]{}"', output: 'true', explanation: 'All brackets matched.' }],
    reference: (args) => {
      const s = args[0] as string;
      const pairs: Record<string, string> = { ')': '(', ']': '[', '}': '{' };
      const stack: string[] = [];
      for (const ch of s) {
        if (ch === '(' || ch === '[' || ch === '{') {
          stack.push(ch);
        } else if (stack.pop() !== pairs[ch]) {
          return false;
        }
      }
      return stack.length === 0;
    },
    variants: 15,
    buildCases: (_variant, rng: Rng) => {
      const tokens = ['()', '[]', '{}', '([])', '{[]}', '(]', '([)]', '((', '))'];
      const cases: unknown[][] = [];
      for (let c = 0; c < 7; c += 1) {
        let value = '';
        const parts = rng.int(1, 3);
        for (let k = 0; k < parts; k += 1) {
          value += tokens[rng.int(0, tokens.length - 1)] ?? '()';
        }
        cases.push([value]);
      }
      return cases;
    },
  },
  {
    slugBase: 'baseball-game',
    title: 'Baseball Game',
    difficulty: 'EASY',
    tags: ['Stack', 'Array'],
    functionName: 'calPoints',
    harness: { paramTypes: ['string[]'], returnType: 'int', cpp: { signature: 'int calPoints(vector<string>& ops)' } },
    timeLimitMinutes: 20,
    description:
      'You are keeping score using operations `ops`. An integer adds that score; "+" adds the sum of the previous two; "D" doubles the previous; "C" cancels the previous. Return the total sum of the record after all operations.',
    constraints: ['1 <= ops.length <= 1000', 'Operations are valid integers or one of "+", "D", "C".'],
    starterCode: starter(
      'function calPoints(ops) {\n  // Write your solution here\n}\n',
      'def calPoints(ops):\n    # Write your solution here\n    pass\n',
      '#include <bits/stdc++.h>\nusing namespace std;\n\nint calPoints(vector<string>& ops) {\n    // Write your solution here\n}\n',
    ),
    examples: [{ input: 'ops = ["5","2","C","D","+"]', output: '30', explanation: 'Record becomes [5,10,15].' }],
    reference: (args) => {
      const ops = args[0] as string[];
      const stack: number[] = [];
      for (const op of ops) {
        if (op === 'C') {
          stack.pop();
        } else if (op === 'D') {
          stack.push((stack[stack.length - 1] as number) * 2);
        } else if (op === '+') {
          stack.push((stack[stack.length - 1] as number) + (stack[stack.length - 2] as number));
        } else {
          stack.push(Number(op));
        }
      }
      return stack.reduce((acc, value) => acc + value, 0);
    },
    variants: 15,
    buildCases: (_variant, rng) => {
      const cases: unknown[][] = [];
      for (let c = 0; c < 7; c += 1) {
        const ops: string[] = [String(rng.int(1, 9)), String(rng.int(1, 9))];
        const extras = rng.int(2, 5);
        for (let k = 0; k < extras; k += 1) {
          const choice = rng.int(0, 3);
          if (choice === 0) {
            ops.push('+');
          } else if (choice === 1) {
            ops.push('D');
          } else if (choice === 2) {
            ops.push('C');
          } else {
            ops.push(String(rng.int(1, 9)));
          }
        }
        cases.push([ops]);
      }
      return cases;
    },
  },
  {
    slugBase: 'remove-duplicates-sorted',
    title: 'Remove Duplicates from Sorted Array',
    difficulty: 'EASY',
    tags: ['Array', 'Two Pointers'],
    functionName: 'dedupeSorted',
    harness: { paramTypes: ['int[]'], returnType: 'int[]', cpp: { signature: 'vector<int> dedupeSorted(vector<int>& nums)' } },
    timeLimitMinutes: 15,
    description:
      'Given an ascending sorted array `nums`, remove the duplicates in place conceptually and return the array of unique values in ascending order.',
    constraints: ['0 <= nums.length <= 3 * 10^4', 'nums is sorted ascending.'],
    starterCode: starter(
      'function dedupeSorted(nums) {\n  // Write your solution here\n}\n',
      'def dedupeSorted(nums):\n    # Write your solution here\n    pass\n',
      '#include <bits/stdc++.h>\nusing namespace std;\n\nvector<int> dedupeSorted(vector<int>& nums) {\n    // Write your solution here\n}\n',
    ),
    examples: [{ input: 'nums = [1,1,2]', output: '[1,2]', explanation: 'Unique values.' }],
    reference: (args) => {
      const nums = args[0] as number[];
      const out: number[] = [];
      for (const value of nums) {
        if (out[out.length - 1] !== value) {
          out.push(value);
        }
      }
      return out;
    },
    variants: 15,
    buildCases: (_variant, rng) => {
      const cases: unknown[][] = [];
      for (let c = 0; c < 7; c += 1) {
        const values = rng.array(rng.int(4, 9), 1, 5).sort((a, b) => a - b);
        cases.push([values]);
      }
      return cases;
    },
  },
];
