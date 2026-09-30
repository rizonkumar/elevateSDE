import type {
  InterviewPreparationArchetype,
  InterviewPreparationPlanStatus,
  InterviewRoundType,
} from '@elevatesde/shared-types';

export interface InterviewPreparationPlanProps {
  id: string;
  userId: string;
  jobApplicationId: string;
  targetAt: Date;
  timeZone: string;
  archetype: InterviewPreparationArchetype;
  status: InterviewPreparationPlanStatus;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface PreparationRoundDraft {
  type: InterviewRoundType;
  title: string;
  weight: number;
  ordinal: number;
}

export class InterviewPreparationPlan {
  private constructor(private readonly props: InterviewPreparationPlanProps) {}

  static create(props: InterviewPreparationPlanProps): InterviewPreparationPlan {
    InterviewPreparationPlan.assertTarget(props.targetAt);
    InterviewPreparationPlan.assertTimeZone(props.timeZone);
    return new InterviewPreparationPlan(props);
  }

  static reconstitute(props: InterviewPreparationPlanProps): InterviewPreparationPlan {
    return new InterviewPreparationPlan(props);
  }

  static validateRounds(rounds: PreparationRoundDraft[]): void {
    if (rounds.length === 0) throw new RangeError('At least one interview round is required');
    const ordinals = new Set<number>();
    for (const round of rounds) {
      if (round.title.trim().length === 0) throw new RangeError('Round title is required');
      if (!Number.isFinite(round.weight) || round.weight <= 0) {
        throw new RangeError('Round weight must be greater than zero');
      }
      if (!Number.isInteger(round.ordinal) || round.ordinal < 0 || ordinals.has(round.ordinal)) {
        throw new RangeError('Round ordinals must be unique non-negative integers');
      }
      ordinals.add(round.ordinal);
    }
  }

  private static assertTarget(targetAt: Date): void {
    if (!Number.isFinite(targetAt.getTime())) throw new RangeError('Target date is invalid');
  }

  private static assertTimeZone(timeZone: string): void {
    try {
      new Intl.DateTimeFormat('en-US', { timeZone }).format();
    } catch {
      throw new RangeError('Time zone must be a valid IANA identifier');
    }
  }

  getProps(): InterviewPreparationPlanProps {
    return { ...this.props };
  }
}
