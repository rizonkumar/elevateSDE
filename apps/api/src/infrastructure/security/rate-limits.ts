import { Throttle } from '@nestjs/throttler';

const ONE_MINUTE_MS = 60_000;

export const GLOBAL_RATE_LIMIT = { ttl: ONE_MINUTE_MS, limit: 300 };

function perMinute(limit: number): MethodDecorator & ClassDecorator {
  return Throttle({ default: { ttl: ONE_MINUTE_MS, limit } });
}

export const SignUpRateLimit = () => perMinute(5);
export const SignInRateLimit = () => perMinute(10);
export const TokenRefreshRateLimit = () => perMinute(30);
export const CodeExecutionRateLimit = () => perMinute(10);
export const AiRateLimit = () => perMinute(20);
export const UploadRateLimit = () => perMinute(5);
export const InvitationRateLimit = () => perMinute(20);
export const PublicProfileRateLimit = () => perMinute(60);
