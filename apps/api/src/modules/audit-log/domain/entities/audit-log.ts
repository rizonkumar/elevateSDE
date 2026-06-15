export class AuditLog {
  private constructor(
    private readonly id: string,
    private readonly userId: string | null,
    private readonly action: string,
    private readonly metadata: Record<string, unknown> | null,
    private readonly createdAt: Date,
  ) {}

  static create(
    id: string,
    userId: string | null,
    action: string,
    metadata: Record<string, unknown> | null = null,
  ): AuditLog {
    if (!action) {
      throw new Error('Action cannot be empty');
    }
    return new AuditLog(id, userId, action, metadata, new Date());
  }

  static reconstitute(
    id: string,
    userId: string | null,
    action: string,
    metadata: Record<string, unknown> | null,
    createdAt: Date,
  ): AuditLog {
    return new AuditLog(id, userId, action, metadata, createdAt);
  }

  getId(): string {
    return this.id;
  }

  getUserId(): string | null {
    return this.userId;
  }

  getAction(): string {
    return this.action;
  }

  getMetadata(): Record<string, unknown> | null {
    return this.metadata;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }
}
