import { randomUUID } from 'node:crypto';
import { ContestStatus } from '@prisma/client';

export interface ContestProps {
  id: string;
  slug: string;
  title: string;
  description: string;
  startsAt: Date;
  endsAt: Date;
  status: ContestStatus;
  tenantId: string | null;
  isRated: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateContestInput {
  slug: string;
  title: string;
  description: string;
  startsAt: Date;
  endsAt: Date;
  tenantId: string | null;
  isRated: boolean;
}

export interface UpdateContestDetailsInput {
  slug: string;
  title: string;
  description: string;
  startsAt: Date;
  endsAt: Date;
  isRated: boolean;
}

export class Contest {
  private constructor(private readonly props: ContestProps) {}

  static create(input: CreateContestInput): Contest {
    const now = new Date();
    return new Contest({
      id: randomUUID(),
      slug: input.slug,
      title: input.title,
      description: input.description,
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      status: ContestStatus.DRAFT,
      tenantId: input.tenantId,
      isRated: input.isRated,
      createdAt: now,
      updatedAt: now,
    });
  }

  static reconstitute(props: ContestProps): Contest {
    return new Contest(props);
  }

  withDetails(input: UpdateContestDetailsInput): Contest {
    return new Contest({
      ...this.props,
      slug: input.slug,
      title: input.title,
      description: input.description,
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      isRated: input.isRated,
      updatedAt: new Date(),
    });
  }

  withStatus(status: ContestStatus): Contest {
    return new Contest({ ...this.props, status, updatedAt: new Date() });
  }

  getId(): string {
    return this.props.id;
  }

  getSlug(): string {
    return this.props.slug;
  }

  getTitle(): string {
    return this.props.title;
  }

  getDescription(): string {
    return this.props.description;
  }

  getStartsAt(): Date {
    return this.props.startsAt;
  }

  getEndsAt(): Date {
    return this.props.endsAt;
  }

  getStatus(): ContestStatus {
    return this.props.status;
  }

  getTenantId(): string | null {
    return this.props.tenantId;
  }

  isRated(): boolean {
    return this.props.isRated;
  }

  hasEnded(now: Date): boolean {
    return now >= this.props.endsAt;
  }

  getCreatedAt(): Date {
    return this.props.createdAt;
  }

  getUpdatedAt(): Date {
    return this.props.updatedAt;
  }
}
