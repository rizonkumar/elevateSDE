import { UnauthorizedException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { AuthResponseDto } from '@elevatesde/shared-types';
import { AuthService } from './auth.service';
import { TokenService } from './application/token.service';
import { UsersService } from '../users/application/users.service';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

const NOW = new Date('2026-10-04T12:00:00.000Z');

const USER_RECORD = {
  id: 'user-1',
  tenantId: null,
  email: 'candidate@example.com',
  passwordHash: 'hash',
  googleId: null,
  firstName: 'Ada',
  lastName: 'Lovelace',
  headline: null,
  role: UserRole.USER,
  createdAt: NOW,
  updatedAt: NOW,
};

const ISSUED = { accessToken: 'access', refreshToken: 'next' } as AuthResponseDto;

interface StoredToken {
  id: string;
  token: string;
  expiresAt: Date;
}

function buildService(stored: StoredToken[]): {
  service: AuthService;
  issueFor: jest.Mock;
  remaining: () => string[];
} {
  const tokens = [...stored];
  const removeWhere = (predicate: (token: StoredToken) => boolean): number => {
    const before = tokens.length;
    for (let index = tokens.length - 1; index >= 0; index -= 1) {
      const token = tokens[index];
      if (token && predicate(token)) {
        tokens.splice(index, 1);
      }
    }
    return before - tokens.length;
  };
  const prisma = {
    refreshToken: {
      findUnique: jest.fn(async ({ where }: { where: { token: string } }) => {
        const token = tokens.find((candidate) => candidate.token === where.token);
        return token ? { ...token, user: USER_RECORD } : null;
      }),
      deleteMany: jest.fn(async ({ where }: { where: { id?: string; token?: string } }) => ({
        count: removeWhere(
          (token) =>
            (where.id === undefined || token.id === where.id) &&
            (where.token === undefined || token.token === where.token),
        ),
      })),
    },
  };
  const issueFor = jest.fn().mockResolvedValue(ISSUED);
  const service = new AuthService(
    {} as UsersService,
    { issueFor } as unknown as TokenService,
    prisma as unknown as PrismaService,
  );
  return { service, issueFor, remaining: () => tokens.map((token) => token.token) };
}

const VALID: StoredToken = {
  id: 'rt-1',
  token: 'refresh-1',
  expiresAt: new Date('2026-10-10T00:00:00.000Z'),
};

describe('AuthService', () => {
  beforeEach(() => {
    jest.useFakeTimers({
      now: NOW,
      doNotFake: ['nextTick', 'setImmediate', 'setTimeout', 'queueMicrotask'],
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('refresh', () => {
    it('rotates a valid refresh token', async () => {
      const { service, issueFor, remaining } = buildService([VALID]);

      await expect(service.refresh('refresh-1')).resolves.toBe(ISSUED);

      expect(issueFor).toHaveBeenCalledTimes(1);
      expect(remaining()).toEqual([]);
    });

    it('lets only one of two concurrent refreshes with the same token succeed', async () => {
      const { service, issueFor } = buildService([VALID]);

      const outcomes = await Promise.allSettled([
        service.refresh('refresh-1'),
        service.refresh('refresh-1'),
      ]);

      expect(outcomes.filter((outcome) => outcome.status === 'fulfilled')).toHaveLength(1);
      const rejected = outcomes.find((outcome) => outcome.status === 'rejected');
      expect(rejected?.status === 'rejected' && rejected.reason).toBeInstanceOf(
        UnauthorizedException,
      );
      expect(issueFor).toHaveBeenCalledTimes(1);
    });

    it('rejects and removes an expired refresh token', async () => {
      const { service, issueFor, remaining } = buildService([
        { ...VALID, expiresAt: new Date('2026-10-01T00:00:00.000Z') },
      ]);

      await expect(service.refresh('refresh-1')).rejects.toBeInstanceOf(UnauthorizedException);

      expect(issueFor).not.toHaveBeenCalled();
      expect(remaining()).toEqual([]);
    });

    it('rejects an unknown refresh token', async () => {
      const { service } = buildService([]);

      await expect(service.refresh('missing')).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });

  describe('logout', () => {
    it('revokes the refresh token and tolerates repeated or concurrent calls', async () => {
      const { service, remaining } = buildService([VALID]);

      await expect(
        Promise.all([service.logout('refresh-1'), service.logout('refresh-1')]),
      ).resolves.toEqual([undefined, undefined]);

      expect(remaining()).toEqual([]);
    });
  });
});
