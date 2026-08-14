import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { GoogleAuthService } from '../application/google-auth.service';
import { GoogleSignInDto, GoogleAuthContext } from '../dtos/google-sign-in.dto';
import { CompleteGoogleSignupDto } from '../dtos/complete-google-signup.dto';
import { AuthResponseDto, GoogleAuthResultDto } from '@elevatesde/shared-types';

@ApiTags('Auth')
@Controller({ path: 'auth', version: '1' })
export class GoogleAuthController {
  constructor(private readonly googleAuthService: GoogleAuthService) {}

  @Post('google')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Sign in with a Google ID token, auto-linking or starting onboarding as needed',
  })
  @ApiResponse({ status: 200, description: 'Authenticated, or onboarding is required.' })
  @ApiResponse({ status: 401, description: 'Invalid Google token, or no matching admin account.' })
  @ApiResponse({ status: 403, description: 'Google account is not an administrator.' })
  google(@Body() dto: GoogleSignInDto): Promise<GoogleAuthResultDto> {
    return this.googleAuthService.signIn(dto.idToken, dto.context ?? GoogleAuthContext.WEB);
  }

  @Post('google/complete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Complete a Google sign-up by selecting a role and, if applicable, a company',
  })
  @ApiResponse({ status: 200, description: 'Account created and successfully authenticated.' })
  @ApiResponse({ status: 400, description: 'Company name missing for an organization account.' })
  @ApiResponse({ status: 401, description: 'Invalid or expired onboarding token.' })
  complete(@Body() dto: CompleteGoogleSignupDto): Promise<AuthResponseDto> {
    return this.googleAuthService.completeSignup(dto.onboardingToken, dto.role, dto.companyName);
  }
}
