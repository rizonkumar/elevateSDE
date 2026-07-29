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

  async findByHandle(handle: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { handle },
    });
    if (!user) {
      return null;
    }
    return UserMapper.toDomain(user);
  }

  async existsByHandle(handle: string, excludeUserId?: string): Promise<boolean> {
    const match = await this.prisma.user.findUnique({
      where: { handle },
      select: { id: true },
    });
    if (!match) {
      return false;
    }
    return match.id !== excludeUserId;
  }

  async save(user: User): Promise<User> {
    const { id, ...data } = UserMapper.toPersistence(user);
    const prismaUser = await this.prisma.user.upsert({
      where: { id },
      update: data,
      create: { id, ...data },
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
