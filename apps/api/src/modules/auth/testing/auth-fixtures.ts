import { AccountStatus, UserRole } from '@prisma/client';
import { User } from '../../users/domain/entities/user';

export const TEST_USER = User.reconstitute({
  id: 'user-1',
  email: 'candidate@example.com',
  passwordHash: 'hash',
  role: UserRole.USER,
  tenantId: null,
  createdAt: new Date('2026-10-01T00:00:00.000Z'),
  firstName: 'Ada',
  lastName: 'Lovelace',
});

export function userWithStatus(status: AccountStatus, passwordHash = 'hash'): User {
  return User.reconstitute({
    id: `user-${status.toLowerCase()}`,
    email: `${status.toLowerCase()}@example.com`,
    passwordHash,
    role: UserRole.USER,
    tenantId: null,
    createdAt: new Date('2026-10-01T00:00:00.000Z'),
    firstName: 'Ada',
    lastName: 'Lovelace',
    status,
  });
}
