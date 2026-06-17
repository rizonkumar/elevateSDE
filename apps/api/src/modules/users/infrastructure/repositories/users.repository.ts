import { Injectable } from '@nestjs/common';
import { IUsersRepository } from '../../domain/interfaces/users-repository.interface';
import { User } from '../../domain/entities/user';
import { UserMapper } from '../mappers/user.mapper';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';

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

  async save(user: User): Promise<User> {
    const data = UserMapper.toPersistence(user);
    const prismaUser = await this.prisma.user.upsert({
      where: { id: user.getId() },
      update: {
        email: data.email,
        passwordHash: data.passwordHash,
        role: data.role,
        tenantId: data.tenantId,
        firstName: data.firstName,
        lastName: data.lastName,
      },
      create: {
        id: data.id,
        email: data.email,
        passwordHash: data.passwordHash,
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
}
