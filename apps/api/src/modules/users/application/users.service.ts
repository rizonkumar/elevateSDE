import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { IUsersRepository } from '../domain/interfaces/users-repository.interface';
import { ProfilePatch, User } from '../domain/entities/user';
import { isReservedHandle } from '../domain/reserved-handles';
import { UserRole } from '@prisma/client';
import { randomUUID } from 'node:crypto';

const MIN_HANDLE_LENGTH = 3;
const MAX_HANDLE_BASE_LENGTH = 28;

const toHandleBase = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, MAX_HANDLE_BASE_LENGTH)
    .replace(/-$/, '');

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
    const handle = await this.generateUniqueHandle(id, data.email, data.firstName, data.lastName);
    const user = User.create({
      id,
      email: data.email,
      passwordHash: data.passwordHash,
      role: data.role,
      handle,
      tenantId: data.tenantId || null,
      firstName: data.firstName ?? null,
      lastName: data.lastName ?? null,
    });
    return this.usersRepository.save(user);
  }

  async updateRole(id: string, role: UserRole): Promise<User> {
    const user = await this.findById(id);
    const updatedUser = user.changeRole(role);
    return this.usersRepository.save(updatedUser);
  }

  async updateProfile(id: string, patch: ProfilePatch): Promise<User> {
    const user = await this.findById(id);
    if (patch.handle !== undefined && patch.handle !== user.getHandle()) {
      await this.assertHandleAvailable(patch.handle, id);
    }
    let updated: User;
    try {
      updated = user.updateProfile(patch);
    } catch (error) {
      throw new BadRequestException(error instanceof Error ? error.message : 'Invalid profile');
    }
    return this.usersRepository.save(updated);
  }

  async isHandleAvailable(handle: string, excludeUserId?: string): Promise<boolean> {
    if (isReservedHandle(handle)) {
      return false;
    }
    return !(await this.usersRepository.existsByHandle(handle, excludeUserId));
  }

  async findAll(): Promise<User[]> {
    return this.usersRepository.findAll();
  }

  private async assertHandleAvailable(handle: string, excludeUserId: string): Promise<void> {
    if (isReservedHandle(handle)) {
      throw new ConflictException('That handle is reserved');
    }
    if (await this.usersRepository.existsByHandle(handle, excludeUserId)) {
      throw new ConflictException('That handle is already taken');
    }
  }

  private async generateUniqueHandle(
    id: string,
    email: string,
    firstName?: string,
    lastName?: string,
  ): Promise<string> {
    const fullName = [firstName, lastName].filter(Boolean).join(' ');
    const emailLocalPart = email.split('@')[0] ?? '';
    const base = this.pickHandleBase(id, toHandleBase(fullName), toHandleBase(emailLocalPart));
    let candidate = base;
    let suffix = 2;
    while (isReservedHandle(candidate) || (await this.usersRepository.existsByHandle(candidate))) {
      candidate = `${base}-${suffix}`;
      suffix += 1;
    }
    return candidate;
  }

  private pickHandleBase(id: string, fromName: string, fromEmail: string): string {
    if (fromName.length >= MIN_HANDLE_LENGTH) {
      return fromName;
    }
    if (fromEmail.length >= MIN_HANDLE_LENGTH) {
      return fromEmail;
    }
    return `member-${id.replace(/-/g, '').slice(0, 8)}`;
  }
}
