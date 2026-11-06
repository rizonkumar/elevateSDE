import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { isOwnerAdminEmail } from '../../../infrastructure/config/security-config';
import { IUsersRepository } from '../domain/interfaces/users-repository.interface';
import { User } from '../domain/entities/user';
import { UserRole } from '@prisma/client';
import { randomUUID } from 'node:crypto';

export interface RoleChange {
  previousRole: UserRole;
  user: User;
}

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: IUsersRepository) {}

  async findById(id: string): Promise<User> {
    const user = await this.usersRepository.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findByEmail(email);
  }

  async findByGoogleId(googleId: string): Promise<User | null> {
    return this.usersRepository.findByGoogleId(googleId);
  }

  async create(data: {
    email: string;
    passwordHash?: string;
    googleId?: string;
    role: UserRole;
    tenantId?: string;
    firstName?: string;
    lastName?: string;
  }): Promise<User> {
    const id = randomUUID();
    const user = User.create({
      id,
      email: data.email,
      passwordHash: data.passwordHash ?? null,
      role: data.role,
      tenantId: data.tenantId || null,
      firstName: data.firstName ?? null,
      lastName: data.lastName ?? null,
      googleId: data.googleId ?? null,
    });
    return this.usersRepository.save(user);
  }

  async updateRole(actorId: string, targetId: string, role: UserRole): Promise<RoleChange> {
    if (actorId === targetId) {
      throw new ForbiddenException('You cannot change your own role');
    }
    const user = await this.findById(targetId);
    if (isOwnerAdminEmail(user.getEmail())) {
      throw new ForbiddenException('The owner admin role cannot be changed');
    }
    const updated = await this.usersRepository.save(user.changeRole(role));
    return { previousRole: user.getRole(), user: updated };
  }

  async replacePasswordHash(user: User, passwordHash: string): Promise<User> {
    return this.usersRepository.save(user.withPasswordHash(passwordHash));
  }

  async linkGoogleAccount(id: string, googleId: string): Promise<User> {
    const user = await this.findById(id);
    const updatedUser = user.linkGoogleId(googleId);
    return this.usersRepository.save(updatedUser);
  }

  async findAll(): Promise<User[]> {
    return this.usersRepository.findAll();
  }
}
