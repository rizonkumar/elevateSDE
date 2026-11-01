export const SUPPORTED_HARNESS_TYPES = [
  'int',
  'long',
  'double',
  'bool',
  'string',
  'int[]',
  'long[]',
  'double[]',
  'bool[]',
  'string[]',
  'int[][]',
] as const;

export type HarnessType = (typeof SUPPORTED_HARNESS_TYPES)[number];

const SUPPORTED = new Set<string>(SUPPORTED_HARNESS_TYPES);

export function isHarnessType(value: string): value is HarnessType {
  return SUPPORTED.has(value);
}

export const JAVA_TYPES: Record<HarnessType, string> = {
  int: 'int',
  long: 'long',
  double: 'double',
  bool: 'boolean',
  string: 'String',
  'int[]': 'int[]',
  'long[]': 'long[]',
  'double[]': 'double[]',
  'bool[]': 'boolean[]',
  'string[]': 'String[]',
  'int[][]': 'int[][]',
};

export const GO_TYPES: Record<HarnessType, string> = {
  int: 'int',
  long: 'int64',
  double: 'float64',
  bool: 'bool',
  string: 'string',
  'int[]': '[]int',
  'long[]': '[]int64',
  'double[]': '[]float64',
  'bool[]': '[]bool',
  'string[]': '[]string',
  'int[][]': '[][]int',
};
