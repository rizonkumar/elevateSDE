import { ProblemFamily, Rng } from '../types';

function starter(js: string, py: string, cpp: string): Record<'javascript' | 'python' | 'cpp', string> {
  return { javascript: js, python: py, cpp };
}

const ALPHABET = 'abcdefghijklmnopqrstuvwxyz';

function randString(rng: Rng, length: number, span = 8): string {
  let out = '';
  for (let index = 0; index < length; index += 1) {
    out += ALPHABET[rng.int(0, span - 1)] ?? 'a';
  }
  return out;
}

function shuffleString(rng: Rng, value: string): string {
  const chars = value.split('');
  for (let index = chars.length - 1; index > 0; index -= 1) {
    const swap = rng.int(0, index);
    const tmp = chars[index] as string;
    chars[index] = chars[swap] as string;
    chars[swap] = tmp;
  }
  return chars.join('');
}

export const STRING_FAMILIES: ProblemFamily[] = [
  {
    slugBase: 'reverse-string',
    title: 'Reverse String',
    difficulty: 'EASY',
    tags: ['String', 'Two Pointers'],
    functionName: 'reverseString',
    harness: { paramTypes: ['string'], returnType: 'string', cpp: { signature: 'string reverseString(string s)' } },
    timeLimitMinutes: 10,
    description: 'Given a string `s`, return the string reversed.',
    constraints: ['1 <= s.length <= 1000', 's consists of printable ASCII characters.'],
    starterCode: starter(
      'function reverseString(s) {\n  // Write your solution here\n}\n',
      'def reverseString(s):\n    # Write your solution here\n    pass\n',
      '#include <bits/stdc++.h>\nusing namespace std;\n\nstring reverseString(string s) {\n    // Write your solution here\n}\n',
    ),
    examples: [{ input: 's = "hello"', output: '"olleh"', explanation: 'Characters reversed.' }],
    reference: (args) => (args[0] as string).split('').reverse().join(''),
    variants: 15,
    buildCases: (_variant, rng) => Array.from({ length: 7 }, () => [randString(rng, rng.int(3, 9))]),
  },
  {
    slugBase: 'valid-anagram',
    title: 'Valid Anagram',
    difficulty: 'EASY',
    tags: ['String', 'Hash Map', 'Sorting'],
    functionName: 'isAnagram',
    harness: { paramTypes: ['string', 'string'], returnType: 'bool', cpp: { signature: 'bool isAnagram(string s, string t)' } },
    timeLimitMinutes: 15,
    description: 'Given two strings `s` and `t`, return `true` if `t` is an anagram of `s`, and `false` otherwise.',
    constraints: ['1 <= s.length, t.length <= 1000', 's and t consist of lowercase letters.'],
    starterCode: starter(
      'function isAnagram(s, t) {\n  // Write your solution here\n}\n',
      'def isAnagram(s, t):\n    # Write your solution here\n    pass\n',
      '#include <bits/stdc++.h>\nusing namespace std;\n\nbool isAnagram(string s, string t) {\n    // Write your solution here\n}\n',
    ),
    examples: [{ input: 's = "anagram", t = "nagaram"', output: 'true', explanation: 'Same letter counts.' }],
    reference: (args) => {
      const s = args[0] as string;
      const t = args[1] as string;
      return s.split('').sort().join('') === t.split('').sort().join('');
    },
    variants: 15,
    buildCases: (_variant, rng) => {
      const cases: unknown[][] = [];
      for (let c = 0; c < 7; c += 1) {
        const base = randString(rng, rng.int(3, 7));
        if (c % 2 === 0) {
          cases.push([base, shuffleString(rng, base)]);
        } else {
          cases.push([base, randString(rng, base.length)]);
        }
      }
      return cases;
    },
  },
  {
    slugBase: 'valid-palindrome',
    title: 'Valid Palindrome',
    difficulty: 'EASY',
    tags: ['String', 'Two Pointers'],
    functionName: 'isPalindrome',
    harness: { paramTypes: ['string'], returnType: 'bool', cpp: { signature: 'bool isPalindrome(string s)' } },
    timeLimitMinutes: 15,
    description:
      'Given a string `s` containing only lowercase letters, return `true` if it reads the same forwards and backwards.',
    constraints: ['1 <= s.length <= 1000', 's consists of lowercase letters.'],
    starterCode: starter(
      'function isPalindrome(s) {\n  // Write your solution here\n}\n',
      'def isPalindrome(s):\n    # Write your solution here\n    pass\n',
      '#include <bits/stdc++.h>\nusing namespace std;\n\nbool isPalindrome(string s) {\n    // Write your solution here\n}\n',
    ),
    examples: [{ input: 's = "abba"', output: 'true', explanation: 'Reads the same both ways.' }],
    reference: (args) => {
      const s = args[0] as string;
      return s === s.split('').reverse().join('');
    },
    variants: 15,
    buildCases: (_variant, rng) => {
      const cases: unknown[][] = [];
      for (let c = 0; c < 7; c += 1) {
        if (c % 2 === 0) {
          const half = randString(rng, rng.int(2, 4));
          cases.push([half + half.split('').reverse().join('')]);
        } else {
          cases.push([randString(rng, rng.int(3, 7))]);
        }
      }
      return cases;
    },
  },
  {
    slugBase: 'first-unique-character',
    title: 'First Unique Character in a String',
    difficulty: 'EASY',
    tags: ['String', 'Hash Map'],
    functionName: 'firstUniqChar',
    harness: { paramTypes: ['string'], returnType: 'int', cpp: { signature: 'int firstUniqChar(string s)' } },
    timeLimitMinutes: 15,
    description:
      'Given a string `s`, return the index of the first non-repeating character. If it does not exist, return `-1`.',
    constraints: ['1 <= s.length <= 1000', 's consists of lowercase letters.'],
    starterCode: starter(
      'function firstUniqChar(s) {\n  // Write your solution here\n}\n',
      'def firstUniqChar(s):\n    # Write your solution here\n    pass\n',
      '#include <bits/stdc++.h>\nusing namespace std;\n\nint firstUniqChar(string s) {\n    // Write your solution here\n}\n',
    ),
    examples: [{ input: 's = "leetcode"', output: '0', explanation: 'l is the first unique character.' }],
    reference: (args) => {
      const s = args[0] as string;
      const counts = new Map<string, number>();
      for (const ch of s) {
        counts.set(ch, (counts.get(ch) ?? 0) + 1);
      }
      for (let i = 0; i < s.length; i += 1) {
        if (counts.get(s[i] as string) === 1) {
          return i;
        }
      }
      return -1;
    },
    variants: 15,
    buildCases: (_variant, rng) => Array.from({ length: 7 }, () => [randString(rng, rng.int(4, 9), 5)]),
  },
  {
    slugBase: 'longest-common-prefix',
    title: 'Longest Common Prefix',
    difficulty: 'EASY',
    tags: ['String'],
    functionName: 'longestCommonPrefix',
    harness: { paramTypes: ['string[]'], returnType: 'string', cpp: { signature: 'string longestCommonPrefix(vector<string>& strs)' } },
    timeLimitMinutes: 15,
    description:
      'Write a function to find the longest common prefix string amongst an array of strings. If there is no common prefix, return an empty string.',
    constraints: ['1 <= strs.length <= 200', '0 <= strs[i].length <= 200'],
    starterCode: starter(
      'function longestCommonPrefix(strs) {\n  // Write your solution here\n}\n',
      'def longestCommonPrefix(strs):\n    # Write your solution here\n    pass\n',
      '#include <bits/stdc++.h>\nusing namespace std;\n\nstring longestCommonPrefix(vector<string>& strs) {\n    // Write your solution here\n}\n',
    ),
    examples: [{ input: 'strs = ["flower","flow","flight"]', output: '"fl"', explanation: 'Common prefix is "fl".' }],
    reference: (args) => {
      const strs = args[0] as string[];
      if (strs.length === 0) {
        return '';
      }
      let prefix = strs[0] as string;
      for (const word of strs) {
        while (!word.startsWith(prefix)) {
          prefix = prefix.slice(0, -1);
          if (prefix === '') {
            return '';
          }
        }
      }
      return prefix;
    },
    variants: 14,
    buildCases: (_variant, rng) => {
      const cases: unknown[][] = [];
      for (let c = 0; c < 7; c += 1) {
        const prefix = randString(rng, rng.int(1, 3));
        const count = rng.int(2, 4);
        const words: string[] = [];
        for (let k = 0; k < count; k += 1) {
          words.push(prefix + randString(rng, rng.int(0, 3)));
        }
        if (c % 3 === 0) {
          words.push(randString(rng, rng.int(2, 4)));
        }
        cases.push([words]);
      }
      return cases;
    },
  },
  {
    slugBase: 'count-vowels',
    title: 'Count Vowels',
    difficulty: 'EASY',
    tags: ['String'],
    functionName: 'countVowels',
    harness: { paramTypes: ['string'], returnType: 'int', cpp: { signature: 'int countVowels(string s)' } },
    timeLimitMinutes: 10,
    description: 'Given a string `s` of lowercase letters, return the number of vowels (a, e, i, o, u) it contains.',
    constraints: ['1 <= s.length <= 1000', 's consists of lowercase letters.'],
    starterCode: starter(
      'function countVowels(s) {\n  // Write your solution here\n}\n',
      'def countVowels(s):\n    # Write your solution here\n    pass\n',
      '#include <bits/stdc++.h>\nusing namespace std;\n\nint countVowels(string s) {\n    // Write your solution here\n}\n',
    ),
    examples: [{ input: 's = "hello"', output: '2', explanation: 'e and o are vowels.' }],
    reference: (args) => {
      const s = args[0] as string;
      return s.split('').filter((ch) => 'aeiou'.includes(ch)).length;
    },
    variants: 14,
    buildCases: (_variant, rng) => Array.from({ length: 7 }, () => [randString(rng, rng.int(4, 10), 10)]),
  },
  {
    slugBase: 'is-subsequence',
    title: 'Is Subsequence',
    difficulty: 'EASY',
    tags: ['String', 'Two Pointers'],
    functionName: 'isSubsequence',
    harness: { paramTypes: ['string', 'string'], returnType: 'bool', cpp: { signature: 'bool isSubsequence(string s, string t)' } },
    timeLimitMinutes: 15,
    description: 'Given two strings `s` and `t`, return `true` if `s` is a subsequence of `t`.',
    constraints: ['0 <= s.length <= 200', '0 <= t.length <= 1000', 'Both consist of lowercase letters.'],
    starterCode: starter(
      'function isSubsequence(s, t) {\n  // Write your solution here\n}\n',
      'def isSubsequence(s, t):\n    # Write your solution here\n    pass\n',
      '#include <bits/stdc++.h>\nusing namespace std;\n\nbool isSubsequence(string s, string t) {\n    // Write your solution here\n}\n',
    ),
    examples: [{ input: 's = "abc", t = "ahbgdc"', output: 'true', explanation: 'a, b, c appear in order.' }],
    reference: (args) => {
      const s = args[0] as string;
      const t = args[1] as string;
      let i = 0;
      for (const ch of t) {
        if (i < s.length && s[i] === ch) {
          i += 1;
        }
      }
      return i === s.length;
    },
    variants: 14,
    buildCases: (_variant, rng) => {
      const cases: unknown[][] = [];
      for (let c = 0; c < 7; c += 1) {
        const t = randString(rng, rng.int(5, 10), 6);
        if (c % 2 === 0) {
          let sub = '';
          for (const ch of t) {
            if (rng.next() < 0.5) {
              sub += ch;
            }
          }
          cases.push([sub, t]);
        } else {
          cases.push([randString(rng, rng.int(2, 5), 6), t]);
        }
      }
      return cases;
    },
  },
];
