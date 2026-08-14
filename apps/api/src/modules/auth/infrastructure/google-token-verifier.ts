import { Injectable, UnauthorizedException } from '@nestjs/common';
import { OAuth2Client } from 'google-auth-library';
import {
  GoogleIdentity,
  IGoogleTokenVerifier,
} from '../domain/interfaces/google-token-verifier.interface';

@Injectable()
export class GoogleTokenVerifier implements IGoogleTokenVerifier {
  private readonly client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

  async verify(idToken: string): Promise<GoogleIdentity> {
    const ticket = await this.client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email || !payload.email_verified) {
      throw new UnauthorizedException('Invalid or unverified Google account');
    }

    return {
      googleId: payload.sub,
      email: payload.email,
      firstName: payload.given_name ?? null,
      lastName: payload.family_name ?? null,
    };
  }
}
