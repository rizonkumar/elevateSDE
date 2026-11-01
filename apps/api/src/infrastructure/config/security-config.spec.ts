import { isSwaggerEnabled, requireJwtSecret, resolveCorsOrigins } from './security-config';

describe('security config', () => {
  const original = { ...process.env };

  afterEach(() => {
    process.env = { ...original };
  });

  it('rejects a missing JWT secret', () => {
    delete process.env.JWT_SECRET;
    expect(() => requireJwtSecret()).toThrow('JWT_SECRET');
  });

  it('rejects a short JWT secret', () => {
    process.env.JWT_SECRET = 'short';
    expect(() => requireJwtSecret()).toThrow('JWT_SECRET');
  });

  it('accepts a long JWT secret', () => {
    process.env.JWT_SECRET = 'x'.repeat(32);
    expect(requireJwtSecret()).toBe('x'.repeat(32));
  });

  it('refuses to allow every origin in production when none are configured', () => {
    process.env.NODE_ENV = 'production';
    delete process.env.CORS_ALLOWED_ORIGINS;
    expect(() => resolveCorsOrigins()).toThrow('CORS_ALLOWED_ORIGINS');
  });

  it('parses configured origins', () => {
    process.env.CORS_ALLOWED_ORIGINS = 'https://a.dev, https://b.dev';
    expect(resolveCorsOrigins()).toEqual(['https://a.dev', 'https://b.dev']);
  });

  it('disables swagger in production unless explicitly enabled', () => {
    process.env.NODE_ENV = 'production';
    delete process.env.SWAGGER_ENABLED;
    expect(isSwaggerEnabled()).toBe(false);
    process.env.SWAGGER_ENABLED = 'true';
    expect(isSwaggerEnabled()).toBe(true);
  });
});
