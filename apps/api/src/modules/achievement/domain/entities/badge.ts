import { randomUUID } from 'node:crypto';
import { BadgeCriteriaType } from '@prisma/client';
import { UserMetrics } from '../read-models/achievement-view';

export interface BadgeProps {
  id: string;
  key: string;
  name: string;
  description: string;
  icon: string;
  criteriaType: BadgeCriteriaType;
  threshold: number;
  tenantId: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface BadgeDefinition {
  key: string;
  name: string;
  description: string;
  icon: string;
  criteriaType: BadgeCriteriaType;
  threshold: number;
  isActive: boolean;
}

const METRIC_BY_CRITERIA: Record<BadgeCriteriaType, keyof UserMetrics> = {
  PROBLEMS_SOLVED: 'problemsSolved',
  STREAK_DAYS: 'streakDays',
  ASSESSMENTS_COMPLETED: 'assessmentsCompleted',
  FORUM_POSTS: 'forumPosts',
  POINTS: 'points',
};

export class Badge {
  private constructor(private readonly props: BadgeProps) {}

  static create(definition: BadgeDefinition): Badge {
    const now = new Date();
    return new Badge({
      id: randomUUID(),
      key: definition.key,
      name: definition.name,
      description: definition.description,
      icon: definition.icon,
      criteriaType: definition.criteriaType,
      threshold: definition.threshold,
      tenantId: null,
      isActive: definition.isActive,
      createdAt: now,
      updatedAt: now,
    });
  }

  static reconstitute(props: BadgeProps): Badge {
    return new Badge(props);
  }

  withDefinition(definition: BadgeDefinition): Badge {
    return new Badge({
      ...this.props,
      key: definition.key,
      name: definition.name,
      description: definition.description,
      icon: definition.icon,
      criteriaType: definition.criteriaType,
      threshold: definition.threshold,
      isActive: definition.isActive,
      updatedAt: new Date(),
    });
  }

  progressFor(metrics: UserMetrics): number {
    return metrics[METRIC_BY_CRITERIA[this.props.criteriaType]];
  }

  qualifies(metrics: UserMetrics): boolean {
    return this.progressFor(metrics) >= this.props.threshold;
  }

  getId(): string {
    return this.props.id;
  }

  getKey(): string {
    return this.props.key;
  }

  getName(): string {
    return this.props.name;
  }

  getDescription(): string {
    return this.props.description;
  }

  getIcon(): string {
    return this.props.icon;
  }

  getCriteriaType(): BadgeCriteriaType {
    return this.props.criteriaType;
  }

  getThreshold(): number {
    return this.props.threshold;
  }

  getTenantId(): string | null {
    return this.props.tenantId;
  }

  isActiveBadge(): boolean {
    return this.props.isActive;
  }
}
