export interface ProblemListSnapshot {
  id: string;
  userId: string;
  name: string;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class ProblemList {
  private constructor(
    private readonly id: string,
    private readonly userId: string,
    private readonly name: string,
    private readonly isPublic: boolean,
    private readonly createdAt: Date,
    private readonly updatedAt: Date,
  ) {}

  static create(id: string, userId: string, name: string, isPublic: boolean): ProblemList {
    if (!isNonEmpty(name)) {
      throw new Error('List name cannot be empty');
    }
    const now = new Date();
    return new ProblemList(id, userId, name.trim(), isPublic, now, now);
  }

  static reconstitute(snapshot: ProblemListSnapshot): ProblemList {
    return new ProblemList(
      snapshot.id,
      snapshot.userId,
      snapshot.name,
      snapshot.isPublic,
      snapshot.createdAt,
      snapshot.updatedAt,
    );
  }

  rename(name: string): ProblemList {
    if (!isNonEmpty(name)) {
      throw new Error('List name cannot be empty');
    }
    return new ProblemList(
      this.id,
      this.userId,
      name.trim(),
      this.isPublic,
      this.createdAt,
      new Date(),
    );
  }

  setVisibility(isPublic: boolean): ProblemList {
    return new ProblemList(this.id, this.userId, this.name, isPublic, this.createdAt, new Date());
  }

  getId(): string {
    return this.id;
  }

  getUserId(): string {
    return this.userId;
  }

  getName(): string {
    return this.name;
  }

  getIsPublic(): boolean {
    return this.isPublic;
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
