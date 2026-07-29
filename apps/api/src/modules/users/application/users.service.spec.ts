import { ConflictException } from '@nestjs/common';
import { UsersService } from './users.service';
import { IUsersRepository } from '../domain/interfaces/users-repository.interface';
import { User } from '../domain/entities/user';

class FakeUsersRepository implements IUsersRepository {
  users = new Map<string, User>();

  async findById(id: string): Promise<User | null> {
    return this.users.get(id) ?? null;
  }

  async findByEmail(email: string): Promise<User | null> {
    return [...this.users.values()].find((user) => user.getEmail() === email) ?? null;
  }

  async findByHandle(handle: string): Promise<User | null> {
    return [...this.users.values()].find((user) => user.getHandle() === handle) ?? null;
  }

  async existsByHandle(handle: string, excludeUserId?: string): Promise<boolean> {
    return [...this.users.values()].some(
      (user) => user.getHandle() === handle && user.getId() !== excludeUserId,
    );
  }

  async save(user: User): Promise<User> {
    this.users.set(user.getId(), user);
    return user;
  }

  async findAll(): Promise<User[]> {
    return [...this.users.values()];
  }
}

function buildService(): { service: UsersService; repository: FakeUsersRepository } {
  const repository = new FakeUsersRepository();
  return { service: new UsersService(repository), repository };
}

describe('UsersService.create handle generation', () => {
  it('derives a handle from the full name', async () => {
    const { service } = buildService();

    const user = await service.create({
      email: 'ada@example.com',
      passwordHash: 'hash',
      role: 'USER',
      firstName: 'Ada',
      lastName: 'Lovelace',
    });

    expect(user.getHandle()).toBe('ada-lovelace');
  });

  it('falls back to the email local part when no name is given', async () => {
    const { service } = buildService();

    const user = await service.create({
      email: 'grace.hopper@example.com',
      passwordHash: 'hash',
      role: 'USER',
    });

    expect(user.getHandle()).toBe('grace-hopper');
  });

  it('falls back to a member-id handle when neither name nor email local part is usable', async () => {
    const { service } = buildService();

    const user = await service.create({
      email: 'ab@example.com',
      passwordHash: 'hash',
      role: 'USER',
    });

    expect(user.getHandle()).toMatch(/^member-[a-f0-9]{8}$/);
  });

  it('appends an incrementing suffix on collision', async () => {
    const { service } = buildService();

    const first = await service.create({
      email: 'ada@example.com',
      passwordHash: 'hash',
      role: 'USER',
      firstName: 'Ada',
      lastName: 'Lovelace',
    });
    const second = await service.create({
      email: 'ada2@example.com',
      passwordHash: 'hash',
      role: 'USER',
      firstName: 'Ada',
      lastName: 'Lovelace',
    });

    expect(first.getHandle()).toBe('ada-lovelace');
    expect(second.getHandle()).toBe('ada-lovelace-2');
  });

  it('never generates a reserved handle', async () => {
    const { service } = buildService();

    const user = await service.create({
      email: 'admin@example.com',
      passwordHash: 'hash',
      role: 'USER',
    });

    expect(user.getHandle()).not.toBe('admin');
    expect(user.getHandle()).toBe('admin-2');
  });
});

describe('UsersService.updateProfile', () => {
  async function seedUser(service: UsersService): Promise<User> {
    return service.create({
      email: 'ada@example.com',
      passwordHash: 'hash',
      role: 'USER',
      firstName: 'Ada',
      lastName: 'Lovelace',
    });
  }

  it('updates profile fields and persists them', async () => {
    const { service } = buildService();
    const user = await seedUser(service);

    const updated = await service.updateProfile(user.getId(), {
      bio: 'Building things.',
      headline: 'Staff Engineer',
      isProfilePublic: false,
    });

    expect(updated.getBio()).toBe('Building things.');
    expect(updated.getHeadline()).toBe('Staff Engineer');
    expect(updated.isPublicProfile()).toBe(false);
  });

  it('rejects a handle already taken by another user', async () => {
    const { service } = buildService();
    const user = await seedUser(service);
    await service.create({
      email: 'grace@example.com',
      passwordHash: 'hash',
      role: 'USER',
      firstName: 'Grace',
      lastName: 'Hopper',
    });

    await expect(
      service.updateProfile(user.getId(), { handle: 'grace-hopper' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects a reserved handle', async () => {
    const { service } = buildService();
    const user = await seedUser(service);

    await expect(
      service.updateProfile(user.getId(), { handle: 'settings' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('allows a user to keep their own handle unchanged', async () => {
    const { service } = buildService();
    const user = await seedUser(service);

    const updated = await service.updateProfile(user.getId(), { handle: user.getHandle() });

    expect(updated.getHandle()).toBe(user.getHandle());
  });
});

describe('UsersService.isHandleAvailable', () => {
  it('is false for a reserved word', async () => {
    const { service } = buildService();
    await expect(service.isHandleAvailable('admin')).resolves.toBe(false);
  });

  it('is false once taken and true otherwise', async () => {
    const { service } = buildService();
    await service.create({
      email: 'ada@example.com',
      passwordHash: 'hash',
      role: 'USER',
      firstName: 'Ada',
      lastName: 'Lovelace',
    });

    await expect(service.isHandleAvailable('ada-lovelace')).resolves.toBe(false);
    await expect(service.isHandleAvailable('unclaimed-handle')).resolves.toBe(true);
  });
});
