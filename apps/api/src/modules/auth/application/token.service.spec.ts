import { JwtService } from '@nestjs/jwt';
import { UserRole } from '@prisma/client';
import { TokenService } from './token.service';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { User } from '../../users/domain/entities/user';

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

interface RefreshTokenCreateCall {
  data: { userId: string; token: string; expiresAt: Date };
}

describe('TokenService', () => {
  let create: jest.Mock<Promise<void>, [RefreshTokenCreateCall]>;
  let service: TokenService;

  beforeEach(() => {
    jest.useFakeTimers({
      now: new Date('2026-10-04T12:00:00.000Z'),
      doNotFake: ['nextTick', 'setImmediate', 'setTimeout', 'queueMicrotask'],
    });
    create = jest.fn<Promise<void>, [RefreshTokenCreateCall]>().mockResolvedValue(undefined);
    service = new TokenService(new JwtService({ secret: 'test-secret' }), {
      refreshToken: { create },
    } as unknown as PrismaService);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('issues distinct refresh tokens for the same user within the same second', async () => {
    const first = await service.issueFor(USER);
    const second = await service.issueFor(USER);

    expect(first.refreshToken).not.toBe(second.refreshToken);
    const persisted = create.mock.calls.map(([args]) => args.data.token);
    expect(new Set(persisted).size).toBe(2);
  });

  it('persists the refresh token with a seven day expiry', async () => {
    const issued = await service.issueFor(USER);

    expect(create).toHaveBeenCalledWith({
      data: {
        userId: 'user-1',
        token: issued.refreshToken,
        expiresAt: new Date('2026-10-11T12:00:00.000Z'),
      },
    });
    expect(issued.user.email).toBe('candidate@example.com');
  });
});
