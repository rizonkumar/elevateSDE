import { JwtService } from '@nestjs/jwt';
import { TokenService } from './token.service';
import { AuthTokenPayload } from '../domain/auth-token';
import { FakeRefreshTokenRepository } from '../testing/fake-refresh-token.repository';
import { TEST_USER } from '../testing/auth-fixtures';

describe('TokenService', () => {
  let repository: FakeRefreshTokenRepository;
  let service: TokenService;

  beforeEach(() => {
    jest.useFakeTimers({
      now: new Date('2026-10-04T12:00:00.000Z'),
      doNotFake: ['nextTick', 'setImmediate', 'setTimeout', 'queueMicrotask'],
    });
    repository = new FakeRefreshTokenRepository();
    service = new TokenService(new JwtService({ secret: 'test-secret' }), repository);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('issues distinct refresh tokens for the same user within the same second', async () => {
    const first = await service.issueFor(TEST_USER);
    const second = await service.issueFor(TEST_USER);

    expect(first.refreshToken).not.toBe(second.refreshToken);
    expect(new Set(repository.rows.map((row) => row.token)).size).toBe(2);
  });

  it('marks access and refresh tokens with their token type', async () => {
    const jwt = new JwtService({ secret: 'test-secret' });
    const issued = await service.issueFor(TEST_USER);

    const access = await jwt.verifyAsync<AuthTokenPayload>(issued.accessToken);
    const refresh = await jwt.verifyAsync<AuthTokenPayload>(issued.refreshToken);

    expect(access).toMatchObject({ sub: 'user-1', typ: 'access' });
    expect(refresh).toMatchObject({ sub: 'user-1', typ: 'refresh' });
  });

  it('persists the refresh token with a seven day expiry', async () => {
    const issued = await service.issueFor(TEST_USER);

    expect(repository.rows[0]).toMatchObject({
      userId: 'user-1',
      token: issued.refreshToken,
      expiresAt: new Date('2026-10-11T12:00:00.000Z'),
    });
    expect(issued.user.email).toBe('candidate@example.com');
  });

  it('starts a new token family for each sign-in', async () => {
    await service.issueFor(TEST_USER);
    await service.issueFor(TEST_USER);

    const [first, second] = repository.rows;
    expect(first?.familyId).not.toBe(second?.familyId);
  });

  it('signs successor refresh tokens into an existing family without persisting them', async () => {
    const signed = await service.signRefreshToken(TEST_USER, 'family-1');

    expect(signed.record).toMatchObject({ familyId: 'family-1', token: signed.token });
    expect(repository.rows).toHaveLength(0);
  });
});
