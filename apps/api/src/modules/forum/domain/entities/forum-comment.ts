export class ForumComment {
  private constructor(
    private readonly id: string,
    private readonly postId: string,
    private readonly userId: string,
    private readonly body: string,
    private readonly createdAt: Date,
    private readonly updatedAt: Date,
  ) {}

  static create(id: string, postId: string, userId: string, body: string): ForumComment {
    if (!isNonEmpty(body)) {
      throw new Error('Comment body cannot be empty');
    }
    const now = new Date();
    return new ForumComment(id, postId, userId, body.trim(), now, now);
  }

  static reconstitute(
    id: string,
    postId: string,
    userId: string,
    body: string,
    createdAt: Date,
    updatedAt: Date,
  ): ForumComment {
    return new ForumComment(id, postId, userId, body, createdAt, updatedAt);
  }

  getId(): string {
    return this.id;
  }

  getPostId(): string {
    return this.postId;
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
