export interface LeaderboardEntryView {
  userId: string;
  firstName: string | null;
  lastName: string | null;
  headline: string | null;
  points: number;
  assessmentsCompleted: number;
  badges: string[];
  streakDays: number;
}
