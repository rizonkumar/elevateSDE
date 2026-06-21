import { ComparisonMode } from '@prisma/client';

type Json = null | boolean | number | string | Json[] | { [key: string]: Json };

const FLOAT_EPSILON = 1e-6;

function parseJson(text: string): { ok: boolean; value: Json } {
  try {
    return { ok: true, value: JSON.parse(text) as Json };
  } catch {
    return { ok: false, value: text };
  }
}

function normalizeNumber(value: number): number {
  return value === 0 ? 0 : value;
}

function isJsonObject(value: Json): value is { [key: string]: Json } {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function canonicalize(value: Json): Json {
  if (Array.isArray(value)) {
    return value.map((item) => canonicalize(item));
  }
  if (isJsonObject(value)) {
    const result: { [key: string]: Json } = {};
    const entries = Object.entries(value).sort((left, right) => left[0].localeCompare(right[0]));
    for (const [key, entry] of entries) {
      result[key] = canonicalize(entry);
    }
    return result;
  }
  if (typeof value === 'number') {
    return normalizeNumber(value);
  }
  return value;
}

function numbersEqual(expected: number, actual: number, mode: ComparisonMode): boolean {
  if (mode === ComparisonMode.FLOAT_TOLERANT) {
    const scale = Math.max(1, Math.abs(expected), Math.abs(actual));
    return Math.abs(expected - actual) <= FLOAT_EPSILON * scale;
  }
  return expected === actual;
}

function unorderedEqual(expected: Json[], actual: Json[], mode: ComparisonMode): boolean {
  const remaining = [...actual];
  for (const expectedItem of expected) {
    const index = remaining.findIndex((actualItem) => valuesEqual(expectedItem, actualItem, mode));
    if (index === -1) {
      return false;
    }
    remaining.splice(index, 1);
  }
  return true;
}

function arraysEqual(expected: Json[], actual: Json[], mode: ComparisonMode): boolean {
  if (expected.length !== actual.length) {
    return false;
  }
  if (mode === ComparisonMode.UNORDERED) {
    return unorderedEqual(expected, actual, mode);
  }
  for (let index = 0; index < expected.length; index += 1) {
    const left = expected[index];
    const right = actual[index];
    if (left === undefined || right === undefined || !valuesEqual(left, right, mode)) {
      return false;
    }
  }
  return true;
}

function objectsEqual(
  expected: { [key: string]: Json },
  actual: { [key: string]: Json },
  mode: ComparisonMode,
): boolean {
  const expectedKeys = Object.keys(expected);
  if (expectedKeys.length !== Object.keys(actual).length) {
    return false;
  }
  for (const key of expectedKeys) {
    const left = expected[key];
    const right = actual[key];
    if (left === undefined || right === undefined || !valuesEqual(left, right, mode)) {
      return false;
    }
  }
  return true;
}

function valuesEqual(expected: Json, actual: Json, mode: ComparisonMode): boolean {
  if (typeof expected === 'number' && typeof actual === 'number') {
    return numbersEqual(expected, actual, mode);
  }
  if (Array.isArray(expected) && Array.isArray(actual)) {
    return arraysEqual(expected, actual, mode);
  }
  if (isJsonObject(expected) && isJsonObject(actual)) {
    return objectsEqual(expected, actual, mode);
  }
  return expected === actual;
}

export function outputsMatch(expected: string, actual: string, mode: ComparisonMode): boolean {
  const parsedExpected = parseJson(expected.trim());
  const parsedActual = parseJson(actual.trim());
  if (!parsedExpected.ok || !parsedActual.ok) {
    return expected.trim() === actual.trim();
  }
  return valuesEqual(canonicalize(parsedExpected.value), canonicalize(parsedActual.value), mode);
}
