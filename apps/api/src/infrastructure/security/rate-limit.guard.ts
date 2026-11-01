import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ThrottlerGuard } from '@nestjs/throttler';
import { requireJwtSecret } from '../config/security-config';
import { resolveRateLimitKey, RateLimitRequest } from './rate-limit-key';

@Injectable()
export class RateLimitGuard extends ThrottlerGuard {
  private readonly jwt = new JwtService({ secret: requireJwtSecret() });

  protected override async getTracker(request: Record<string, unknown>): Promise<string> {
    return resolveRateLimitKey(request as RateLimitRequest, (token) => this.verifiedSubject(token));
  }

  private verifiedSubject(token: string): string | null {
    try {
      const payload = this.jwt.verify<{ sub?: unknown }>(token);
      return typeof payload.sub === 'string' && payload.sub.length > 0 ? payload.sub : null;
    } catch {
      return null;
    }
  }
}
