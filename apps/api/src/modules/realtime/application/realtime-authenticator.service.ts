import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../../users/application/users.service';
import { AuthTokenPayload, isAccessTokenPayload } from '../../auth/domain/auth-token';
import {
  REALTIME_AUTH_ERRORS,
  RealtimeAuthError,
  RealtimeIdentity,
} from '../domain/realtime-identity';

type VerifiedPayload = Partial<AuthTokenPayload> & { exp?: number };

@Injectable()
export class RealtimeAuthenticator {
  constructor(
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
  ) {}

  async authenticate(token: unknown): Promise<RealtimeIdentity> {
    if (typeof token !== 'string' || token.length === 0) {
      throw new RealtimeAuthError(REALTIME_AUTH_ERRORS.UNAUTHORIZED);
    }
    const payload = await this.verify(token);
    const expiresAtSeconds = payload.exp;
    if (!isAccessTokenPayload(payload) || typeof expiresAtSeconds !== 'number') {
      throw new RealtimeAuthError(REALTIME_AUTH_ERRORS.UNAUTHORIZED);
    }
    const user = await this.usersService.findById(payload.sub).catch(() => null);
    if (!user?.isActive()) {
      throw new RealtimeAuthError(REALTIME_AUTH_ERRORS.FORBIDDEN);
    }
    return {
      userId: user.getId(),
      tenantId: user.getTenantId(),
      expiresAt: expiresAtSeconds * 1000,
    };
  }

  private async verify(token: string): Promise<VerifiedPayload> {
    try {
      return await this.jwtService.verifyAsync<VerifiedPayload>(token);
    } catch {
      throw new RealtimeAuthError(REALTIME_AUTH_ERRORS.UNAUTHORIZED);
    }
  }
}
