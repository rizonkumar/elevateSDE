import { AccountStatus, UserRole } from '@prisma/client';
import { User } from '../../users/domain/entities/user';

export const TEST_USER = User.reconstitute(
  'user-1',
  'candidate@example.com',
  'hash',
  UserRole.USER,
  null,
  new Date('2026-10-01T00:00:00.000Z'),
  'Ada',
  'Lovelace',
);

export function userWithStatus(status: AccountStatus, passwordHash = 'hash'): User {
  return User.reconstitute(
    `user-${status.toLowerCase()}`,
    `${status.toLowerCase()}@example.com`,
    passwordHash,
    UserRole.USER,
    null,
    new Date('2026-10-01T00:00:00.000Z'),
    'Ada',
    'Lovelace',
    null,
    null,
    status,
  );
}
