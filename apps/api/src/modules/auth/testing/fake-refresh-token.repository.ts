import { TEST_USER } from './auth-fixtures';
import {
  IRefreshTokenRepository,
  NewRefreshToken,
  RefreshTokenRotation,
  RefreshTokenSuccessor,
  StoredRefreshToken,
} from '../domain/interfaces/refresh-token-repository.interface';

export interface FakeRefreshTokenRow extends NewRefreshToken {
  id: string;
  rotatedAt: Date | null;
  replacedById: string | null;
}

export class FakeRefreshTokenRepository implements IRefreshTokenRepository {
  rows: FakeRefreshTokenRow[] = [];
  private sequence = 0;

  async create(token: NewRefreshToken): Promise<void> {
    this.insert(token);
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

  async findFamilyId(token: string): Promise<string | null> {
    return this.rows.find((row) => row.token === token)?.familyId ?? null;
  }

  async rotate(storedId: string, successor: NewRefreshToken, rotatedAt: Date): Promise<boolean> {
    const row = this.byId(storedId);
    if (!row || row.rotatedAt !== null || row.familyId !== successor.familyId) {
      return false;
    }
    row.rotatedAt = rotatedAt;
    row.replacedById = this.insert(successor).id;
    return true;
  }

  async findRotation(storedId: string): Promise<RefreshTokenRotation | null> {
    const row = this.byId(storedId);
    if (!row?.rotatedAt) {
      return null;
    }
    return { rotatedAt: row.rotatedAt, liveSuccessor: this.liveSuccessor(row.replacedById) };
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

  private insert(token: NewRefreshToken): FakeRefreshTokenRow {
    this.sequence += 1;
    const row = { ...token, id: `rt-${this.sequence}`, rotatedAt: null, replacedById: null };
    this.rows.push(row);
    return row;
  }

  private byId(id: string | null): FakeRefreshTokenRow | undefined {
    return this.rows.find((row) => row.id === id);
  }

  private liveSuccessor(id: string | null): RefreshTokenSuccessor | null {
    const next = this.byId(id);
    if (!next) {
      return null;
    }
    if (next.rotatedAt === null) {
      return { token: next.token, expiresAt: next.expiresAt };
    }
    return this.liveSuccessor(next.replacedById);
  }
}
