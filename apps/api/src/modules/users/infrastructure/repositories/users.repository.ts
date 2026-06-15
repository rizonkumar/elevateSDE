import { Injectable } from '@nestjs/common';
import { IUsersRepository } from '../../domain/interfaces/users-repository.interface';
import { User } from '../../domain/entities/user.entity';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { UserRole } from '@prisma/client';

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
    return new User(user.id, user.tenantId, user.email, user.role, user.createdAt.toISOString());
  }

  async findByEmail(email: string): Promise<(User & { passwordHash: string }) | null> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });
    if (!user) {
      return null;
    }
    return {
      id: user.id,
      tenantId: user.tenantId,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt.toISOString(),
      passwordHash: user.passwordHash,
    };
  }

  async create(data: { email: string; passwordHash: string; role: UserRole; tenantId?: string }): Promise<User> {
    const user = await this.prisma.user.create({
      data: {
        email: data.email,
        passwordHash: data.passwordHash,
        role: data.role,
        tenantId: data.tenantId,
      },
    });
    return new User(user.id, user.tenantId, user.email, user.role, user.createdAt.toISOString());
  }

  async updateRole(id: string, role: UserRole): Promise<User> {
    const user = await this.prisma.user.update({
      where: { id },
      data: { role },
    });
    return new User(user.id, user.tenantId, user.email, user.role, user.createdAt.toISOString());
  }
}
