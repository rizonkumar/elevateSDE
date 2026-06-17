import { Injectable, NotFoundException } from '@nestjs/common';
import { IUsersRepository } from '../domain/interfaces/users-repository.interface';
import { User } from '../domain/entities/user';
import { UserRole } from '@prisma/client';
import { randomUUID } from 'crypto';

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

  async create(data: {
    email: string;
    passwordHash: string;
    role: UserRole;
    tenantId?: string;
    firstName?: string;
    lastName?: string;
  }): Promise<User> {
    const id = randomUUID();
    const user = User.create(
      id,
      data.email,
      data.passwordHash,
      data.role,
      data.tenantId || null,
      data.firstName ?? null,
      data.lastName ?? null,
    );
    return this.usersRepository.save(user);
  }

  async updateRole(id: string, role: UserRole): Promise<User> {
    const user = await this.findById(id);
    const updatedUser = user.changeRole(role);
    return this.usersRepository.save(updatedUser);
  }

  async findAll(): Promise<User[]> {
    return this.usersRepository.findAll();
  }
}
