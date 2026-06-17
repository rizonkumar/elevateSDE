export interface UserDto {
  id: string;
  tenantId: string | null;
  email: string;
  firstName: string | null;
  lastName: string | null;
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
  firstName?: string;
  lastName?: string;
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

export type ResumeStatus = 'PROCESSING' | 'COMPLETED' | 'FAILED';

export type ResumeFeedbackSeverity = 'good' | 'warning' | 'critical';

export interface ResumeFeedbackItem {
  title: string;
  detail: string;
  severity: ResumeFeedbackSeverity;
}

export interface ResumeDto {
  id: string;
  userId: string;
  fileName: string;
  fileUrl: string | null;
  status: ResumeStatus;
  atsScore: number | null;
  parsedSkills: string[];
  missingSkills: string[];
  structureFeedback: ResumeFeedbackItem[];
  actionableTips: string[];
  summary: string | null;
  createdAt: string;
  updatedAt: string;
}

export type MockInterviewTopic = 'SYSTEM_DESIGN' | 'BEHAVIORAL' | 'CODING' | 'DSA';

export type InterviewRoleLevel = 'JUNIOR' | 'MID' | 'SENIOR' | 'STAFF';

export type InterviewCompanyStyle = 'GENERIC' | 'FAANG' | 'STARTUP' | 'ENTERPRISE';

export type InterviewSpeaker = 'AI' | 'CANDIDATE';

export type InterviewSessionStatus = 'IDLE' | 'ACTIVE' | 'COMPLETED';

export interface InterviewConfig {
  topic: MockInterviewTopic;
  roleLevel: InterviewRoleLevel;
  companyStyle: InterviewCompanyStyle;
  durationMinutes: number;
}

export interface TranscriptEntry {
  id: string;
  speaker: InterviewSpeaker;
  text: string;
  createdAt: string;
  isFinal: boolean;
}

export type InterviewCompetencySeverity = 'good' | 'warning' | 'critical';

export interface InterviewCompetencyScore {
  label: string;
  score: number;
  severity: InterviewCompetencySeverity;
}

export interface MockInterviewFeedback {
  overallScore: number;
  competencies: InterviewCompetencyScore[];
  strengths: string[];
  improvements: string[];
  summary: string;
}

export interface MockInterviewSession {
  id: string;
  userId: string;
  config: InterviewConfig;
  status: InterviewSessionStatus;
  transcript: TranscriptEntry[];
  feedback: MockInterviewFeedback | null;
  startedAt: string | null;
  endedAt: string | null;
}
