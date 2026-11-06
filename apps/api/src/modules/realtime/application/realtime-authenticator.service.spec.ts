import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../../users/application/users.service';
import { User } from '../../users/domain/entities/user';
import { RealtimeAuthenticator } from './realtime-authenticator.service';
import { RealtimeAuthError } from '../domain/realtime-identity';

const SECRET = 'realtime-test-secret-that-is-long-enough-for-hs256';

function buildUser(active: boolean): User {
  return {
    getId: () => 'user-1',
    getTenantId: () => 'tenant-1',
    isActive: () => active,
  } as unknown as User;
}

function buildAuthenticator(user: User | null): {
  authenticator: RealtimeAuthenticator;
  jwt: JwtService;
} {
  const jwt = new JwtService({ secret: SECRET });
  const findById = jest.fn(async () => {
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  });
  const usersService = { findById } as unknown as UsersService;
  return { authenticator: new RealtimeAuthenticator(jwt, usersService), jwt };
}

async function rejectionCode(promise: Promise<unknown>): Promise<string> {
  try {
    await promise;
  } catch (error) {
    if (error instanceof RealtimeAuthError) {
      return error.code;
    }
    throw error;
  }
  throw new Error('Expected the handshake to be rejected');
}

describe('RealtimeAuthenticator', () => {
  it('accepts an active user with a valid access token', async () => {
    const { authenticator, jwt } = buildAuthenticator(buildUser(true));
    const token = await jwt.signAsync({ sub: 'user-1', email: 'a@b.c', typ: 'access' }, {
      expiresIn: 900,
    });

    const identity = await authenticator.authenticate(token);

    expect(identity.userId).toBe('user-1');
    expect(identity.tenantId).toBe('tenant-1');
    expect(identity.expiresAt).toBeGreaterThan(Date.now());
  });

  it.each([undefined, '', 42])('rejects a missing token (%p)', async (token) => {
    const { authenticator } = buildAuthenticator(buildUser(true));
    await expect(rejectionCode(authenticator.authenticate(token))).resolves.toBe('unauthorized');
  });

  it('rejects a token signed with another secret', async () => {
    const { authenticator } = buildAuthenticator(buildUser(true));
    const forged = await new JwtService({ secret: `${SECRET}-other` }).signAsync({
      sub: 'user-1',
      email: 'a@b.c',
      typ: 'access',
    });
    await expect(rejectionCode(authenticator.authenticate(forged))).resolves.toBe('unauthorized');
  });

  it('rejects a refresh token', async () => {
    const { authenticator, jwt } = buildAuthenticator(buildUser(true));
    const refresh = await jwt.signAsync({ sub: 'user-1', email: 'a@b.c', typ: 'refresh' }, {
      expiresIn: 900,
    });
    await expect(rejectionCode(authenticator.authenticate(refresh))).resolves.toBe('unauthorized');
  });

  it('rejects an expired token', async () => {
    const { authenticator, jwt } = buildAuthenticator(buildUser(true));
    const expired = await jwt.signAsync({
      sub: 'user-1',
      email: 'a@b.c',
      typ: 'access',
      exp: Math.floor(Date.now() / 1000) - 60,
    });
    await expect(rejectionCode(authenticator.authenticate(expired))).resolves.toBe('unauthorized');
  });

  it('rejects inactive and missing users as forbidden', async () => {
    for (const user of [buildUser(false), null]) {
      const { authenticator, jwt } = buildAuthenticator(user);
      const token = await jwt.signAsync({ sub: 'user-1', email: 'a@b.c', typ: 'access' }, {
        expiresIn: 900,
      });
      await expect(rejectionCode(authenticator.authenticate(token))).resolves.toBe('forbidden');
    }
  });
});
