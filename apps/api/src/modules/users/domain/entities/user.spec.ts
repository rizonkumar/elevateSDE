import { User } from './user';

function buildUser(): User {
  return User.create({
    id: 'u1',
    email: 'ada@example.com',
    passwordHash: 'hash',
    role: 'USER',
    handle: 'ada-lovelace',
    firstName: 'Ada',
    lastName: 'Lovelace',
  });
}

describe('User.create', () => {
  it('rejects an invalid handle', () => {
    expect(() =>
      User.create({
        id: 'u1',
        email: 'ada@example.com',
        passwordHash: 'hash',
        role: 'USER',
        handle: 'ab',
      }),
    ).toThrow();
  });

  it('defaults new profiles to public with no bio or links', () => {
    const user = buildUser();

    expect(user.isPublicProfile()).toBe(true);
    expect(user.getBio()).toBeNull();
    expect(user.getGithubUrl()).toBeNull();
  });
});

describe('User.updateProfile', () => {
  it('applies only the provided fields and leaves the rest untouched', () => {
    const user = buildUser();

    const updated = user.updateProfile({ bio: 'Hi there' });

    expect(updated.getBio()).toBe('Hi there');
    expect(updated.getHandle()).toBe('ada-lovelace');
    expect(updated.getFirstName()).toBe('Ada');
  });

  it('rejects a handle that fails the pattern', () => {
    const user = buildUser();

    expect(() => user.updateProfile({ handle: 'a' })).toThrow();
    expect(() => user.updateProfile({ handle: 'Has-Upper' })).toThrow();
    expect(() => user.updateProfile({ handle: '-leading-hyphen' })).toThrow();
  });

  it('is immutable — the original entity is unchanged', () => {
    const user = buildUser();

    user.updateProfile({ bio: 'Changed' });

    expect(user.getBio()).toBeNull();
  });
});
