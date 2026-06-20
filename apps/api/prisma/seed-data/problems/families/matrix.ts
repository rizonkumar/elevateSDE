import { ProblemFamily } from '../types';

function starter(js: string, py: string, cpp: string): Record<'javascript' | 'python' | 'cpp', string> {
  return { javascript: js, python: py, cpp };
}

export const MATRIX_FAMILIES: ProblemFamily[] = [
  {
    slugBase: 'transpose-matrix',
    title: 'Transpose Matrix',
    difficulty: 'EASY',
    tags: ['Matrix', 'Array'],
    functionName: 'transpose',
    harness: { paramTypes: ['int[][]'], returnType: 'int[][]', cpp: { signature: 'vector<vector<int>> transpose(vector<vector<int>>& matrix)' } },
    timeLimitMinutes: 15,
    description:
      'Given a 2D integer matrix, return its transpose (flip the matrix over its main diagonal, swapping rows and columns).',
    constraints: ['1 <= matrix.length, matrix[i].length <= 100', '-10^9 <= matrix[i][j] <= 10^9'],
    starterCode: starter(
      'function transpose(matrix) {\n  // Write your solution here\n}\n',
      'def transpose(matrix):\n    # Write your solution here\n    pass\n',
      '#include <bits/stdc++.h>\nusing namespace std;\n\nvector<vector<int>> transpose(vector<vector<int>>& matrix) {\n    // Write your solution here\n}\n',
    ),
    examples: [{ input: 'matrix = [[1,2,3],[4,5,6]]', output: '[[1,4],[2,5],[3,6]]', explanation: 'Rows become columns.' }],
    reference: (args) => {
      const matrix = args[0] as number[][];
      const rows = matrix.length;
      const cols = (matrix[0] as number[]).length;
      const out: number[][] = [];
      for (let c = 0; c < cols; c += 1) {
        const row: number[] = [];
        for (let r = 0; r < rows; r += 1) {
          row.push((matrix[r] as number[])[c] as number);
        }
        out.push(row);
      }
      return out;
    },
    variants: 15,
    buildCases: (_variant, rng) => {
      const cases: unknown[][] = [];
      for (let c = 0; c < 6; c += 1) {
        const rows = rng.int(2, 4);
        const cols = rng.int(2, 4);
        const matrix = Array.from({ length: rows }, () => rng.array(cols, -9, 9));
        cases.push([matrix]);
      }
      return cases;
    },
  },
  {
    slugBase: 'matrix-row-sums',
    title: 'Matrix Row Sums',
    difficulty: 'EASY',
    tags: ['Matrix', 'Array'],
    functionName: 'rowSums',
    harness: { paramTypes: ['int[][]'], returnType: 'int[]', cpp: { signature: 'vector<int> rowSums(vector<vector<int>>& matrix)' } },
    timeLimitMinutes: 15,
    description: 'Given a 2D integer matrix, return an array where each element is the sum of the corresponding row.',
    constraints: ['1 <= matrix.length, matrix[i].length <= 100', '-10^4 <= matrix[i][j] <= 10^4'],
    starterCode: starter(
      'function rowSums(matrix) {\n  // Write your solution here\n}\n',
      'def rowSums(matrix):\n    # Write your solution here\n    pass\n',
      '#include <bits/stdc++.h>\nusing namespace std;\n\nvector<int> rowSums(vector<vector<int>>& matrix) {\n    // Write your solution here\n}\n',
    ),
    examples: [{ input: 'matrix = [[1,2],[3,4]]', output: '[3,7]', explanation: 'Row sums.' }],
    reference: (args) => {
      const matrix = args[0] as number[][];
      return matrix.map((row) => row.reduce((acc, value) => acc + value, 0));
    },
    variants: 15,
    buildCases: (_variant, rng) => {
      const cases: unknown[][] = [];
      for (let c = 0; c < 6; c += 1) {
        const rows = rng.int(2, 4);
        const cols = rng.int(2, 4);
        const matrix = Array.from({ length: rows }, () => rng.array(cols, -20, 20));
        cases.push([matrix]);
      }
      return cases;
    },
  },
];
