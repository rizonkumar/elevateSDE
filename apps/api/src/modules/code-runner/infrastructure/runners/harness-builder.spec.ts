import { buildHarness } from './harness-builder';
import { RunSpec } from '../../domain/value-objects/run-spec';

function baseSpec(overrides: Partial<RunSpec> = {}): RunSpec {
  return {
    language: 'javascript',
    functionName: 'twoSum',
    harness: {
      paramTypes: ['int[]', 'int'],
      returnType: 'int[]',
      cpp: { signature: 'vector<int> twoSum(vector<int>& nums, int target)' },
    },
    userCode: 'function twoSum(nums, target) { return [0, 1]; }',
    cases: [
      { id: 'case-1', input: '[2,7,11,15], 9' },
      { id: 'case-2', input: '[3,2,4], 6' },
    ],
    timeoutMsPerCase: 2000,
    memoryLimitMb: 256,
    ...overrides,
  };
}

function fileByName(files: { name: string; content: string }[], name: string): string {
  const file = files.find((entry) => entry.name === name);
  if (!file) {
    throw new Error(`Expected file ${name}`);
  }
  return file.content;
}

describe('buildHarness', () => {
  it('builds a JavaScript harness that embeds user code and calls the function', () => {
    const { files } = buildHarness(baseSpec());
    const main = fileByName(files, 'main.js');
    expect(main).toContain('function twoSum(nums, target)');
    expect(main).toContain('twoSum(...__elevate_args)');
    expect(main).toContain('###ELEVATE_RESULT###');
  });

  it('writes a cases.json with id and input per case', () => {
    const { files } = buildHarness(baseSpec());
    const cases = JSON.parse(fileByName(files, 'cases.json'));
    expect(cases).toEqual([
      { id: 'case-1', input: '[2,7,11,15], 9' },
      { id: 'case-2', input: '[3,2,4], 6' },
    ]);
  });

  it('builds a Python harness with typing prelude and class/free resolution', () => {
    const { files } = buildHarness(baseSpec({ language: 'python', userCode: 'def twoSum(): pass' }));
    const main = fileByName(files, 'main.py');
    expect(main).toContain('from typing import *');
    expect(main).toContain('def twoSum(): pass');
    expect(main).toContain("getattr(Solution(), 'twoSum')");
    expect(main).toContain("globals()['twoSum']");
  });

  it('builds a C++ harness with typed argument extraction and invocation', () => {
    const { files } = buildHarness(baseSpec({ language: 'cpp' }));
    const main = fileByName(files, 'main.cpp');
    expect(main).toContain('struct JV');
    expect(main).toContain('static string __elevate_invoke(JV& __args)');
    expect(main).toContain('__toVecInt(__args.a[0])');
    expect(main).toContain('__toInt(__args.a[1])');
    expect(main).toContain('twoSum(__p0, __p1)');
  });

  it('throws for unsupported C++ parameter types', () => {
    expect(() =>
      buildHarness(
        baseSpec({
          language: 'cpp',
          harness: { paramTypes: ['linkedlist'], returnType: 'int', cpp: { signature: '' } },
        }),
      ),
    ).toThrow('Unsupported C++ parameter type: linkedlist');
  });
});
