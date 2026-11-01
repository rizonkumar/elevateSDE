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
});
