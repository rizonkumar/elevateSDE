import { randomUUID } from 'node:crypto';
import { PointsSource } from '@prisma/client';

export interface PointsAwardProps {
  id: string;
  userId: string;
  source: PointsSource;
  sourceRef: string;
  points: number;
  awardedAt: Date;
}

export interface FirstSolveDefinition {
  userId: string;
  problemId: string;
  points: number;
}

export class PointsAward {
  private constructor(private readonly props: PointsAwardProps) {}

  static forFirstSolve(definition: FirstSolveDefinition): PointsAward {
    if (definition.points <= 0) {
      throw new Error('Points awarded must be greater than zero');
    }
    return new PointsAward({
      id: randomUUID(),
      userId: definition.userId,
      source: PointsSource.FIRST_SOLVE,
      sourceRef: definition.problemId,
      points: definition.points,
      awardedAt: new Date(),
    });
  }

  static reconstitute(props: PointsAwardProps): PointsAward {
    return new PointsAward(props);
  }

  getId(): string {
    return this.props.id;
  }

  getUserId(): string {
    return this.props.userId;
  }

  getSource(): PointsSource {
    return this.props.source;
  }

  getSourceRef(): string {
    return this.props.sourceRef;
  }

  getPoints(): number {
    return this.props.points;
  }

  getAwardedAt(): Date {
    return this.props.awardedAt;
  }
}
