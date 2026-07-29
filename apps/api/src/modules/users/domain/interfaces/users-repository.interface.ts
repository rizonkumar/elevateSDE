import { User } from '../entities/user';

export abstract class IUsersRepository {
  abstract findById(id: string): Promise<User | null>;
  abstract findByEmail(email: string): Promise<User | null>;
  abstract findByHandle(handle: string): Promise<User | null>;
  abstract existsByHandle(handle: string, excludeUserId?: string): Promise<boolean>;
  abstract save(user: User): Promise<User>;
  abstract findAll(): Promise<User[]>;
}
