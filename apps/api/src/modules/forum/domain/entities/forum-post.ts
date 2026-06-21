import { ForumPostStatus } from '@prisma/client';

export interface ForumPostDraft {
  title: string;
  body: string;
  tags: string[];
}

export class ForumPost {
  private constructor(
    private readonly id: string,
    private readonly userId: string,
    private readonly title: string,
    private readonly body: string,
    private readonly tags: string[],
    private readonly status: ForumPostStatus,
    private readonly viewCount: number,
    private readonly createdAt: Date,
    private readonly updatedAt: Date,
  ) {}

  static create(id: string, userId: string, draft: ForumPostDraft): ForumPost {
    if (!isNonEmpty(draft.title)) {
      throw new Error('Post title cannot be empty');
    }
    if (!isNonEmpty(draft.body)) {
      throw new Error('Post body cannot be empty');
    }
    const now = new Date();
    return new ForumPost(
      id,
      userId,
      draft.title.trim(),
      draft.body.trim(),
      normalizeTags(draft.tags),
      ForumPostStatus.PUBLISHED,
      0,
      now,
      now,
    );
  }

  static reconstitute(
    id: string,
    userId: string,
    title: string,
    body: string,
    tags: string[],
    status: ForumPostStatus,
    viewCount: number,
    createdAt: Date,
    updatedAt: Date,
  ): ForumPost {
    return new ForumPost(id, userId, title, body, tags, status, viewCount, createdAt, updatedAt);
  }

  withStatus(status: ForumPostStatus): ForumPost {
    return new ForumPost(
      this.id,
      this.userId,
      this.title,
      this.body,
      this.tags,
      status,
      this.viewCount,
      this.createdAt,
      new Date(),
    );
  }

  isPublished(): boolean {
    return this.status === ForumPostStatus.PUBLISHED;
  }

  getId(): string {
    return this.id;
  }

  getUserId(): string {
    return this.userId;
  }

  getTitle(): string {
    return this.title;
  }

  getBody(): string {
    return this.body;
  }

  getTags(): string[] {
    return this.tags;
  }

  getStatus(): ForumPostStatus {
    return this.status;
  }

  getViewCount(): number {
    return this.viewCount;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getUpdatedAt(): Date {
    return this.updatedAt;
  }
}

function isNonEmpty(value: string): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

function normalizeTags(tags: string[]): string[] {
  return Array.from(new Set(tags.map((tag) => tag.trim()).filter((tag) => tag.length > 0)));
}
