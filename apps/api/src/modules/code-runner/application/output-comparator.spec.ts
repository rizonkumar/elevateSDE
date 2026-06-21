import { ComparisonMode } from '@prisma/client';
import { outputsMatch } from './output-comparator';

describe('outputsMatch', () => {
  describe('EXACT mode', () => {
    it('matches identical arrays', () => {
      expect(outputsMatch('[0,1]', '[0,1]', ComparisonMode.EXACT)).toBe(true);
    });

    it('is sensitive to array order', () => {
      expect(outputsMatch('[0,1]', '[1,0]', ComparisonMode.EXACT)).toBe(false);
    });

    it('ignores object key order', () => {
      expect(outputsMatch('{"a":1,"b":2}', '{"b":2,"a":1}', ComparisonMode.EXACT)).toBe(true);
    });

    it('normalizes equivalent numbers (1.0 vs 1)', () => {
      expect(outputsMatch('1', '1.0', ComparisonMode.EXACT)).toBe(true);
    });

    it('treats -0 and 0 as equal', () => {
      expect(outputsMatch('0', '-0', ComparisonMode.EXACT)).toBe(true);
    });

    it('matches quoted strings', () => {
      expect(outputsMatch('"abc"', '"abc"', ComparisonMode.EXACT)).toBe(true);
    });

    it('reports a mismatch for different values', () => {
      expect(outputsMatch('[0,1]', '[0,2]', ComparisonMode.EXACT)).toBe(false);
    });

    it('falls back to trimmed string comparison for non-JSON', () => {
      expect(outputsMatch('hello', '  hello  ', ComparisonMode.EXACT)).toBe(true);
      expect(outputsMatch('hello', 'world', ComparisonMode.EXACT)).toBe(false);
    });

    it('ignores surrounding whitespace', () => {
      expect(outputsMatch('[0,1]', ' [0,1] ', ComparisonMode.EXACT)).toBe(true);
    });
  });

  describe('UNORDERED mode', () => {
    it('matches arrays regardless of order', () => {
      expect(outputsMatch('[1,2,3]', '[3,1,2]', ComparisonMode.UNORDERED)).toBe(true);
    });

    it('respects multiplicity', () => {
      expect(outputsMatch('[1,1,2]', '[1,2,2]', ComparisonMode.UNORDERED)).toBe(false);
    });

    it('matches nested arrays regardless of order', () => {
      expect(outputsMatch('[[1,2],[3,4]]', '[[3,4],[1,2]]', ComparisonMode.UNORDERED)).toBe(true);
    });
  });

  describe('FLOAT_TOLERANT mode', () => {
    it('matches values within epsilon', () => {
      expect(outputsMatch('1.0', '1.0000000001', ComparisonMode.FLOAT_TOLERANT)).toBe(true);
    });

    it('rejects values outside epsilon', () => {
      expect(outputsMatch('1.0', '1.01', ComparisonMode.FLOAT_TOLERANT)).toBe(false);
    });
  });
});
