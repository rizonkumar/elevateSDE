import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { UsersService } from '../users/application/users.service';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { RegisterDto } from './dtos/register.dto';
import { LoginDto } from './dtos/login.dto';
import { AuthResponseDto } from '@elevatesde/shared-types';
import * as bcrypt from 'bcrypt';
import { UserRole } from '@prisma/client';
import { UserMapper } from '../users/infrastructure/mappers/user.mapper';
import { TokenService } from './application/token.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly tokenService: TokenService,
    private readonly prisma: PrismaService,
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
    const record = await this.prisma.refreshToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!record || record.expiresAt < new Date()) {
      if (record) {
        await this.prisma.refreshToken.delete({ where: { id: record.id } });
      }
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    await this.prisma.refreshToken.delete({ where: { id: record.id } });

    const user = UserMapper.toDomain(record.user);
    return this.tokenService.issueFor(user);
  }

  async logout(token: string): Promise<void> {
    const record = await this.prisma.refreshToken.findUnique({
      where: { token },
    });
    if (record) {
      await this.prisma.refreshToken.delete({ where: { id: record.id } });
    }
  }
}
