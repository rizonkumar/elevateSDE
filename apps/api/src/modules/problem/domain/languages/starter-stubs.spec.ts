import {
  StubHarness,
  TypedSignature,
  goStub,
  javaStub,
  parseParamNames,
  toTypedSignature,
} from './starter-stubs';

function typed(functionName: string, harness: StubHarness): TypedSignature {
  const signature = toTypedSignature(functionName, harness);
  if (!signature) {
    throw new Error('Expected a typed signature');
  }
  return signature;
}

const TWO_SUM = {
  paramTypes: ['int[]', 'int'],
  returnType: 'int[]',
  cpp: { signature: 'vector<int> twoSum(vector<int>& nums, int target)' },
};

describe('starter stubs', () => {
  it('takes parameter names from the C++ signature', () => {
    expect(parseParamNames(TWO_SUM.cpp.signature, 2)).toEqual(['nums', 'target']);
    expect(parseParamNames('int f(const vector<vector<int>>& grid, string* s)', 2)).toEqual([
      'grid',
      's',
    ]);
  });

  it('falls back to positional names when the signature does not line up', () => {
    expect(parseParamNames(undefined, 2)).toEqual(['arg0', 'arg1']);
    expect(parseParamNames('int f(int a)', 2)).toEqual(['arg0', 'arg1']);
    expect(parseParamNames('int f(int string, int string)', 2)).toEqual(['arg0', 'arg1']);
  });

  it('generates a Java Solution class', () => {
    const signature = typed('twoSum', TWO_SUM);
    expect(javaStub(signature)).toContain('public int[] twoSum(int[] nums, int target) {');
    expect(javaStub(signature)).toContain('class Solution {');
  });

  it('generates a Go function', () => {
    const signature = typed('twoSum', TWO_SUM);
    expect(goStub(signature)).toContain('func twoSum(nums []int, target int) []int {');
  });

  it('maps every supported type', () => {
    const signature = typed('f', {
      paramTypes: ['long', 'double', 'bool', 'string', 'string[]', 'int[][]', 'bool[]'],
      returnType: 'long[]',
    });
    expect(javaStub(signature)).toContain(
      'public long[] f(long arg0, double arg1, boolean arg2, String arg3, String[] arg4, int[][] arg5, boolean[] arg6)',
    );
    expect(goStub(signature)).toContain(
      'func f(arg0 int64, arg1 float64, arg2 bool, arg3 string, arg4 []string, arg5 [][]int, arg6 []bool) []int64 {',
    );
  });

  it('refuses harnesses it cannot type', () => {
    expect(toTypedSignature('f', { paramTypes: ['map<int,int>'], returnType: 'int' })).toBeNull();
    expect(toTypedSignature('f', { paramTypes: [], returnType: '' })).toBeNull();
    expect(toTypedSignature('not valid', TWO_SUM)).toBeNull();
  });
});
