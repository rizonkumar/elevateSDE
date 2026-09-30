import type {
  PreparationResourceType,
  PreparationTaskStatus,
  PreparationTaskType,
} from '@elevatesde/shared-types';

export interface PreparationTaskProps {
  id: string;
  planId: string;
  roundId: string | null;
  type: PreparationTaskType;
  title: string;
  description: string | null;
  status: PreparationTaskStatus;
  dueAt: Date | null;
  completedAt: Date | null;
  resourceType: PreparationResourceType | null;
  resourceId: string | null;
  deepLink: string | null;
  ordinal: number;
  version: number;
}

export class PreparationTask {
  private constructor(private readonly props: PreparationTaskProps) {}

  static create(props: PreparationTaskProps): PreparationTask {
    if (props.title.trim().length === 0) throw new RangeError('Task title is required');
    if (!Number.isInteger(props.ordinal) || props.ordinal < 0) {
      throw new RangeError('Task ordinal must be a non-negative integer');
    }
    if (props.deepLink !== null && !props.deepLink.startsWith('/dashboard/')) {
      throw new RangeError('Task links must target a dashboard route');
    }
    return new PreparationTask(props);
  }

  static reconstitute(props: PreparationTaskProps): PreparationTask {
    return new PreparationTask(props);
  }

  getProps(): PreparationTaskProps {
    return { ...this.props };
  }
}
