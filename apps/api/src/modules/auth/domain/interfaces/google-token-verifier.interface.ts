export interface GoogleIdentity {
  googleId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
}

export abstract class IGoogleTokenVerifier {
  abstract verify(idToken: string): Promise<GoogleIdentity>;
}
