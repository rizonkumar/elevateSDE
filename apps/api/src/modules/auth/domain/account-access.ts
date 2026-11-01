import { ForbiddenException } from '@nestjs/common';
import { AccountStatus } from '@prisma/client';
import { User } from '../../users/domain/entities/user';

export const ACCOUNT_ACCESS_ERRORS = {
  PENDING: 'ACCOUNT_PENDING_APPROVAL',
  REJECTED: 'ACCOUNT_REJECTED',
} as const;

export function assertAccountCanSignIn(user: User): void {
  const status = user.getStatus();
  if (status === AccountStatus.PENDING_APPROVAL) {
    throw new ForbiddenException({
      statusCode: 403,
      code: ACCOUNT_ACCESS_ERRORS.PENDING,
      message: 'Your account is awaiting approval. You will be able to sign in once an admin approves it.',
    });
  }
  if (status === AccountStatus.REJECTED) {
    throw new ForbiddenException({
      statusCode: 403,
      code: ACCOUNT_ACCESS_ERRORS.REJECTED,
      message: 'Your registration was not approved.',
    });
  }
}
