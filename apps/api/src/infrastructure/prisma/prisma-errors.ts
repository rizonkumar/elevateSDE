import { Prisma } from '@prisma/client';

const UNIQUE_CONSTRAINT_VIOLATION = 'P2002';

export function isUniqueConstraintViolation(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === UNIQUE_CONSTRAINT_VIOLATION
  );
}
