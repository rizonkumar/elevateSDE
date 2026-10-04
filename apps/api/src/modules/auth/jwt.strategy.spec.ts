import { UnauthorizedException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { JwtStrategy } from './jwt.strategy';
import { UsersService } from '../users/application/users.service';
import { User } from '../users/domain/entities/user';
import { AuthTokenPayload } from './domain/auth-token';

const USER = User.reconstitute(
  'user-1',
  'candidate@example.com',
  'hash',
  UserRole.USER,
  null,
  new Date('2026-10-01T00:00:00.000Z'),
  'Ada',
  'Lovelace',
);

describe('JwtStrategy', () => {
  let findById: jest.Mock;
  let strategy: JwtStrategy;

  beforeEach(() => {
    findById = jest.fn().mockResolvedValue(USER);
    strategy = new JwtStrategy({ findById } as unknown as UsersService);
  });

  it('accepts an access token for an existing user', async () => {
    await expect(
      strategy.validate({ sub: 'user-1', email: 'candidate@example.com', typ: 'access' }),
    ).resolves.toBe(USER);
  });

  it.each<[string, Partial<AuthTokenPayload> & Record<string, unknown>]>([
    ['a refresh token', { sub: 'user-1', email: 'candidate@example.com', typ: 'refresh' }],
    ['a token without a type', { sub: 'user-1', email: 'candidate@example.com' }],
    ['a Google onboarding token', { email: 'candidate@example.com', purpose: 'GOOGLE_ONBOARDING' }],
  ])('rejects %s without loading the user', async (_label, payload) => {
    await expect(strategy.validate(payload)).rejects.toBeInstanceOf(UnauthorizedException);
    expect(findById).not.toHaveBeenCalled();
  });

  it('rejects an access token for a deleted user', async () => {
    findById.mockResolvedValue(null);

    await expect(
      strategy.validate({ sub: 'gone', email: 'gone@example.com', typ: 'access' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
