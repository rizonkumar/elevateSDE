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

export function canonicalize(value: Json): Json {
  if (Array.isArray(value)) {
    return value.map((item) => canonicalize(item));
  }
  if (value !== null && typeof value === 'object') {
    const result: { [key: string]: Json } = {};
    for (const key of Object.keys(value).sort()) {
      result[key] = canonicalize(value[key] as Json);
    }
    return result;
  }
  if (typeof value === 'number') {
    return normalizeNumber(value);
  }
  return value;
}

function valuesEqual(expected: Json, actual: Json, mode: ComparisonMode): boolean {
  if (typeof expected === 'number' && typeof actual === 'number') {
    if (mode === ComparisonMode.FLOAT_TOLERANT) {
      const scale = Math.max(1, Math.abs(expected), Math.abs(actual));
      return Math.abs(expected - actual) <= FLOAT_EPSILON * scale;
    }
    return expected === actual;
  }

  if (Array.isArray(expected) && Array.isArray(actual)) {
    if (expected.length !== actual.length) {
      return false;
    }
    if (mode === ComparisonMode.UNORDERED) {
      const remaining = [...actual];
      for (const expectedItem of expected) {
        const index = remaining.findIndex((actualItem) =>
          valuesEqual(expectedItem, actualItem, mode),
        );
        if (index === -1) {
          return false;
        }
        remaining.splice(index, 1);
      }
      return true;
    }
    return expected.every((item, index) => valuesEqual(item, actual[index] as Json, mode));
  }

  if (
    expected !== null &&
    actual !== null &&
    typeof expected === 'object' &&
    typeof actual === 'object' &&
    !Array.isArray(expected) &&
    !Array.isArray(actual)
  ) {
    const expectedKeys = Object.keys(expected);
    const actualKeys = Object.keys(actual);
    if (expectedKeys.length !== actualKeys.length) {
      return false;
    }
    return expectedKeys.every((key) =>
      valuesEqual(expected[key] as Json, actual[key] as Json, mode),
    );
  }

  return expected === actual;
}

export function outputsMatch(expected: string, actual: string, mode: ComparisonMode): boolean {
  const parsedExpected = parseJson(expected.trim());
  const parsedActual = parseJson(actual.trim());
  if (!parsedExpected.ok || !parsedActual.ok) {
    return expected.trim() === actual.trim();
  }
  return valuesEqual(
    canonicalize(parsedExpected.value),
    canonicalize(parsedActual.value),
    mode,
  );
}
