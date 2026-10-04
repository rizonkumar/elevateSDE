import { UserRole } from '@prisma/client';
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
