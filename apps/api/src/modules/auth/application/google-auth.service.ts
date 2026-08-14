import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from '@prisma/client';
import { UsersService } from '../../users/application/users.service';
import { User } from '../../users/domain/entities/user';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import {
  GoogleIdentity,
  IGoogleTokenVerifier,
} from '../domain/interfaces/google-token-verifier.interface';
import { TokenService } from './token.service';
import { GoogleAuthContext } from '../dtos/google-sign-in.dto';
import { AuthResponseDto, GoogleAuthResultDto } from '@elevatesde/shared-types';

interface OnboardingTokenPayload {
  purpose: 'GOOGLE_ONBOARDING';
  googleId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
}

const ONBOARDING_TOKEN_TTL = '10m';

@Injectable()
export class GoogleAuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly tokenService: TokenService,
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly googleTokenVerifier: IGoogleTokenVerifier,
  ) {}

  async signIn(idToken: string, context: GoogleAuthContext): Promise<GoogleAuthResultDto> {
    const identity = await this.googleTokenVerifier.verify(idToken);
    const user = await this.resolveExistingUser(identity);

    if (context === GoogleAuthContext.ADMIN) {
      return this.authenticateAdmin(user);
    }

    if (!user) {
      return {
        status: 'ONBOARDING_REQUIRED',
        auth: null,
        onboarding: {
          onboardingToken: await this.issueOnboardingToken(identity),
          email: identity.email,
          firstName: identity.firstName,
          lastName: identity.lastName,
        },
      };
    }

    return {
      status: 'AUTHENTICATED',
      auth: await this.tokenService.issueFor(user),
      onboarding: null,
    };
  }

  async completeSignup(
    onboardingToken: string,
    role: UserRole,
    companyName?: string,
  ): Promise<AuthResponseDto> {
    const payload = await this.verifyOnboardingToken(onboardingToken);

    const existing =
      (await this.usersService.findByGoogleId(payload.googleId)) ??
      (await this.usersService.findByEmail(payload.email));

    if (existing) {
      const linked = existing.getGoogleId()
        ? existing
        : await this.usersService.linkGoogleAccount(existing.getId(), payload.googleId);
      return this.tokenService.issueFor(linked);
    }

    if (role === UserRole.TENANT_ADMIN && !companyName) {
      throw new BadRequestException('Company name is required for organization accounts');
    }

    let tenantId: string | undefined;
    if (role === UserRole.TENANT_ADMIN && companyName) {
      const tenant = await this.prisma.tenant.create({ data: { name: companyName } });
      tenantId = tenant.id;
    }

    const user = await this.usersService.create({
      email: payload.email,
      googleId: payload.googleId,
      role,
      tenantId,
      firstName: payload.firstName ?? undefined,
      lastName: payload.lastName ?? undefined,
    });

    return this.tokenService.issueFor(user);
  }

  private async resolveExistingUser(identity: GoogleIdentity): Promise<User | null> {
    const byGoogleId = await this.usersService.findByGoogleId(identity.googleId);
    if (byGoogleId) {
      return byGoogleId;
    }

    const byEmail = await this.usersService.findByEmail(identity.email);
    if (!byEmail) {
      return null;
    }

    return this.usersService.linkGoogleAccount(byEmail.getId(), identity.googleId);
  }

  private async authenticateAdmin(user: User | null): Promise<GoogleAuthResultDto> {
    if (!user) {
      throw new UnauthorizedException('No ElevateSDE admin account found for this Google account');
    }
    if (user.getRole() !== UserRole.ADMIN) {
      throw new ForbiddenException('Administrative permissions required');
    }
    return {
      status: 'AUTHENTICATED',
      auth: await this.tokenService.issueFor(user),
      onboarding: null,
    };
  }

  private async issueOnboardingToken(identity: GoogleIdentity): Promise<string> {
    const payload: OnboardingTokenPayload = {
      purpose: 'GOOGLE_ONBOARDING',
      googleId: identity.googleId,
      email: identity.email,
      firstName: identity.firstName,
      lastName: identity.lastName,
    };
    return this.jwtService.signAsync(payload, { expiresIn: ONBOARDING_TOKEN_TTL });
  }

  private async verifyOnboardingToken(token: string): Promise<OnboardingTokenPayload> {
    let payload: OnboardingTokenPayload;
    try {
      payload = await this.jwtService.verifyAsync<OnboardingTokenPayload>(token);
    } catch {
      throw new UnauthorizedException(
        'Onboarding session expired. Please sign in with Google again.',
      );
    }
    if (payload.purpose !== 'GOOGLE_ONBOARDING') {
      throw new UnauthorizedException('Invalid onboarding token');
    }
    return payload;
  }
}
