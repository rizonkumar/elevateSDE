import { TEST_USER } from './auth-fixtures';
import {
  IRefreshTokenRepository,
  NewRefreshToken,
  StoredRefreshToken,
} from '../domain/interfaces/refresh-token-repository.interface';

export interface FakeRefreshTokenRow extends NewRefreshToken {
  id: string;
  rotatedAt: Date | null;
}

export class FakeRefreshTokenRepository implements IRefreshTokenRepository {
  rows: FakeRefreshTokenRow[] = [];
  private sequence = 0;

  async create(token: NewRefreshToken): Promise<void> {
    this.sequence += 1;
    this.rows.push({ ...token, id: `rt-${this.sequence}`, rotatedAt: null });
  }

  async findByToken(token: string): Promise<StoredRefreshToken | null> {
    const row = this.rows.find((candidate) => candidate.token === token);
    return row
      ? {
          id: row.id,
          familyId: row.familyId,
          expiresAt: row.expiresAt,
          rotatedAt: row.rotatedAt,
          user: TEST_USER,
        }
      : null;
  }

  async claimRotation(id: string, rotatedAt: Date): Promise<boolean> {
    const row = this.rows.find((candidate) => candidate.id === id && candidate.rotatedAt === null);
    if (!row) {
      return false;
    }
    row.rotatedAt = rotatedAt;
    return true;
  }

  async findRotatedAt(id: string): Promise<Date | null> {
    return this.rows.find((candidate) => candidate.id === id)?.rotatedAt ?? null;
  }

  async revokeFamily(familyId: string): Promise<void> {
    this.rows = this.rows.filter((row) => row.familyId !== familyId);
  }

  async deleteExpired(now: Date): Promise<number> {
    const before = this.rows.length;
    this.rows = this.rows.filter((row) => row.expiresAt > now);
    return before - this.rows.length;
  }

  tokensInFamily(familyId: string): string[] {
    return this.rows.filter((row) => row.familyId === familyId).map((row) => row.token);
  }
}
