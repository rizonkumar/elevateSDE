import { EditorialUnlockReason } from '@prisma/client';

export interface ProblemAssistanceSnapshot {
  userId: string;
  problemId: string;
  hintsRevealed: number;
  editorialUnlockedAt: Date | null;
  editorialUnlockReason: EditorialUnlockReason | null;
}

export class ProblemAssistance {
  private constructor(private readonly snapshot: ProblemAssistanceSnapshot) {}

  static reconstitute(snapshot: ProblemAssistanceSnapshot): ProblemAssistance {
    return new ProblemAssistance(snapshot);
  }

  static untouched(userId: string, problemId: string): ProblemAssistance {
    return new ProblemAssistance({
      userId,
      problemId,
      hintsRevealed: 0,
      editorialUnlockedAt: null,
      editorialUnlockReason: null,
    });
  }

  getUserId(): string {
    return this.snapshot.userId;
  }

  getProblemId(): string {
    return this.snapshot.problemId;
  }

  getHintsRevealed(): number {
    return this.snapshot.hintsRevealed;
  }

  getEditorialUnlockedAt(): Date | null {
    return this.snapshot.editorialUnlockedAt;
  }

  getEditorialUnlockReason(): EditorialUnlockReason | null {
    return this.snapshot.editorialUnlockReason;
  }

  isEditorialUnlocked(): boolean {
    return this.snapshot.editorialUnlockedAt !== null;
  }

  gaveUp(): boolean {
    return this.snapshot.editorialUnlockReason === EditorialUnlockReason.GAVE_UP;
  }

  hasHintLeft(totalHints: number): boolean {
    return this.snapshot.hintsRevealed < totalHints;
  }

  visibleHintCount(totalHints: number): number {
    return Math.min(this.snapshot.hintsRevealed, totalHints);
  }
}
