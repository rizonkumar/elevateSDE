import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { UserMapper } from '../../../users/infrastructure/mappers/user.mapper';
import {
  IRefreshTokenRepository,
  NewRefreshToken,
  StoredRefreshToken,
} from '../../domain/interfaces/refresh-token-repository.interface';

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

  async claimRotation(id: string, rotatedAt: Date): Promise<boolean> {
    const { count } = await this.prisma.refreshToken.updateMany({
      where: { id, rotatedAt: null },
      data: { rotatedAt },
    });
    return count > 0;
  }

  async findRotatedAt(id: string): Promise<Date | null> {
    const record = await this.prisma.refreshToken.findUnique({
      where: { id },
      select: { rotatedAt: true },
    });
    return record?.rotatedAt ?? null;
  }

  async revokeFamily(familyId: string): Promise<void> {
    await this.prisma.refreshToken.deleteMany({ where: { familyId } });
  }

  async deleteExpired(now: Date): Promise<number> {
    const { count } = await this.prisma.refreshToken.deleteMany({
      where: { expiresAt: { lte: now } },
    });
    return count;
  }
}
