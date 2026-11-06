import { TEST_USER } from './auth-fixtures';
import { User } from '../../users/domain/entities/user';
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
  storedUser: User = TEST_USER;
  private sequence = 0;

  create(token: NewRefreshToken): Promise<void> {
    this.insert(token);
    return Promise.resolve();
  }

  findByToken(token: string): Promise<StoredRefreshToken | null> {
    const row = this.rows.find((candidate) => candidate.token === token);
    return Promise.resolve(
      row
        ? {
            id: row.id,
            familyId: row.familyId,
            expiresAt: row.expiresAt,
            rotatedAt: row.rotatedAt,
            user: this.storedUser,
          }
        : null,
    );
  }

  findFamilyId(token: string): Promise<string | null> {
    return Promise.resolve(this.rows.find((row) => row.token === token)?.familyId ?? null);
  }

  rotate(storedId: string, successor: NewRefreshToken, rotatedAt: Date): Promise<boolean> {
    const row = this.byId(storedId);
    if (row?.rotatedAt !== null || row.familyId !== successor.familyId) {
      return Promise.resolve(false);
    }
    row.rotatedAt = rotatedAt;
    row.replacedById = this.insert(successor).id;
    return Promise.resolve(true);
  }

  findRotation(storedId: string): Promise<RefreshTokenRotation | null> {
    const row = this.byId(storedId);
    if (!row?.rotatedAt) {
      return Promise.resolve(null);
    }
    return Promise.resolve({
      rotatedAt: row.rotatedAt,
      liveSuccessor: this.liveSuccessor(row.replacedById),
    });
  }

  revokeFamily(familyId: string): Promise<void> {
    this.rows = this.rows.filter((row) => row.familyId !== familyId);
    return Promise.resolve();
  }

  deleteExpired(now: Date): Promise<number> {
    const before = this.rows.length;
    this.rows = this.rows.filter((row) => row.expiresAt > now);
    return Promise.resolve(before - this.rows.length);
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
