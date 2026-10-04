import { UnauthorizedException } from '@nestjs/common';
import { JwtStrategy } from './jwt.strategy';
import { UsersService } from '../users/application/users.service';
import { TEST_USER } from './testing/auth-fixtures';
import { AuthTokenPayload } from './domain/auth-token';

describe('JwtStrategy', () => {
  let findById: jest.Mock;
  let strategy: JwtStrategy;

  beforeEach(() => {
    findById = jest.fn().mockResolvedValue(TEST_USER);
    strategy = new JwtStrategy({ findById } as unknown as UsersService);
  });

  it('accepts an access token for an existing user', async () => {
    await expect(
      strategy.validate({ sub: 'user-1', email: 'candidate@example.com', typ: 'access' }),
    ).resolves.toBe(TEST_USER);
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
