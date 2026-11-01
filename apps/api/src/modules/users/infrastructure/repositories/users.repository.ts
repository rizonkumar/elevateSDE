import { Injectable } from '@nestjs/common';
import { IUsersRepository } from '../../domain/interfaces/users-repository.interface';
import { User } from '../../domain/entities/user';
import { UserMapper } from '../mappers/user.mapper';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { AccountStatus, UserRole } from '@prisma/client';
import {
  AccountReviewDecision,
  PendingAccountPage,
} from '../../domain/read-models/pending-account';

@Injectable()
export class UsersRepository implements IUsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });
    if (!user) {
      return null;
    }
    return UserMapper.toDomain(user);
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });
    if (!user) {
      return null;
    }
    return UserMapper.toDomain(user);
  }

  async findByGoogleId(googleId: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { googleId },
    });
    if (!user) {
      return null;
    }
    return UserMapper.toDomain(user);
  }

  async save(user: User): Promise<User> {
    const data = UserMapper.toPersistence(user);
    const prismaUser = await this.prisma.user.upsert({
      where: { id: user.getId() },
      update: {
        email: data.email,
        passwordHash: data.passwordHash,
        googleId: data.googleId,
        role: data.role,
        tenantId: data.tenantId,
        firstName: data.firstName,
        lastName: data.lastName,
      },
      create: {
        status: data.status,
        id: data.id,
        email: data.email,
        passwordHash: data.passwordHash,
        googleId: data.googleId,
        role: data.role,
        tenantId: data.tenantId,
        firstName: data.firstName,
        lastName: data.lastName,
      },
    });
    return UserMapper.toDomain(prismaUser);
  }

  async findAll(): Promise<User[]> {
    const users = await this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return users.map((user) => UserMapper.toDomain(user));
  }

  async findPendingAccounts(skip: number, take: number): Promise<PendingAccountPage> {
    const where = { status: AccountStatus.PENDING_APPROVAL };
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        orderBy: { createdAt: 'asc' },
        skip,
        take,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          googleId: true,
          createdAt: true,
          tenant: { select: { name: true } },
        },
      }),
      this.prisma.user.count({ where }),
    ]);
    return {
      total,
      items: rows.map((row) => ({
        id: row.id,
        email: row.email,
        firstName: row.firstName,
        lastName: row.lastName,
        role: row.role,
        companyName: row.tenant?.name ?? null,
        signedUpWithGoogle: row.googleId !== null,
        createdAt: row.createdAt,
      })),
    };
  }

  async countPendingAccounts(): Promise<number> {
    return this.prisma.user.count({ where: { status: AccountStatus.PENDING_APPROVAL } });
  }

  async findActiveAdminIds(): Promise<string[]> {
    const admins = await this.prisma.user.findMany({
      where: { role: UserRole.ADMIN, status: AccountStatus.ACTIVE },
      select: { id: true },
    });
    return admins.map((admin) => admin.id);
  }

  async reviewPendingAccount(
    userId: string,
    decision: AccountReviewDecision,
  ): Promise<User | null> {
    const result = await this.prisma.user.updateMany({
      where: { id: userId, status: AccountStatus.PENDING_APPROVAL },
      data: {
        status: decision.kind === 'APPROVE' ? AccountStatus.ACTIVE : AccountStatus.REJECTED,
        reviewedAt: decision.reviewedAt,
        reviewedById: decision.reviewerId,
        rejectionReason: decision.kind === 'REJECT' ? decision.reason : null,
      },
    });
    if (result.count === 0) {
      return null;
    }
    return this.findById(userId);
  }
}
