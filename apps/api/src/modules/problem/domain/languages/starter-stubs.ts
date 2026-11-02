import { GO_TYPES, HarnessType, JAVA_TYPES, isHarnessType } from './harness-types';

export interface StubHarness {
  paramTypes: string[];
  returnType: string;
  cpp?: { signature: string };
}

export interface TypedSignature {
  functionName: string;
  params: { name: string; type: HarnessType }[];
  returnType: HarnessType;
}

const IDENTIFIER = /^[A-Za-z_][A-Za-z0-9_]*$/;
const RESERVED = new Set([
  'abstract',
  'boolean',
  'break',
  'case',
  'catch',
  'chan',
  'class',
  'const',
  'continue',
  'default',
  'defer',
  'do',
  'double',
  'else',
  'func',
  'go',
  'goto',
  'if',
  'import',
  'int',
  'interface',
  'long',
  'map',
  'new',
  'package',
  'range',
  'return',
  'select',
  'static',
  'string',
  'struct',
  'switch',
  'type',
  'var',
]);

function splitTopLevel(text: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let current = '';
  for (const char of text) {
    if (char === '<') depth += 1;
    if (char === '>') depth -= 1;
    if (char === ',' && depth === 0) {
      parts.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  if (current.trim().length > 0) {
    parts.push(current);
  }
  return parts;
}

export function parseParamNames(cppSignature: string | undefined, count: number): string[] {
  const fallback = Array.from({ length: count }, (_, index) => `arg${index}`);
  if (!cppSignature) {
    return fallback;
  }
  const open = cppSignature.indexOf('(');
  const close = cppSignature.lastIndexOf(')');
  if (open < 0 || close <= open) {
    return fallback;
  }
  const params = splitTopLevel(cppSignature.slice(open + 1, close));
  if (params.length !== count) {
    return fallback;
  }
  const used = new Set<string>();
  return params.map((param, index) => {
    const candidate =
      param
        .trim()
        .split(/[\s&*]+/)
        .at(-1) ?? '';
    const valid = IDENTIFIER.test(candidate) && !RESERVED.has(candidate) && !used.has(candidate);
    const name = valid ? candidate : `arg${index}`;
    used.add(name);
    return name;
  });
}

export function toTypedSignature(
  functionName: string,
  harness: StubHarness,
): TypedSignature | null {
  if (!IDENTIFIER.test(functionName)) {
    return null;
  }
  if (!isHarnessType(harness.returnType)) {
    return null;
  }
  const returnType = harness.returnType;
  const types: HarnessType[] = [];
  for (const type of harness.paramTypes) {
    if (!isHarnessType(type)) {
      return null;
    }
    types.push(type);
  }
  const names = parseParamNames(harness.cpp?.signature, types.length);
  return {
    functionName,
    returnType,
    params: types.map((type, index) => ({ name: names[index] ?? `arg${index}`, type })),
  };
}

export function javaStub(signature: TypedSignature): string {
  const params = signature.params
    .map((param) => `${JAVA_TYPES[param.type]} ${param.name}`)
    .join(', ');
  return [
    'class Solution {',
    `    public ${JAVA_TYPES[signature.returnType]} ${signature.functionName}(${params}) {`,
    '        ',
    '    }',
    '}',
  ].join('\n');
}

export function goStub(signature: TypedSignature): string {
  const params = signature.params
    .map((param) => `${param.name} ${GO_TYPES[param.type]}`)
    .join(', ');
  return [
    `func ${signature.functionName}(${params}) ${GO_TYPES[signature.returnType]} {`,
    '    ',
    '}',
  ].join('\n');
}
