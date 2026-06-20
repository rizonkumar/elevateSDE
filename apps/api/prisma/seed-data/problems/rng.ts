import { Rng } from './types';

function hashSeed(seed: string): number {
  let hash = 2166136261;
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function makeRng(seed: string): Rng {
  let state = hashSeed(seed) || 1;
  const next = (): number => {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const int = (min: number, max: number): number => min + Math.floor(next() * (max - min + 1));
  const array = (length: number, min: number, max: number): number[] =>
    Array.from({ length }, () => int(min, max));
  const distinct = (length: number, min: number, max: number): number[] => {
    const values = new Set<number>();
    let guard = 0;
    while (values.size < length && guard < length * 50) {
      values.add(int(min, max));
      guard += 1;
    }
    return [...values];
  };
  const pick = <T>(items: readonly T[]): T => {
    const value = items[int(0, items.length - 1)];
    if (value === undefined) {
      throw new Error('Cannot pick from an empty list');
    }
    return value;
  };
  return { next, int, array, distinct, pick };
}
