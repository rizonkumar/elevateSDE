import { DockerSandboxRunner } from './docker-sandbox.runner';
import { WorkdirManager } from './workdir.manager';
import { RunSpec } from '../../domain/value-objects/run-spec';

const gatedDescribe = process.env.RUN_SANDBOX_INTEGRATION ? describe : describe.skip;

const HARNESS = {
  paramTypes: ['int[]', 'int'],
  returnType: 'int[]',
  cpp: { signature: 'vector<int> twoSum(vector<int>& nums, int target)' },
};

function spec(overrides: Partial<RunSpec>): RunSpec {
  return {
    language: 'javascript',
    functionName: 'twoSum',
    harness: HARNESS,
    userCode: '',
    cases: [{ id: 'c1', input: '[2,7,11,15], 9' }],
    timeoutMsPerCase: 2000,
    memoryLimitMb: 256,
    ...overrides,
  };
}

gatedDescribe('DockerSandboxRunner (integration)', () => {
  const runner = new DockerSandboxRunner(new WorkdirManager());

  it('accepts a correct JavaScript solution', async () => {
    const output = await runner.run(
      spec({ userCode: 'function twoSum(nums, target){ return [0,1]; }' }),
    );
    expect(output.compileError).toBeNull();
    expect(output.caseResults[0]?.status).toBe('ok');
    expect(output.caseResults[0]?.output).toBe('[0,1]');
  }, 30000);

  it('accepts a correct Python solution', async () => {
    const output = await runner.run(
      spec({
        language: 'python',
        userCode: 'class Solution:\n    def twoSum(self, nums, target):\n        return [0, 1]\n',
      }),
    );
    expect(output.caseResults[0]?.output).toBe('[0,1]');
  }, 30000);

  it('enforces the wall-clock timeout on an infinite loop', async () => {
    const output = await runner.run(
      spec({ userCode: 'function twoSum(nums, target){ while(true){} }' }),
    );
    expect(output.timedOut).toBe(true);
  }, 30000);

  it('blocks network access', async () => {
    const output = await runner.run(
      spec({
        userCode:
          'function twoSum(nums, target){ require("child_process").execSync("wget -q -T 3 -O- http://example.com"); return []; }',
      }),
    );
    expect(output.caseResults[0]?.status).toBe('error');
  }, 30000);

  it('runs user code as an unprivileged user', async () => {
    const output = await runner.run(
      spec({ userCode: 'function twoSum(nums, target){ return [process.getuid()]; }' }),
    );
    expect(output.caseResults[0]?.output).toBe('[65534]');
  }, 30000);

  it('cannot write outside the scratch tmpfs', async () => {
    const output = await runner.run(
      spec({
        userCode:
          'function twoSum(nums, target){ require("fs").writeFileSync("/sandbox/x", "1"); return []; }',
      }),
    );
    expect(output.caseResults[0]?.status).toBe('error');
  }, 30000);

  it('compiles and runs a correct C++ solution as the unprivileged user', async () => {
    const output = await runner.run(
      spec({
        language: 'cpp',
        userCode:
          'vector<int> twoSum(vector<int>& nums, int target) { for (int i = 0; i < (int)nums.size(); i++) for (int j = i + 1; j < (int)nums.size(); j++) if (nums[i] + nums[j] == target) return {i, j}; return {}; }',
      }),
    );
    expect(output.compileError).toBeNull();
    expect(output.caseResults[0]?.status).toBe('ok');
    expect(output.caseResults[0]?.output).toBe('[0,1]');
  }, 90000);

  it('reports a C++ compile error', async () => {
    const output = await runner.run(
      spec({ language: 'cpp', userCode: 'vector<int> twoSum(vector<int>& nums, int target) {' }),
    );
    expect(output.compileError).not.toBeNull();
  }, 60000);

  it('compiles and runs a correct Java solution', async () => {
    const output = await runner.run(
      spec({
        language: 'java',
        userCode: [
          'import java.util.HashMap;',
          'public class Solution {',
          '  public int[] twoSum(int[] nums, int target) {',
          '    HashMap<Integer, Integer> seen = new HashMap<>();',
          '    for (int i = 0; i < nums.length; i++) {',
          '      Integer j = seen.get(target - nums[i]);',
          '      if (j != null) return new int[] { j, i };',
          '      seen.put(nums[i], i);',
          '    }',
          '    return new int[0];',
          '  }',
          '}',
        ].join('\n'),
      }),
    );
    expect(output.compileError).toBeNull();
    expect(output.caseResults[0]?.status).toBe('ok');
    expect(output.caseResults[0]?.output).toBe('[0,1]');
    expect(output.caseResults[0]?.peakMemoryKb).toBeGreaterThan(0);
  }, 120000);

  it('decodes every supported Java type and serialises the result', async () => {
    const output = await runner.run(
      spec({
        language: 'java',
        functionName: 'describe',
        harness: {
          paramTypes: [
            'long',
            'double',
            'bool',
            'string',
            'string[]',
            'int[][]',
            'bool[]',
            'double[]',
          ],
          returnType: 'string[]',
        },
        userCode: [
          'class Solution {',
          '  String[] describe(long a, double b, boolean c, String d, String[] e, int[][] f, boolean[] g, double[] h) {',
          '    return new String[] { a + "", b + "", c + "", d, e.length + "", f[1][0] + "", g[1] + "", h[0] + "" };',
          '  }',
          '}',
        ].join('\n'),
        cases: [
          {
            id: 'c1',
            input: '9000000000, 2.5, true, "q\\"x", ["a","b"], [[1],[2,3]], [false,true], [0.5]',
          },
        ],
      }),
    );
    expect(output.compileError).toBeNull();
    expect(JSON.parse(output.caseResults[0]?.output ?? 'null')).toEqual([
      '9000000000',
      '2.5',
      'true',
      'q"x',
      '2',
      '2',
      'true',
      '0.5',
    ]);
  }, 120000);

  it('reports a Java exception as a case error without stopping later cases', async () => {
    const output = await runner.run(
      spec({
        language: 'java',
        userCode:
          'class Solution { int[] twoSum(int[] nums, int target) { if (target == 9) throw new IllegalStateException("boom"); return new int[] {1, 2}; } }',
        cases: [
          { id: 'c1', input: '[2,7,11,15], 9' },
          { id: 'c2', input: '[3,2,4], 6' },
        ],
      }),
    );
    expect(output.caseResults[0]?.status).toBe('error');
    expect(output.caseResults[0]?.error).toContain('boom');
    expect(output.caseResults[1]?.output).toBe('[1,2]');
  }, 120000);

  it('reports a Java compile error', async () => {
    const output = await runner.run(
      spec({
        language: 'java',
        userCode: 'class Solution { int[] twoSum(int[] nums, int target) { } }',
      }),
    );
    expect(output.compileError).toContain('missing return');
  }, 120000);

  it('compiles and runs a correct Go solution', async () => {
    const output = await runner.run(
      spec({
        language: 'go',
        userCode: [
          'package main',
          '',
          'import "sort"',
          '',
          'func twoSum(nums []int, target int) []int {',
          '\tseen := map[int]int{}',
          '\tfor i, n := range nums {',
          '\t\tif j, ok := seen[target-n]; ok {',
          '\t\t\tresult := []int{j, i}',
          '\t\t\tsort.Ints(result)',
          '\t\t\treturn result',
          '\t\t}',
          '\t\tseen[n] = i',
          '\t}',
          '\treturn nil',
          '}',
        ].join('\n'),
        cases: [
          { id: 'c1', input: '[2,7,11,15], 9' },
          { id: 'c2', input: '[1,2], 100' },
        ],
      }),
    );
    expect(output.compileError).toBeNull();
    expect(output.caseResults[0]?.output).toBe('[0,1]');
    expect(output.caseResults[1]?.output).toBe('[]');
  }, 120000);

  it('decodes every supported Go type', async () => {
    const output = await runner.run(
      spec({
        language: 'go',
        functionName: 'describe',
        harness: {
          paramTypes: ['long', 'double', 'bool', 'string', 'string[]', 'int[][]', 'bool[]'],
          returnType: 'string[]',
        },
        userCode: [
          'import "fmt"',
          '',
          'func describe(a int64, b float64, c bool, d string, e []string, f [][]int, g []bool) []string {',
          '\treturn []string{fmt.Sprint(a), fmt.Sprint(b), fmt.Sprint(c), d, fmt.Sprint(len(e)), fmt.Sprint(f[1][0]), fmt.Sprint(g[1])}',
          '}',
        ].join('\n'),
        cases: [
          {
            id: 'c1',
            input: '9000000000, 2.5, true, "q\\"x", ["a","b"], [[1],[2,3]], [false,true]',
          },
        ],
      }),
    );
    expect(output.compileError).toBeNull();
    expect(JSON.parse(output.caseResults[0]?.output ?? 'null')).toEqual([
      '9000000000',
      '2.5',
      'true',
      'q"x',
      '2',
      '2',
      'true',
    ]);
  }, 120000);

  it('turns a Go panic into a case error', async () => {
    const output = await runner.run(
      spec({
        language: 'go',
        userCode: 'func twoSum(nums []int, target int) []int { return []int{nums[99]} }',
      }),
    );
    expect(output.caseResults[0]?.status).toBe('error');
    expect(output.caseResults[0]?.error).toContain('panic');
  }, 120000);

  it('reports a Go compile error', async () => {
    const output = await runner.run(
      spec({ language: 'go', userCode: 'func twoSum(nums []int, target int) []int {' }),
    );
    expect(output.compileError).not.toBeNull();
  }, 120000);
});
