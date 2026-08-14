import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { UsersModule } from '../users/users.module';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
import { TokenService } from './application/token.service';
import { GoogleAuthService } from './application/google-auth.service';
import { GoogleAuthController } from './presentation/google-auth.controller';
import { IGoogleTokenVerifier } from './domain/interfaces/google-token-verifier.interface';
import { GoogleTokenVerifier } from './infrastructure/google-token-verifier';

@Module({
  imports: [
    UsersModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'super-secret-key-12345',
    }),
  ],
  controllers: [AuthController, GoogleAuthController],
  providers: [
    AuthService,
    TokenService,
    GoogleAuthService,
    JwtStrategy,
    PrismaService,
    {
      provide: IGoogleTokenVerifier,
      useClass: GoogleTokenVerifier,
    },
  ],
  exports: [AuthService, JwtStrategy, PassportModule],
})
export class AuthModule {}
