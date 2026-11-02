import { analyzeCode, estimateSpaceComplexity, estimateTimeComplexity } from './static-analysis';

describe('static analysis', () => {
  it('measures nested loops in brace languages', () => {
    const metrics = analyzeCode(
      'function twoSum(nums, t) { for (let i = 0; i < n; i++) { for (let j = i; j < n; j++) { if (x) { } } } }',
      'javascript',
      'twoSum',
    );

    expect(metrics.maxLoopDepth).toBe(2);
    expect(estimateTimeComplexity(metrics)).toBe('O(n^2)');
  });

  it('measures nested loops in Python by indentation', () => {
    const metrics = analyzeCode(
      [
        'def twoSum(nums, target):',
        '    for i in range(len(nums)):',
        '        if nums[i]:',
        '            for j in range(i):',
        '                pass',
        '    for k in nums:',
        '        pass',
      ].join('\n'),
      'python',
      'twoSum',
    );

    expect(metrics.maxLoopDepth).toBe(2);
  });

  it('ignores loop keywords inside comments', () => {
    const metrics = analyzeCode(
      'int f(int n) { // for while\n /* for { for { } } */ return n; }',
      'cpp',
      'f',
    );

    expect(metrics.maxLoopDepth).toBe(0);
    expect(estimateTimeComplexity(metrics)).toBe('O(1)');
  });

  it('detects sorting, allocation, recursion and debug output', () => {
    const metrics = analyzeCode(
      'func solve(nums []int) int {\n  seen := map[int]bool{}\n  sort.Ints(nums)\n  fmt.Println(nums)\n  return solve(nums[1:])\n}',
      'go',
      'solve',
    );

    expect(metrics.usesSort).toBe(true);
    expect(metrics.allocatesCollections).toBe(true);
    expect(metrics.isRecursive).toBe(true);
    expect(metrics.debugOutputLines).toEqual([4]);
    expect(estimateTimeComplexity(metrics)).toBe('O(n log n)');
    expect(estimateSpaceComplexity(metrics)).toBe('O(n)');
  });

  it('lists unclear single-letter names but allows loop indices', () => {
    const metrics = analyzeCode(
      'let a = 1; let b = 2; let i = 0; const z = a + b;',
      'javascript',
      'f',
    );

    expect(metrics.shortNames).toEqual(['a', 'b', 'z']);
  });
});
