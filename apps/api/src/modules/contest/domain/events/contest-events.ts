export const CONTEST_EVENTS = {
  FINALIZED: 'contest.finalized',
} as const;

export interface ContestFinalizedEvent {
  contestId: string;
  endsAt: Date;
  participantIds: string[];
}
