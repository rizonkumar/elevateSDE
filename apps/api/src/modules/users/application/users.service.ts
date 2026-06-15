import { Injectable, NotFoundException } from '@nestjs/common';
import { IUsersRepository } from '../domain/interfaces/users-repository.interface';
import { User } from '../domain/entities/user.entity';
import { UserRole } from '@prisma/client';

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

  async findByEmail(email: string): Promise<(User & { passwordHash: string }) | null> {
    return this.usersRepository.findByEmail(email);
  }

  async create(data: { email: string; passwordHash: string; role: UserRole; tenantId?: string }): Promise<User> {
    return this.usersRepository.create(data);
  }

  async updateRole(id: string, role: UserRole): Promise<User> {
    await this.findById(id);
    return this.usersRepository.updateRole(id, role);
  }
}
