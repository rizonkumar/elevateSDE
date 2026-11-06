import * as React from 'react';
import { formatRatingDelta, ratingDeltaTone } from './rating-tier';

interface RatingDeltaProps {
  delta: number;
  className?: string;
}

export function RatingDelta({ delta, className = '' }: Readonly<RatingDeltaProps>) {
  return (
    <span className={`font-semibold tabular-nums ${ratingDeltaTone(delta)} ${className}`.trim()}>
      {formatRatingDelta(delta)}
    </span>
  );
}
