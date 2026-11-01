import { resolveRateLimitKey, SubjectVerifier } from './rate-limit-key';

const verify: SubjectVerifier = (token) => (token === 'valid-token' ? 'u1' : null);

describe('resolveRateLimitKey', () => {
  it('keys verified authenticated requests by user so a shared proxy IP does not pool users', () => {
    expect(
      resolveRateLimitKey(
        { ip: '10.0.0.1', headers: { authorization: 'Bearer valid-token' } },
        verify,
      ),
    ).toBe('user:u1');
  });

  it('ignores forged tokens so they cannot be used to dodge sign-in limits', () => {
    expect(
      resolveRateLimitKey(
        { ip: '10.0.0.1', headers: { authorization: 'Bearer forged-token' } },
        verify,
      ),
    ).toBe('ip:10.0.0.1');
  });

  it('falls back to the IP for anonymous requests', () => {
    expect(resolveRateLimitKey({ ip: '10.0.0.1' }, verify)).toBe('ip:10.0.0.1');
  });
});
