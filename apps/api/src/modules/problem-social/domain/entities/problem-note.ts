const MAX_NOTE_LENGTH = 8000;

export interface ProblemNoteSnapshot {
  id: string;
  userId: string;
  problemId: string;
  body: string;
  createdAt: Date;
  updatedAt: Date;
}

export class ProblemNote {
  private constructor(
    private readonly id: string,
    private readonly userId: string,
    private readonly problemId: string,
    private readonly body: string,
    private readonly createdAt: Date,
    private readonly updatedAt: Date,
  ) {}

  static create(id: string, userId: string, problemId: string, body: string): ProblemNote {
    const now = new Date();
    return new ProblemNote(id, userId, problemId, normalizeBody(body), now, now);
  }

  static reconstitute(snapshot: ProblemNoteSnapshot): ProblemNote {
    return new ProblemNote(
      snapshot.id,
      snapshot.userId,
      snapshot.problemId,
      snapshot.body,
      snapshot.createdAt,
      snapshot.updatedAt,
    );
  }

  withBody(body: string): ProblemNote {
    return new ProblemNote(
      this.id,
      this.userId,
      this.problemId,
      normalizeBody(body),
      this.createdAt,
      new Date(),
    );
  }

  getId(): string {
    return this.id;
  }

  getUserId(): string {
    return this.userId;
  }

  getProblemId(): string {
    return this.problemId;
  }

  getBody(): string {
    return this.body;
  }

  getUpdatedAt(): Date {
    return this.updatedAt;
  }
}

function normalizeBody(body: string): string {
  if (typeof body !== 'string') {
    throw new TypeError('Note body must be a string');
  }
  const trimmed = body.trim();
  if (trimmed.length > MAX_NOTE_LENGTH) {
    throw new Error('Note body is too long');
  }
  return trimmed;
}
