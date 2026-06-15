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
  stripeCustomerId: string;
  subscriptionPlan: string;
}
