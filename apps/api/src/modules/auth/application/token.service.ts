import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from '../../users/domain/entities/user';
import { UserPresentationMapper } from '../../users/presentation/mappers/user-presentation.mapper';
import { AuthResponseDto } from '@elevatesde/shared-types';
import { AUTH_TOKEN_TYPES, AuthTokenPayload, AuthTokenType } from '../domain/auth-token';
import {
  IRefreshTokenRepository,
  NewRefreshToken,
} from '../domain/interfaces/refresh-token-repository.interface';
import { REFRESH_TOKEN_TTL_DAYS, refreshTokenExpiry } from '../domain/refresh-token-rotation';

const ACCESS_TOKEN_TTL = '15m';

export interface SignedRefreshToken {
  record: NewRefreshToken;
  token: string;
}

@Injectable()
export class TokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly refreshTokens: IRefreshTokenRepository,
  ) {}

  async issueFor(user: User): Promise<AuthResponseDto> {
    const refresh = await this.signRefreshToken(user, randomUUID());
    await this.refreshTokens.create(refresh.record);
    return this.respond(user, refresh.token);
  }

  async signRefreshToken(user: User, familyId: string): Promise<SignedRefreshToken> {
    const token = await this.jwtService.signAsync(this.payloadFor(user, AUTH_TOKEN_TYPES.REFRESH), {
      expiresIn: `${REFRESH_TOKEN_TTL_DAYS}d`,
      jwtid: randomUUID(),
    });
    return {
      token,
      record: { userId: user.getId(), familyId, token, expiresAt: refreshTokenExpiry(new Date()) },
    };
  }

  async respond(user: User, refreshToken: string): Promise<AuthResponseDto> {
    const accessToken = await this.jwtService.signAsync(
      this.payloadFor(user, AUTH_TOKEN_TYPES.ACCESS),
      { expiresIn: ACCESS_TOKEN_TTL },
    );
    return { accessToken, refreshToken, user: UserPresentationMapper.toResponse(user) };
  }

  private payloadFor(user: User, typ: AuthTokenType): AuthTokenPayload {
    return { sub: user.getId(), email: user.getEmail(), typ };
  }
}
