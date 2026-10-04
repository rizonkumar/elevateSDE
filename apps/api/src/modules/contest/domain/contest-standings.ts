import { AcceptedSubmissionView, ContestProblemView } from './read-models/contest-view';

export interface ParticipantTotals {
  solvedCount: number;
  score: number;
  penaltySeconds: number;
}

export interface RankedParticipant<T extends { userId: string }> {
  participant: T;
  rank: number;
  totals: ParticipantTotals;
}

export interface StandingsInput<T extends { userId: string }> {
  problems: Pick<ContestProblemView, 'problemId' | 'points'>[];
  startsAt: Date;
  participants: T[];
  accepted: AcceptedSubmissionView[];
}

const EMPTY_TOTALS: ParticipantTotals = { solvedCount: 0, score: 0, penaltySeconds: 0 };
const MS_PER_SECOND = 1000;

export function rankContestParticipants<T extends { userId: string }>(
  input: StandingsInput<T>,
): RankedParticipant<T>[] {
  const totals = aggregateTotals(input);
  const totalsFor = (userId: string): ParticipantTotals => totals.get(userId) ?? EMPTY_TOTALS;
  return [...input.participants]
    .sort((left, right) =>
      compareStanding(left.userId, totalsFor(left.userId), right.userId, totalsFor(right.userId)),
    )
    .map((participant, index) => ({
      participant,
      rank: index + 1,
      totals: totalsFor(participant.userId),
    }));
}

function aggregateTotals<T extends { userId: string }>(
  input: StandingsInput<T>,
): Map<string, ParticipantTotals> {
  const pointsByProblem = new Map(
    input.problems.map((problem) => [problem.problemId, problem.points]),
  );
  const totals = new Map<string, ParticipantTotals>();
  for (const submission of input.accepted) {
    const current = totals.get(submission.userId) ?? { ...EMPTY_TOTALS };
    current.solvedCount += 1;
    current.score += pointsByProblem.get(submission.problemId) ?? 0;
    current.penaltySeconds += Math.max(
      0,
      Math.floor(
        (submission.firstAcceptedAt.getTime() - input.startsAt.getTime()) / MS_PER_SECOND,
      ),
    );
    totals.set(submission.userId, current);
  }
  return totals;
}

function compareStanding(
  leftUserId: string,
  left: ParticipantTotals,
  rightUserId: string,
  right: ParticipantTotals,
): number {
  if (right.score !== left.score) {
    return right.score - left.score;
  }
  if (left.penaltySeconds !== right.penaltySeconds) {
    return left.penaltySeconds - right.penaltySeconds;
  }
  return leftUserId.localeCompare(rightUserId);
}
