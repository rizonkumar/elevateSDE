import { ForbiddenException } from '@nestjs/common';
import { AccountStatus, UserRole } from '@prisma/client';
import { UsersService } from './users.service';
import { IUsersRepository } from '../domain/interfaces/users-repository.interface';
import { User } from '../domain/entities/user';

function user(email: string, role: UserRole = UserRole.USER): User {
  return User.reconstitute({
    id: 'target',
    email,
    passwordHash: 'hash',
    role,
    tenantId: null,
    createdAt: new Date('2026-10-01T00:00:00.000Z'),
    firstName: null,
    lastName: null,
    status: AccountStatus.ACTIVE,
  });
}

describe('UsersService.updateRole', () => {
  const original = { ...process.env };
  let repository: jest.Mocked<Pick<IUsersRepository, 'findById' | 'save'>>;
  let service: UsersService;

  beforeEach(() => {
    process.env.SEED_ADMIN_EMAIL = 'owner@example.com';
    repository = {
      findById: jest.fn().mockResolvedValue(user('member@example.com')),
      save: jest.fn().mockImplementation(async (saved: User) => saved),
    };
    service = new UsersService(repository as unknown as IUsersRepository);
  });

  afterEach(() => {
    process.env = { ...original };
  });

  it('changes the role and reports the previous one', async () => {
    const change = await service.updateRole('admin', 'target', UserRole.TENANT_ADMIN);

    expect(change.previousRole).toBe(UserRole.USER);
    expect(change.user.getRole()).toBe(UserRole.TENANT_ADMIN);
  });

  it('refuses to let an admin change their own role', async () => {
    await expect(service.updateRole('target', 'target', UserRole.USER)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it.each(['owner@example.com', 'Owner@Example.com'])(
    'never changes the owner admin role (%s)',
    async (email) => {
      repository.findById.mockResolvedValue(user(email, UserRole.ADMIN));

      await expect(service.updateRole('admin', 'target', UserRole.USER)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
      expect(repository.save).not.toHaveBeenCalled();
    },
  );
});
