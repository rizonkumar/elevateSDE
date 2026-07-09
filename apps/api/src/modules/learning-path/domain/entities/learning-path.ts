import { randomUUID } from 'node:crypto';
import { PathLevel } from '@prisma/client';

export interface LearningPathProps {
  id: string;
  slug: string;
  title: string;
  description: string;
  level: PathLevel;
  tags: string[];
  coverImage: string | null;
  isPublished: boolean;
  tenantId: string | null;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateLearningPathInput {
  slug: string;
  title: string;
  description: string;
  level: PathLevel;
  tags: string[];
  coverImage: string | null;
  tenantId: string | null;
}

export interface UpdateLearningPathDetailsInput {
  slug: string;
  title: string;
  description: string;
  level: PathLevel;
  tags: string[];
  coverImage: string | null;
}

export class LearningPath {
  private constructor(private readonly props: LearningPathProps) {}

  static create(input: CreateLearningPathInput): LearningPath {
    const now = new Date();
    return new LearningPath({
      id: randomUUID(),
      slug: input.slug,
      title: input.title,
      description: input.description,
      level: input.level,
      tags: input.tags,
      coverImage: input.coverImage,
      isPublished: false,
      tenantId: input.tenantId,
      order: 0,
      createdAt: now,
      updatedAt: now,
    });
  }

  static reconstitute(props: LearningPathProps): LearningPath {
    return new LearningPath(props);
  }

  withDetails(input: UpdateLearningPathDetailsInput): LearningPath {
    return new LearningPath({
      ...this.props,
      slug: input.slug,
      title: input.title,
      description: input.description,
      level: input.level,
      tags: input.tags,
      coverImage: input.coverImage,
      updatedAt: new Date(),
    });
  }

  withPublished(isPublished: boolean): LearningPath {
    return new LearningPath({ ...this.props, isPublished, updatedAt: new Date() });
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

  getLevel(): PathLevel {
    return this.props.level;
  }

  getTags(): string[] {
    return this.props.tags;
  }

  getCoverImage(): string | null {
    return this.props.coverImage;
  }

  isPathPublished(): boolean {
    return this.props.isPublished;
  }

  getTenantId(): string | null {
    return this.props.tenantId;
  }

  getOrder(): number {
    return this.props.order;
  }

  getCreatedAt(): Date {
    return this.props.createdAt;
  }

  getUpdatedAt(): Date {
    return this.props.updatedAt;
  }
}
