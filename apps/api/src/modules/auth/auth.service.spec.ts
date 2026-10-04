import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { TokenService } from './application/token.service';
import { UsersService } from '../users/application/users.service';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { FakeRefreshTokenRepository } from './testing/fake-refresh-token.repository';
import { TEST_USER } from './testing/auth-fixtures';
import { REFRESH_REUSE_GRACE_MS } from './domain/refresh-token-rotation';

const START = new Date('2026-10-04T12:00:00.000Z');

describe('AuthService refresh tokens', () => {
  let repository: FakeRefreshTokenRepository;
  let tokens: TokenService;
  let service: AuthService;

  const advance = (ms: number) => jest.setSystemTime(new Date(Date.now() + ms));
  const familyOf = (token: string) =>
    repository.rows.find((row) => row.token === token)?.familyId ?? '';

  beforeEach(() => {
    jest.useFakeTimers({
      now: START,
      doNotFake: ['nextTick', 'setImmediate', 'setTimeout', 'queueMicrotask'],
    });
    repository = new FakeRefreshTokenRepository();
    tokens = new TokenService(new JwtService({ secret: 'test-secret' }), repository);
    service = new AuthService({} as UsersService, tokens, {} as PrismaService, repository);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('rotates a refresh token within the same family', async () => {
    const session = await tokens.issueFor(TEST_USER);

    const rotated = await service.refresh(session.refreshToken);

    expect(rotated.refreshToken).not.toBe(session.refreshToken);
    expect(familyOf(rotated.refreshToken)).toBe(familyOf(session.refreshToken));
  });

  it('lets concurrent refreshes from different tabs both succeed', async () => {
    const session = await tokens.issueFor(TEST_USER);

    const outcomes = await Promise.all([
      service.refresh(session.refreshToken),
      service.refresh(session.refreshToken),
    ]);

    expect(outcomes.map((outcome) => outcome.accessToken)).toHaveLength(2);
    expect(new Set(outcomes.map((outcome) => outcome.refreshToken)).size).toBe(2);
  });

  it('accepts reuse of a rotated token within the grace window', async () => {
    const session = await tokens.issueFor(TEST_USER);
    await service.refresh(session.refreshToken);
    advance(REFRESH_REUSE_GRACE_MS);

    await expect(service.refresh(session.refreshToken)).resolves.toHaveProperty('accessToken');
  });

  it('treats reuse after the grace window as theft and revokes the whole family', async () => {
    const session = await tokens.issueFor(TEST_USER);
    const family = familyOf(session.refreshToken);
    const rotated = await service.refresh(session.refreshToken);
    advance(REFRESH_REUSE_GRACE_MS + 1);

    await expect(service.refresh(session.refreshToken)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    await expect(service.refresh(rotated.refreshToken)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(repository.tokensInFamily(family)).toEqual([]);
  });

  it('leaves other sign-ins untouched when one family is revoked', async () => {
    const stolen = await tokens.issueFor(TEST_USER);
    const otherDevice = await tokens.issueFor(TEST_USER);
    await service.refresh(stolen.refreshToken);
    advance(REFRESH_REUSE_GRACE_MS + 1);

    await expect(service.refresh(stolen.refreshToken)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    await expect(service.refresh(otherDevice.refreshToken)).resolves.toHaveProperty('accessToken');
  });

  it('rejects expired and unknown refresh tokens', async () => {
    const session = await tokens.issueFor(TEST_USER);
    advance(8 * 24 * 60 * 60 * 1000);

    await expect(service.refresh(session.refreshToken)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    await expect(service.refresh('unknown')).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('revokes the whole family on logout, including rotated tokens, idempotently', async () => {
    const session = await tokens.issueFor(TEST_USER);
    const rotated = await service.refresh(session.refreshToken);

    await Promise.all([service.logout(rotated.refreshToken), service.logout(rotated.refreshToken)]);

    await expect(service.refresh(session.refreshToken)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    await expect(service.refresh(rotated.refreshToken)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('prunes expired refresh tokens', async () => {
    await tokens.issueFor(TEST_USER);
    advance(8 * 24 * 60 * 60 * 1000);
    await tokens.issueFor(TEST_USER);

    await expect(service.pruneExpiredRefreshTokens()).resolves.toBe(1);
    expect(repository.rows).toHaveLength(1);
  });
});
