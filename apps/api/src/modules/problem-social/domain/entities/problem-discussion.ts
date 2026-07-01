export interface ProblemDiscussionDraft {
  title: string;
  body: string;
}

export interface ProblemDiscussionSnapshot {
  id: string;
  problemId: string;
  userId: string;
  title: string;
  body: string;
  createdAt: Date;
  updatedAt: Date;
}

export class ProblemDiscussion {
  private constructor(
    private readonly id: string,
    private readonly problemId: string,
    private readonly userId: string,
    private readonly title: string,
    private readonly body: string,
    private readonly createdAt: Date,
    private readonly updatedAt: Date,
  ) {}

  static create(
    id: string,
    problemId: string,
    userId: string,
    draft: ProblemDiscussionDraft,
  ): ProblemDiscussion {
    if (!isNonEmpty(draft.title)) {
      throw new Error('Discussion title cannot be empty');
    }
    if (!isNonEmpty(draft.body)) {
      throw new Error('Discussion body cannot be empty');
    }
    const now = new Date();
    return new ProblemDiscussion(
      id,
      problemId,
      userId,
      draft.title.trim(),
      draft.body.trim(),
      now,
      now,
    );
  }

  static reconstitute(snapshot: ProblemDiscussionSnapshot): ProblemDiscussion {
    return new ProblemDiscussion(
      snapshot.id,
      snapshot.problemId,
      snapshot.userId,
      snapshot.title,
      snapshot.body,
      snapshot.createdAt,
      snapshot.updatedAt,
    );
  }

  getId(): string {
    return this.id;
  }

  getProblemId(): string {
    return this.problemId;
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
