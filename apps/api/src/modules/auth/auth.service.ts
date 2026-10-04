import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { UsersService } from '../users/application/users.service';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { RegisterDto } from './dtos/register.dto';
import { LoginDto } from './dtos/login.dto';
import { AuthResponseDto } from '@elevatesde/shared-types';
import * as bcrypt from 'bcrypt';
import { UserRole } from '@prisma/client';
import { TokenService } from './application/token.service';
import {
  IRefreshTokenRepository,
  StoredRefreshToken,
} from './domain/interfaces/refresh-token-repository.interface';
import { isWithinReuseGrace } from './domain/refresh-token-rotation';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly tokenService: TokenService,
    private readonly prisma: PrismaService,
    private readonly refreshTokens: IRefreshTokenRepository,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponseDto> {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) {
      throw new BadRequestException('Email is already registered');
    }

    const salt = await bcrypt.genSalt();
    const passwordHash = await bcrypt.hash(dto.password, salt);

    let tenantId: string | undefined;

    if (dto.companyName) {
      const tenant = await this.prisma.tenant.create({
        data: {
          name: dto.companyName,
        },
      });
      tenantId = tenant.id;
    }

    const role = dto.companyName ? UserRole.TENANT_ADMIN : dto.role || UserRole.USER;

    const user = await this.usersService.create({
      email: dto.email,
      passwordHash,
      role,
      tenantId,
      firstName: dto.firstName,
      lastName: dto.lastName,
    });

    return this.tokenService.issueFor(user);
  }

  async login(dto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.hasPassword()) {
      throw new UnauthorizedException(
        'This account uses Google sign-in. Please continue with Google.',
      );
    }

    const isMatch = await bcrypt.compare(dto.password, user.getPasswordHash()!);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.tokenService.issueFor(user);
  }

  async refresh(token: string): Promise<AuthResponseDto> {
    const now = new Date();
    const stored = await this.refreshTokens.findByToken(token);
    if (!stored || stored.expiresAt <= now) {
      throw invalidRefreshToken();
    }
    if (stored.rotatedAt === null) {
      const rotated = await this.tryRotate(stored, now);
      if (rotated) {
        return rotated;
      }
    }
    return this.resumeRotatedSession(stored, now);
  }

  async logout(token: string): Promise<void> {
    const familyId = await this.refreshTokens.findFamilyId(token);
    if (familyId) {
      await this.refreshTokens.revokeFamily(familyId);
    }
  }

  async pruneExpiredRefreshTokens(now: Date = new Date()): Promise<number> {
    return this.refreshTokens.deleteExpired(now);
  }

  private async tryRotate(stored: StoredRefreshToken, now: Date): Promise<AuthResponseDto | null> {
    const successor = await this.tokenService.signRefreshToken(stored.user, stored.familyId);
    const rotated = await this.refreshTokens.rotate(stored.id, successor.record, now);
    return rotated ? this.tokenService.respond(stored.user, successor.token) : null;
  }

  private async resumeRotatedSession(
    stored: StoredRefreshToken,
    now: Date,
  ): Promise<AuthResponseDto> {
    const rotation = await this.refreshTokens.findRotation(stored.id);
    const successor = rotation?.liveSuccessor;
    if (
      !rotation ||
      !successor ||
      successor.expiresAt <= now ||
      !isWithinReuseGrace(rotation.rotatedAt, now)
    ) {
      await this.refreshTokens.revokeFamily(stored.familyId);
      throw invalidRefreshToken();
    }
    return this.tokenService.respond(stored.user, successor.token);
  }
}

function invalidRefreshToken(): UnauthorizedException {
  return new UnauthorizedException('Invalid or expired refresh token');
}
