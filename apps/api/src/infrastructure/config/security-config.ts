const MIN_JWT_SECRET_LENGTH = 32;

export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

export function requireJwtSecret(): string {
  const secret = process.env.JWT_SECRET ?? '';
  if (secret.length < MIN_JWT_SECRET_LENGTH) {
    throw new Error(
      `JWT_SECRET must be set and at least ${MIN_JWT_SECRET_LENGTH} characters long`,
    );
  }
  return secret;
}

export function resolveCorsOrigins(): string[] {
  const configured = (process.env.CORS_ALLOWED_ORIGINS ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);
  if (configured.length > 0) {
    return configured;
  }
  if (isProduction()) {
    throw new Error('CORS_ALLOWED_ORIGINS must list the allowed web origins in production');
  }
  return ['http://localhost:3001', 'http://localhost:3002'];
}

export function isSwaggerEnabled(): boolean {
  if (process.env.SWAGGER_ENABLED !== undefined) {
    return process.env.SWAGGER_ENABLED === 'true';
  }
  return !isProduction();
}

export function resolveTrustProxy(): number {
  const parsed = Number.parseInt(process.env.TRUST_PROXY ?? '', 10);
  if (Number.isFinite(parsed) && parsed >= 0) {
    return parsed;
  }
  return isProduction() ? 1 : 0;
}

export function assertSecurityConfig(): void {
  requireJwtSecret();
  resolveCorsOrigins();
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL must be set');
  }
}
