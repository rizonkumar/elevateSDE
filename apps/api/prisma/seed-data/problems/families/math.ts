import { ProblemFamily } from '../types';

function starter(js: string, py: string, cpp: string): Record<'javascript' | 'python' | 'cpp', string> {
  return { javascript: js, python: py, cpp };
}

export const MATH_FAMILIES: ProblemFamily[] = [
  {
    slugBase: 'fizz-buzz',
    title: 'Fizz Buzz',
    difficulty: 'EASY',
    tags: ['Math', 'String'],
    functionName: 'fizzBuzz',
    harness: { paramTypes: ['int'], returnType: 'string[]', cpp: { signature: 'vector<string> fizzBuzz(int n)' } },
    timeLimitMinutes: 10,
    description:
      'Given an integer `n`, return a string array `answer` (1-indexed) where for each `i`: "FizzBuzz" if divisible by 3 and 5, "Fizz" if divisible by 3, "Buzz" if divisible by 5, otherwise the number as a string.',
    constraints: ['1 <= n <= 100'],
    starterCode: starter(
      'function fizzBuzz(n) {\n  // Write your solution here\n}\n',
      'def fizzBuzz(n):\n    # Write your solution here\n    pass\n',
      '#include <bits/stdc++.h>\nusing namespace std;\n\nvector<string> fizzBuzz(int n) {\n    // Write your solution here\n}\n',
    ),
    examples: [{ input: 'n = 5', output: '["1","2","Fizz","4","Buzz"]', explanation: 'Standard FizzBuzz.' }],
    reference: (args) => {
      const n = args[0] as number;
      const out: string[] = [];
      for (let i = 1; i <= n; i += 1) {
        if (i % 15 === 0) {
          out.push('FizzBuzz');
        } else if (i % 3 === 0) {
          out.push('Fizz');
        } else if (i % 5 === 0) {
          out.push('Buzz');
        } else {
          out.push(String(i));
        }
      }
      return out;
    },
    variants: 14,
    buildCases: (_variant, rng) => Array.from({ length: 6 }, () => [rng.int(3, 20)]),
  },
  {
    slugBase: 'is-prime',
    title: 'Check Prime',
    difficulty: 'EASY',
    tags: ['Math'],
    functionName: 'isPrime',
    harness: { paramTypes: ['int'], returnType: 'bool', cpp: { signature: 'bool isPrime(int n)' } },
    timeLimitMinutes: 10,
    description: 'Given an integer `n`, return `true` if it is a prime number, otherwise `false`.',
    constraints: ['0 <= n <= 10^6'],
    starterCode: starter(
      'function isPrime(n) {\n  // Write your solution here\n}\n',
      'def isPrime(n):\n    # Write your solution here\n    pass\n',
      '#include <bits/stdc++.h>\nusing namespace std;\n\nbool isPrime(int n) {\n    // Write your solution here\n}\n',
    ),
    examples: [{ input: 'n = 7', output: 'true', explanation: '7 is prime.' }],
    reference: (args) => {
      const n = args[0] as number;
      if (n < 2) {
        return false;
      }
      for (let i = 2; i * i <= n; i += 1) {
        if (n % i === 0) {
          return false;
        }
      }
      return true;
    },
    variants: 14,
    buildCases: (_variant, rng) => Array.from({ length: 7 }, () => [rng.int(0, 120)]),
  },
  {
    slugBase: 'power-of-two',
    title: 'Power of Two',
    difficulty: 'EASY',
    tags: ['Math', 'Bit Manipulation'],
    functionName: 'isPowerOfTwo',
    harness: { paramTypes: ['int'], returnType: 'bool', cpp: { signature: 'bool isPowerOfTwo(int n)' } },
    timeLimitMinutes: 10,
    description: 'Given an integer `n`, return `true` if it is a power of two, otherwise `false`.',
    constraints: ['-2^31 <= n <= 2^31 - 1'],
    starterCode: starter(
      'function isPowerOfTwo(n) {\n  // Write your solution here\n}\n',
      'def isPowerOfTwo(n):\n    # Write your solution here\n    pass\n',
      '#include <bits/stdc++.h>\nusing namespace std;\n\nbool isPowerOfTwo(int n) {\n    // Write your solution here\n}\n',
    ),
    examples: [{ input: 'n = 16', output: 'true', explanation: '2^4 = 16.' }],
    reference: (args) => {
      const n = args[0] as number;
      return n > 0 && (n & (n - 1)) === 0;
    },
    variants: 14,
    buildCases: (_variant, rng) => {
      const cases: unknown[][] = [];
      for (let c = 0; c < 7; c += 1) {
        if (c % 2 === 0) {
          cases.push([2 ** rng.int(0, 10)]);
        } else {
          cases.push([rng.int(0, 100)]);
        }
      }
      return cases;
    },
  },
  {
    slugBase: 'sum-of-digits',
    title: 'Sum of Digits',
    difficulty: 'EASY',
    tags: ['Math'],
    functionName: 'sumOfDigits',
    harness: { paramTypes: ['int'], returnType: 'int', cpp: { signature: 'int sumOfDigits(int n)' } },
    timeLimitMinutes: 10,
    description: 'Given a non-negative integer `n`, return the sum of its digits.',
    constraints: ['0 <= n <= 10^9'],
    starterCode: starter(
      'function sumOfDigits(n) {\n  // Write your solution here\n}\n',
      'def sumOfDigits(n):\n    # Write your solution here\n    pass\n',
      '#include <bits/stdc++.h>\nusing namespace std;\n\nint sumOfDigits(int n) {\n    // Write your solution here\n}\n',
    ),
    examples: [{ input: 'n = 1234', output: '10', explanation: '1+2+3+4 = 10.' }],
    reference: (args) => {
      let n = args[0] as number;
      let total = 0;
      while (n > 0) {
        total += n % 10;
        n = Math.floor(n / 10);
      }
      return total;
    },
    variants: 14,
    buildCases: (_variant, rng) => Array.from({ length: 7 }, () => [rng.int(0, 999999)]),
  },
  {
    slugBase: 'greatest-common-divisor',
    title: 'Greatest Common Divisor',
    difficulty: 'EASY',
    tags: ['Math'],
    functionName: 'gcd',
    harness: { paramTypes: ['int', 'int'], returnType: 'int', cpp: { signature: 'int gcd(int a, int b)' } },
    timeLimitMinutes: 10,
    description: 'Given two positive integers `a` and `b`, return their greatest common divisor.',
    constraints: ['1 <= a, b <= 10^6'],
    starterCode: starter(
      'function gcd(a, b) {\n  // Write your solution here\n}\n',
      'def gcd(a, b):\n    # Write your solution here\n    pass\n',
      '#include <bits/stdc++.h>\nusing namespace std;\n\nint gcd(int a, int b) {\n    // Write your solution here\n}\n',
    ),
    examples: [{ input: 'a = 12, b = 18', output: '6', explanation: 'gcd(12, 18) = 6.' }],
    reference: (args) => {
      let a = args[0] as number;
      let b = args[1] as number;
      while (b !== 0) {
        [a, b] = [b, a % b];
      }
      return a;
    },
    variants: 14,
    buildCases: (_variant, rng) => Array.from({ length: 7 }, () => [rng.int(1, 200), rng.int(1, 200)]),
  },
  {
    slugBase: 'count-primes',
    title: 'Count Primes',
    difficulty: 'MEDIUM',
    tags: ['Math', 'Sieve'],
    functionName: 'countPrimes',
    harness: { paramTypes: ['int'], returnType: 'int', cpp: { signature: 'int countPrimes(int n)' } },
    timeLimitMinutes: 20,
    description: 'Given an integer `n`, return the number of prime numbers strictly less than `n`.',
    constraints: ['0 <= n <= 5 * 10^4'],
    starterCode: starter(
      'function countPrimes(n) {\n  // Write your solution here\n}\n',
      'def countPrimes(n):\n    # Write your solution here\n    pass\n',
      '#include <bits/stdc++.h>\nusing namespace std;\n\nint countPrimes(int n) {\n    // Write your solution here\n}\n',
    ),
    examples: [{ input: 'n = 10', output: '4', explanation: '2, 3, 5, 7 are below 10.' }],
    reference: (args) => {
      const n = args[0] as number;
      if (n < 3) {
        return 0;
      }
      const sieve = new Array<boolean>(n).fill(true);
      let count = 0;
      for (let i = 2; i < n; i += 1) {
        if (sieve[i]) {
          count += 1;
          for (let j = i * i; j < n; j += i) {
            sieve[j] = false;
          }
        }
      }
      return count;
    },
    variants: 14,
    buildCases: (_variant, rng) => Array.from({ length: 6 }, () => [rng.int(0, 200)]),
  },
];
