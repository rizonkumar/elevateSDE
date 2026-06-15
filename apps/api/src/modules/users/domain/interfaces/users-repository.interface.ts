import { User } from '../entities/user.entity';
import { UserRole } from '@prisma/client';

export abstract class IUsersRepository {
  abstract findById(id: string): Promise<User | null>;
  abstract findByEmail(email: string): Promise<(User & { passwordHash: string }) | null>;
  abstract create(data: { email: string; passwordHash: string; role: UserRole; tenantId?: string }): Promise<User>;
  abstract updateRole(id: string, role: UserRole): Promise<User>;
}
