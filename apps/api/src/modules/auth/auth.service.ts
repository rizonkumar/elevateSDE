import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/application/users.service';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { RegisterDto } from './dtos/register.dto';
import { LoginDto } from './dtos/login.dto';
import { AuthResponseDto, RegistrationResultDto } from '@elevatesde/shared-types';
import * as bcrypt from 'bcrypt';
import { UserRole } from '@prisma/client';
import { TokenService } from './application/token.service';
import {
  IRefreshTokenRepository,
  StoredRefreshToken,
} from './domain/interfaces/refresh-token-repository.interface';
import { isWithinReuseGrace } from './domain/refresh-token-rotation';
import { assertAccountCanSignIn } from './domain/account-access';
import { AccountReviewService } from '../users/application/account-review.service';
import { hashPassword } from './domain/password-hashing';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly tokenService: TokenService,
    private readonly prisma: PrismaService,
    private readonly refreshTokens: IRefreshTokenRepository,
    private readonly accountReview: AccountReviewService,
  ) {}

  async register(dto: RegisterDto): Promise<RegistrationResultDto> {
    const email = dto.email.trim();
    const pending: RegistrationResultDto = { status: 'PENDING_APPROVAL', email };
    const existing = await this.usersService.findByEmail(email);
    if (existing) {
      return pending;
    }

    const passwordHash = await hashPassword(dto.password);

    let tenantId: string | undefined;

    if (dto.companyName) {
      const tenant = await this.prisma.tenant.create({
        data: {
          name: dto.companyName,
        },
      });
      tenantId = tenant.id;
    }

    const role = dto.companyName ? UserRole.TENANT_ADMIN : UserRole.USER;

    const user = await this.usersService.create({
      email,
      passwordHash,
      role,
      tenantId,
      firstName: dto.firstName,
      lastName: dto.lastName,
    });

    await this.accountReview.announcePending(user);
    return pending;
  }

  async login(dto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.usersService.findByEmail(dto.email.trim());
    const passwordHash = user?.getPasswordHash() ?? null;
    if (!user || !passwordHash) {
      await bcrypt.compare(dto.password, TIMING_SAFE_DUMMY_HASH);
      throw invalidCredentials();
    }

    const isMatch = await bcrypt.compare(dto.password, passwordHash);
    if (!isMatch) {
      throw invalidCredentials();
    }

    assertAccountCanSignIn(user);
    return this.tokenService.issueFor(user);
  }

  async refresh(token: string): Promise<AuthResponseDto> {
    const now = new Date();
    const stored = await this.refreshTokens.findByToken(token);
    if (!stored || stored.expiresAt <= now) {
      throw invalidRefreshToken();
    }
    if (!stored.user.isActive()) {
      await this.refreshTokens.revokeFamily(stored.familyId);
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

const TIMING_SAFE_DUMMY_HASH = '$2b$12$lEHOHk0sbjUEEQ.hx52zdOGHVHpvjn031m3rXIne.zbUp.OtCX9uO';

function invalidCredentials(): UnauthorizedException {
  return new UnauthorizedException('Invalid credentials');
}

function invalidRefreshToken(): UnauthorizedException {
  return new UnauthorizedException('Invalid or expired refresh token');
}
