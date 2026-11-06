export const INITIAL_RATING = 1500;

const RATING_SCALE = 400;
const PERFORMANCE_FLOOR = 0;
const PERFORMANCE_CEILING = 4000;
const SEARCH_ITERATIONS = 60;

export interface RatingEntry {
  userId: string;
  rank: number;
  rating: number;
}

export interface RatingChange {
  userId: string;
  rank: number;
  oldRating: number;
  newRating: number;
  delta: number;
  performance: number;
}

export function winProbability(rating: number, opponentRating: number): number {
  return 1 / (1 + Math.pow(10, (opponentRating - rating) / RATING_SCALE));
}

export function computeRatingChanges(entries: readonly RatingEntry[]): RatingChange[] {
  if (entries.length < 2) {
    return [];
  }
  const ordered = [...entries].sort(
    (left, right) => left.rank - right.rank || left.userId.localeCompare(right.userId),
  );
  const positions = sharedPositions(ordered);
  const performances = ordered.map((entry, index) => {
    const opponents = ordered.filter((_, otherIndex) => otherIndex !== index);
    const seed = expectedPosition(entry.rating, opponents);
    const position = positions[index] ?? ordered.length;
    return performanceFor(Math.sqrt(seed * position), opponents);
  });
  const rawDeltas = ordered.map(
    (entry, index) => ((performances[index] ?? entry.rating) - entry.rating) / 2,
  );
  const shift = Math.min(0, -sum(rawDeltas) / ordered.length);
  return ordered.map((entry, index) => {
    const newRating = Math.max(0, Math.round(entry.rating + (rawDeltas[index] ?? 0) + shift));
    return {
      userId: entry.userId,
      rank: entry.rank,
      oldRating: entry.rating,
      newRating,
      delta: newRating - entry.rating,
      performance: Math.round(performances[index] ?? entry.rating),
    };
  });
}

function sharedPositions(ordered: readonly RatingEntry[]): number[] {
  const positions: number[] = [];
  let start = 0;
  while (start < ordered.length) {
    const rank = ordered[start]?.rank;
    let end = start;
    while (end + 1 < ordered.length && ordered[end + 1]?.rank === rank) {
      end += 1;
    }
    const averagePosition = (start + 1 + end + 1) / 2;
    for (let index = start; index <= end; index += 1) {
      positions.push(averagePosition);
    }
    start = end + 1;
  }
  return positions;
}

function expectedPosition(rating: number, opponents: readonly RatingEntry[]): number {
  return 1 + sum(opponents.map((opponent) => winProbability(opponent.rating, rating)));
}

function performanceFor(targetPosition: number, opponents: readonly RatingEntry[]): number {
  let low = PERFORMANCE_FLOOR;
  let high = PERFORMANCE_CEILING;
  for (let iteration = 0; iteration < SEARCH_ITERATIONS; iteration += 1) {
    const middle = (low + high) / 2;
    if (expectedPosition(middle, opponents) > targetPosition) {
      low = middle;
    } else {
      high = middle;
    }
  }
  return (low + high) / 2;
}

function sum(values: readonly number[]): number {
  return values.reduce((total, value) => total + value, 0);
}
