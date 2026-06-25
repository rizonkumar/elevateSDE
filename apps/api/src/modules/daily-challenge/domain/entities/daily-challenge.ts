import { randomUUID } from 'node:crypto';

export interface DailyChallengeProps {
  id: string;
  challengeDate: Date;
  problemId: string;
  tenantId: string | null;
  createdAt: Date;
}

export interface ScheduleDailyChallengeInput {
  challengeDate: Date;
  problemId: string;
  tenantId: string | null;
}

export class DailyChallenge {
  private constructor(private readonly props: DailyChallengeProps) {}

  static create(input: ScheduleDailyChallengeInput): DailyChallenge {
    return new DailyChallenge({
      id: randomUUID(),
      challengeDate: input.challengeDate,
      problemId: input.problemId,
      tenantId: input.tenantId,
      createdAt: new Date(),
    });
  }

  static reconstitute(props: DailyChallengeProps): DailyChallenge {
    return new DailyChallenge(props);
  }

  getId(): string {
    return this.props.id;
  }

  getChallengeDate(): Date {
    return this.props.challengeDate;
  }

  getProblemId(): string {
    return this.props.problemId;
  }

  getTenantId(): string | null {
    return this.props.tenantId;
  }

  getCreatedAt(): Date {
    return this.props.createdAt;
  }
}
