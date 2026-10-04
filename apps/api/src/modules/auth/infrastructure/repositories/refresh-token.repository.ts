import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { UserMapper } from '../../../users/infrastructure/mappers/user.mapper';
import {
  IRefreshTokenRepository,
  NewRefreshToken,
  RefreshTokenRotation,
  RefreshTokenSuccessor,
  StoredRefreshToken,
} from '../../domain/interfaces/refresh-token-repository.interface';

const FAMILY_LOCK_PREFIX = 'auth.refresh-family:';
const MAX_SUCCESSOR_HOPS = 5;

@Injectable()
export class RefreshTokenRepository implements IRefreshTokenRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(token: NewRefreshToken): Promise<void> {
    await this.prisma.refreshToken.create({ data: token });
  }

  async findByToken(token: string): Promise<StoredRefreshToken | null> {
    const record = await this.prisma.refreshToken.findUnique({
      where: { token },
      include: { user: true },
    });
    if (!record) {
      return null;
    }
    return {
      id: record.id,
      familyId: record.familyId,
      expiresAt: record.expiresAt,
      rotatedAt: record.rotatedAt,
      user: UserMapper.toDomain(record.user),
    };
  }

  async findFamilyId(token: string): Promise<string | null> {
    const record = await this.prisma.refreshToken.findUnique({
      where: { token },
      select: { familyId: true },
    });
    return record?.familyId ?? null;
  }

  async rotate(storedId: string, successor: NewRefreshToken, rotatedAt: Date): Promise<boolean> {
    return this.prisma.$transaction(async (transaction) => {
      await lockRefreshFamily(transaction, successor.familyId);
      const successorId = randomUUID();
      const claimed = await transaction.refreshToken.updateMany({
        where: { id: storedId, familyId: successor.familyId, rotatedAt: null },
        data: { rotatedAt, replacedById: successorId },
      });
      if (claimed.count === 0) {
        return false;
      }
      await transaction.refreshToken.create({ data: { ...successor, id: successorId } });
      return true;
    });
  }

  async findRotation(storedId: string): Promise<RefreshTokenRotation | null> {
    const rotated = await this.prisma.refreshToken.findUnique({
      where: { id: storedId },
      select: { rotatedAt: true, replacedById: true },
    });
    if (!rotated?.rotatedAt) {
      return null;
    }
    return {
      rotatedAt: rotated.rotatedAt,
      liveSuccessor: await this.findLiveSuccessor(rotated.replacedById),
    };
  }

  async revokeFamily(familyId: string): Promise<void> {
    await this.prisma.$transaction(async (transaction) => {
      await lockRefreshFamily(transaction, familyId);
      await transaction.refreshToken.deleteMany({ where: { familyId } });
    });
  }

  async deleteExpired(now: Date): Promise<number> {
    const { count } = await this.prisma.refreshToken.deleteMany({
      where: { expiresAt: { lte: now } },
    });
    return count;
  }

  private async findLiveSuccessor(firstId: string | null): Promise<RefreshTokenSuccessor | null> {
    let nextId = firstId;
    for (let hop = 0; nextId !== null && hop < MAX_SUCCESSOR_HOPS; hop += 1) {
      const candidate = await this.prisma.refreshToken.findUnique({
        where: { id: nextId },
        select: { token: true, expiresAt: true, rotatedAt: true, replacedById: true },
      });
      if (!candidate) {
        return null;
      }
      if (candidate.rotatedAt === null) {
        return { token: candidate.token, expiresAt: candidate.expiresAt };
      }
      nextId = candidate.replacedById;
    }
    return null;
  }
}

export async function lockRefreshFamily(
  transaction: Prisma.TransactionClient,
  familyId: string,
): Promise<void> {
  await transaction.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${FAMILY_LOCK_PREFIX + familyId}))`;
}
