export interface AwardOutcome {
  firstSolve: boolean;
  pointsAwarded: number;
}

export interface PointsBackfillResult {
  usersTouched: number;
  awardsInserted: number;
  pointsAwarded: number;
  dryRun: boolean;
}
