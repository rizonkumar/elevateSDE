export interface RateLimitRequest {
  ip?: string;
  headers?: Record<string, string | string[] | undefined>;
}

export type SubjectVerifier = (token: string) => string | null;

function bearerToken(authorization: string | string[] | undefined): string | null {
  if (typeof authorization !== 'string' || !authorization.startsWith('Bearer ')) {
    return null;
  }
  const token = authorization.slice('Bearer '.length).trim();
  return token.length > 0 ? token : null;
}

export function resolveRateLimitKey(
  request: RateLimitRequest,
  verifySubject: SubjectVerifier,
): string {
  const ip = request.ip ?? 'unknown';
  const token = bearerToken(request.headers?.authorization);
  const subject = token ? verifySubject(token) : null;
  if (subject) {
    return `user:${subject}`;
  }
  return `ip:${ip}`;
}
