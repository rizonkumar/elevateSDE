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

export type AssessmentLanguage = 'javascript' | 'python' | 'cpp';

export type AssessmentDifficulty = 'EASY' | 'MEDIUM' | 'HARD';

export type TestCaseResultStatus = 'PASS' | 'FAIL' | 'ERROR';

export type AssessmentRunStatus = 'ACCEPTED' | 'WRONG_ANSWER' | 'RUNTIME_ERROR';

export interface CodingProblemExample {
  input: string;
  output: string;
  explanation: string | null;
}

export interface AssessmentTestCase {
  id: string;
  input: string;
  expectedOutput: string;
  isHidden: boolean;
}

export interface CodingProblemDto {
  id: string;
  title: string;
  difficulty: AssessmentDifficulty;
  description: string;
  constraints: string[];
  tags: string[];
  starterCode: Record<AssessmentLanguage, string>;
  examples: CodingProblemExample[];
  testCases: AssessmentTestCase[];
  timeLimitMinutes: number;
}

export interface TestCaseResultDto {
  testCaseId: string;
  label: string;
  status: TestCaseResultStatus;
  input: string;
  expectedOutput: string;
  actualOutput: string;
  isHidden: boolean;
  runtimeMs: number;
  memoryKb: number;
}

export interface AssessmentRunResultDto {
  status: AssessmentRunStatus;
  results: TestCaseResultDto[];
  passedCount: number;
  totalCount: number;
  totalRuntimeMs: number;
  peakMemoryKb: number;
  stdout: string;
  ranAt: string;
}
