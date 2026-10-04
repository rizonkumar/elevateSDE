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

export abstract class IRefreshTokenRepository {
  abstract create(token: NewRefreshToken): Promise<void>;
  abstract findByToken(token: string): Promise<StoredRefreshToken | null>;
  abstract claimRotation(id: string, rotatedAt: Date): Promise<boolean>;
  abstract findRotatedAt(id: string): Promise<Date | null>;
  abstract revokeFamily(familyId: string): Promise<void>;
  abstract deleteExpired(now: Date): Promise<number>;
}
