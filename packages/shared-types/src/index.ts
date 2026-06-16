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
  createdAt: string;
  updatedAt: string;
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

export interface AuditLogDto {
  id: string;
  userId: string | null;
  action: string;
  metadata: Record<string, any> | null;
  createdAt: string;
}

export interface FeatureFlagDto {
  id: string;
  flagKey: string;
  isEnabled: boolean;
  percentageRollout: number;
  createdAt: string;
  updatedAt: string;
}

export interface AdminStatsDto {
  totalUsers: number;
  totalTenants: number;
  activeFeatureFlagsCount: number;
}

export type JobApplicationStatus = 'APPLIED' | 'OA' | 'INTERVIEW' | 'OFFER' | 'REJECTED';

export interface JobApplicationDto {
  id: string;
  userId: string;
  company: string;
  role: string;
  status: JobApplicationStatus;
  salaryRange: string | null;
  jobDescriptionUrl: string | null;
  interviewDate: string | null;
  boardPosition: number;
  createdAt: string;
  updatedAt: string;
}
