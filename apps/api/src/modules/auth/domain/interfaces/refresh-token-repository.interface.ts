import { User } from '../../../users/domain/entities/user';

export interface NewRefreshToken {
  userId: string;
  familyId: string;
  token: string;
  expiresAt: Date;
}

export interface StoredRefreshToken {
  id: string;
  familyId: string;
  expiresAt: Date;
  rotatedAt: Date | null;
  user: User;
}

export interface RefreshTokenSuccessor {
  token: string;
  expiresAt: Date;
}

export interface RefreshTokenRotation {
  rotatedAt: Date;
  liveSuccessor: RefreshTokenSuccessor | null;
}

export abstract class IRefreshTokenRepository {
  abstract create(token: NewRefreshToken): Promise<void>;
  abstract findByToken(token: string): Promise<StoredRefreshToken | null>;
  abstract findFamilyId(token: string): Promise<string | null>;
  abstract rotate(storedId: string, successor: NewRefreshToken, rotatedAt: Date): Promise<boolean>;
  abstract findRotation(storedId: string): Promise<RefreshTokenRotation | null>;
  abstract revokeFamily(familyId: string): Promise<void>;
  abstract deleteExpired(now: Date): Promise<number>;
}
