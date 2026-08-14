import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { User } from '../../users/domain/entities/user';
import { UserPresentationMapper } from '../../users/presentation/mappers/user-presentation.mapper';
import { AuthResponseDto } from '@elevatesde/shared-types';

@Injectable()
export class TokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async issueFor(user: User): Promise<AuthResponseDto> {
    const payload = { sub: user.getId(), email: user.getEmail() };
    const accessToken = await this.jwtService.signAsync(payload, {
      expiresIn: '15m',
    });

    const refreshTokenString = await this.jwtService.signAsync(payload, {
      expiresIn: '7d',
    });

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.prisma.refreshToken.create({
      data: {
        userId: user.getId(),
        token: refreshTokenString,
        expiresAt,
      },
    });

    return {
      accessToken,
      refreshToken: refreshTokenString,
      user: UserPresentationMapper.toResponse(user),
    };
  }
}
