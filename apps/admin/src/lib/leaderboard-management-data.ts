import type { LeaderboardEntryDto } from '@elevatesde/shared-types';
import { api } from './api';

export const BADGE_KEYS: string[] = [
  'Top Mentor',
  'System Design',
  'DSA Streak',
  'Helpful',
  'Resume Pro',
  'Rising Star',
  'Fast Learner',
  'Consistent',
];

export async function getStandings(): Promise<LeaderboardEntryDto[]> {
  const { data } = await api.get<LeaderboardEntryDto[]>('/api/v1/admin/leaderboard');
  return data;
}

export async function adjustStanding(
  userId: string,
  points: number,
  badges: string[],
): Promise<LeaderboardEntryDto[]> {
  const { data } = await api.patch<LeaderboardEntryDto[]>(`/api/v1/admin/leaderboard/${userId}`, {
    points,
    badges,
  });
  return data;
}
