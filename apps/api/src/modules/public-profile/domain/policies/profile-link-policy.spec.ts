import { normalizeProfileLink } from './profile-link-policy';

describe('normalizeProfileLink', () => {
  it('treats empty values as cleared', () => {
    expect(normalizeProfileLink('github', '  ')).toEqual({ ok: true, value: null });
    expect(normalizeProfileLink('website', null)).toEqual({ ok: true, value: null });
  });

  it('accepts https GitHub and LinkedIn links on their domains', () => {
    expect(normalizeProfileLink('github', 'https://github.com/ada')).toEqual({
      ok: true,
      value: 'https://github.com/ada',
    });
    expect(normalizeProfileLink('linkedin', 'https://www.linkedin.com/in/ada')).toEqual({
      ok: true,
      value: 'https://www.linkedin.com/in/ada',
    });
  });

  it('rejects plain http links', () => {
    expect(normalizeProfileLink('website', 'http://ada.dev')).toMatchObject({ ok: false });
  });

  it('rejects malformed URLs and javascript URLs', () => {
    expect(normalizeProfileLink('website', 'not a url')).toMatchObject({ ok: false });
    expect(normalizeProfileLink('website', 'javascript:alert(1)')).toMatchObject({ ok: false });
  });

  it('rejects GitHub and LinkedIn links on other domains', () => {
    expect(normalizeProfileLink('github', 'https://gitlab.com/ada')).toMatchObject({ ok: false });
    expect(normalizeProfileLink('github', 'https://github.com.evil.dev/ada')).toMatchObject({
      ok: false,
    });
    expect(normalizeProfileLink('linkedin', 'https://linkedin.evil.dev/in/ada')).toMatchObject({
      ok: false,
    });
  });

  it('rejects links with credentials and hosts without a public domain', () => {
    expect(normalizeProfileLink('website', 'https://user:pass@ada.dev')).toMatchObject({
      ok: false,
    });
    expect(normalizeProfileLink('website', 'https://localhost/me')).toMatchObject({ ok: false });
  });

  it('rejects overly long links', () => {
    expect(normalizeProfileLink('website', `https://ada.dev/${'a'.repeat(250)}`)).toMatchObject({
      ok: false,
    });
  });
});
