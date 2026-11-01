import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AccountStatus, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { TokenService } from './application/token.service';
import { UsersService } from '../users/application/users.service';
import { AccountReviewService } from '../users/application/account-review.service';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { FakeRefreshTokenRepository } from './testing/fake-refresh-token.repository';
import { TEST_USER, userWithStatus } from './testing/auth-fixtures';
import { RegisterDto } from './dtos/register.dto';
import { User } from '../users/domain/entities/user';

interface UsersServiceDouble {
  findByEmail: jest.Mock<Promise<User | null>, [string]>;
  create: jest.Mock;
}

describe('AuthService registration and login', () => {
  let users: UsersServiceDouble;
  let announcePending: jest.Mock;
  let tenantCreate: jest.Mock;
  let repository: FakeRefreshTokenRepository;
  let service: AuthService;

  beforeEach(() => {
    users = {
      findByEmail: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockImplementation(async (data: { email: string; role: UserRole }) =>
        User.create('new-user', data.email, 'hash', data.role),
      ),
    };
    announcePending = jest.fn().mockResolvedValue(undefined);
    tenantCreate = jest.fn().mockResolvedValue({ id: 'tenant-1' });
    repository = new FakeRefreshTokenRepository();
    service = new AuthService(
      users as unknown as UsersService,
      new TokenService(new JwtService({ secret: 'test-secret' }), repository),
      { tenant: { create: tenantCreate } } as unknown as PrismaService,
      repository,
      { announcePending } as unknown as AccountReviewService,
    );
  });

  const register = (overrides: Partial<RegisterDto> & Record<string, unknown> = {}) =>
    service.register({ email: 'new@example.com', password: 'longpassword1', ...overrides });

  it('creates new accounts as pending and issues no tokens', async () => {
    const result = await register();

    expect(result).toEqual({ status: 'PENDING_APPROVAL', email: 'new@example.com' });
    expect(result).not.toHaveProperty('accessToken');
    expect(repository.rows).toHaveLength(0);
    expect(announcePending).toHaveBeenCalledTimes(1);
  });

  it('ignores a self-assigned ADMIN role', async () => {
    await register({ role: UserRole.ADMIN });

    expect(users.create).toHaveBeenCalledWith(expect.objectContaining({ role: UserRole.USER }));
  });

  it('makes company sign-ups tenant admins', async () => {
    await register({ companyName: 'Acme' });

    expect(users.create).toHaveBeenCalledWith(
      expect.objectContaining({ role: UserRole.TENANT_ADMIN, tenantId: 'tenant-1' }),
    );
  });

  it('returns the same response for an already registered email without creating anything', async () => {
    users.findByEmail.mockResolvedValue(TEST_USER);

    await expect(register()).resolves.toEqual({
      status: 'PENDING_APPROVAL',
      email: 'new@example.com',
    });
    expect(users.create).not.toHaveBeenCalled();
    expect(tenantCreate).not.toHaveBeenCalled();
  });

  describe('login', () => {
    let hash: string;

    beforeAll(async () => {
      hash = await bcrypt.hash('correct-password', 4);
    });

    it('issues tokens for an active account', async () => {
      users.findByEmail.mockResolvedValue(userWithStatus(AccountStatus.ACTIVE, hash));

      const result = await service.login({ email: 'a@example.com', password: 'correct-password' });

      expect(result.accessToken).toBeTruthy();
    });

    it.each([AccountStatus.PENDING_APPROVAL, AccountStatus.REJECTED])(
      'refuses a %s account with the right password',
      async (status) => {
        users.findByEmail.mockResolvedValue(userWithStatus(status, hash));

        await expect(
          service.login({ email: 'a@example.com', password: 'correct-password' }),
        ).rejects.toBeInstanceOf(ForbiddenException);
        expect(repository.rows).toHaveLength(0);
      },
    );

    it('does not reveal account status to a wrong password', async () => {
      users.findByEmail.mockResolvedValue(userWithStatus(AccountStatus.PENDING_APPROVAL, hash));

      await expect(
        service.login({ email: 'a@example.com', password: 'wrong-password' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('uses the same error for an unknown email', async () => {
      await expect(
        service.login({ email: 'nobody@example.com', password: 'whatever-pass' }),
      ).rejects.toThrow('Invalid credentials');
    });
  });

  it('refuses to refresh a session for an account that is no longer active', async () => {
    const tokens = new TokenService(new JwtService({ secret: 'test-secret' }), repository);
    const rejected = userWithStatus(AccountStatus.REJECTED);
    repository.storedUser = rejected;
    const session = await tokens.issueFor(rejected);

    await expect(service.refresh(session.refreshToken)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});
