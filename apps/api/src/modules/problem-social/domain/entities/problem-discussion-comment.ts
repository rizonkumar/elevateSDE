export class ProblemDiscussionComment {
  private constructor(
    private readonly id: string,
    private readonly discussionId: string,
    private readonly userId: string,
    private readonly body: string,
    private readonly createdAt: Date,
    private readonly updatedAt: Date,
  ) {}

  static create(
    id: string,
    discussionId: string,
    userId: string,
    body: string,
  ): ProblemDiscussionComment {
    if (!isNonEmpty(body)) {
      throw new Error('Comment body cannot be empty');
    }
    const now = new Date();
    return new ProblemDiscussionComment(id, discussionId, userId, body.trim(), now, now);
  }

  static reconstitute(
    id: string,
    discussionId: string,
    userId: string,
    body: string,
    createdAt: Date,
    updatedAt: Date,
  ): ProblemDiscussionComment {
    return new ProblemDiscussionComment(id, discussionId, userId, body, createdAt, updatedAt);
  }

  getId(): string {
    return this.id;
  }

  getDiscussionId(): string {
    return this.discussionId;
  }

  getUserId(): string {
    return this.userId;
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
