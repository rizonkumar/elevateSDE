import { ProfileVisibility } from '@prisma/client';
import { isProfilePublic, resolvePublicHandle } from './public-handle';

describe('resolvePublicHandle', () => {
  const base = {
    handle: 'ada',
    profileVisibility: ProfileVisibility.PUBLIC,
    tenant: null,
  };

  it('returns the handle for a public profile without a tenant', () => {
    expect(resolvePublicHandle(base)).toBe('ada');
  });

  it('hides private profiles', () => {
    expect(resolvePublicHandle({ ...base, profileVisibility: ProfileVisibility.PRIVATE })).toBe(
      null,
    );
  });

  it('hides profiles without a handle', () => {
    expect(isProfilePublic({ ...base, handle: null })).toBe(false);
  });

  it('hides profiles when the tenant disallows public profiles', () => {
    expect(resolvePublicHandle({ ...base, tenant: { allowPublicProfiles: false } })).toBe(null);
    expect(resolvePublicHandle({ ...base, tenant: { allowPublicProfiles: true } })).toBe('ada');
  });
});
