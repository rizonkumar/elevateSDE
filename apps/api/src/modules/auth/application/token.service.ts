import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from '../../users/domain/entities/user';
import { UserPresentationMapper } from '../../users/presentation/mappers/user-presentation.mapper';
import { AuthResponseDto } from '@elevatesde/shared-types';
import { AUTH_TOKEN_TYPES, AuthTokenPayload, AuthTokenType } from '../domain/auth-token';
import { IRefreshTokenRepository } from '../domain/interfaces/refresh-token-repository.interface';
import { REFRESH_TOKEN_TTL_DAYS, refreshTokenExpiry } from '../domain/refresh-token-rotation';

@Injectable()
export class TokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly refreshTokens: IRefreshTokenRepository,
  ) {}

  async issueFor(user: User, familyId: string = randomUUID()): Promise<AuthResponseDto> {
    const accessToken = await this.jwtService.signAsync(
      this.payloadFor(user, AUTH_TOKEN_TYPES.ACCESS),
      { expiresIn: '15m' },
    );

    const refreshTokenString = await this.jwtService.signAsync(
      this.payloadFor(user, AUTH_TOKEN_TYPES.REFRESH),
      { expiresIn: `${REFRESH_TOKEN_TTL_DAYS}d`, jwtid: randomUUID() },
    );

    await this.refreshTokens.create({
      userId: user.getId(),
      familyId,
      token: refreshTokenString,
      expiresAt: refreshTokenExpiry(new Date()),
    });

    return {
      accessToken,
      refreshToken: refreshTokenString,
      user: UserPresentationMapper.toResponse(user),
    };
  }

  private payloadFor(user: User, typ: AuthTokenType): AuthTokenPayload {
    return { sub: user.getId(), email: user.getEmail(), typ };
  }
}
