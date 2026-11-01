import type { GoogleAuthResultDto, RegistrationResultDto } from '@elevatesde/shared-types';
import { api } from './api';

export async function signInWithGoogle(idToken: string): Promise<GoogleAuthResultDto> {
  const response = await api.post<GoogleAuthResultDto>('/api/v1/auth/google', { idToken });
  return response.data;
}

export async function completeGoogleSignup(
  onboardingToken: string,
  role: 'USER' | 'TENANT_ADMIN',
  companyName?: string,
): Promise<RegistrationResultDto> {
  const response = await api.post<RegistrationResultDto>('/api/v1/auth/google/complete', {
    onboardingToken,
    role,
    companyName,
  });
  return response.data;
}
