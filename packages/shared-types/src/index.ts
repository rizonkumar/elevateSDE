export interface UserDto {
  id: string;
  tenantId: string | null;
  email: string;
  role: string;
  createdAt: string;
}

export interface TenantDto {
  id: string;
  name: string;
  stripeCustomerId: string | null;
  subscriptionPlan: string;
}

export interface RegisterDto {
  email: string;
  passwordHash: string;
  role: string;
  tenantId?: string;
}

export interface AuthResponseDto {
  accessToken: string;
  refreshToken: string;
  user: UserDto;
}
