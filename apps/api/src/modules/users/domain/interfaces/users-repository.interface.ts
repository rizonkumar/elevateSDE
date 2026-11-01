import { User } from '../entities/user';
import { AccountReviewDecision, PendingAccountPage } from '../read-models/pending-account';

export abstract class IUsersRepository {
  abstract findById(id: string): Promise<User | null>;
  abstract findByEmail(email: string): Promise<User | null>;
  abstract findByGoogleId(googleId: string): Promise<User | null>;
  abstract save(user: User): Promise<User>;
  abstract findAll(): Promise<User[]>;
  abstract findPendingAccounts(skip: number, take: number): Promise<PendingAccountPage>;
  abstract countPendingAccounts(): Promise<number>;
  abstract findActiveAdminIds(): Promise<string[]>;
  abstract reviewPendingAccount(userId: string, decision: AccountReviewDecision): Promise<User | null>;
}
