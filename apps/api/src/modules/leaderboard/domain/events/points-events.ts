import { PointSource } from '@prisma/client';

export const POINTS_EVENTS = {
  AWARDED: 'points.awarded',
} as const;

export interface PointsAwardedEvent {
  userId: string;
  source: PointSource;
  refId: string;
  delta: number;
  awardedAt: Date;
}
