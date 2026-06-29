export interface UserDto {
  id: string;
  tenantId: string | null;
  email: string;
  firstName: string | null;
  lastName: string | null;
  headline: string | null;
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

export interface ProblemSummaryDto {
  id: string;
  title: string;
  difficulty: AssessmentDifficulty;
  tags: string[];
  timeLimitMinutes: number;
}

export interface ProblemListDto {
  items: ProblemSummaryDto[];
  total: number;
  page: number;
  pageSize: number;
}

export interface AdminCodingProblemDto extends CodingProblemDto {
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AdminProblemSummaryDto extends ProblemSummaryDto {
  isPublished: boolean;
  testCaseCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface AdminProblemListDto {
  items: AdminProblemSummaryDto[];
  total: number;
}

export interface AdminTestCaseInput {
  input: string;
  expectedOutput: string;
  isHidden: boolean;
}

export interface AdminCodingProblemInput {
  title: string;
  difficulty: AssessmentDifficulty;
  description: string;
  constraints: string[];
  tags: string[];
  starterCode: Record<AssessmentLanguage, string>;
  timeLimitMinutes: number;
  isPublished: boolean;
  testCases: AdminTestCaseInput[];
}

export interface AssessmentRunRequestDto {
  problemId: string;
  language: AssessmentLanguage;
  code: string;
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

export type SubmissionStatusValue =
  | 'QUEUED'
  | 'RUNNING'
  | 'ACCEPTED'
  | 'WRONG_ANSWER'
  | 'RUNTIME_ERROR'
  | 'TIME_LIMIT_EXCEEDED'
  | 'COMPILE_ERROR';

export interface SubmissionAcceptedDto {
  submissionId: string;
  status: SubmissionStatusValue;
}

export interface SubmissionDetailDto {
  id: string;
  problemId: string;
  language: AssessmentLanguage;
  status: SubmissionStatusValue;
  passedCount: number;
  totalCount: number;
  totalRuntimeMs: number;
  peakMemoryKb: number;
  stdout: string;
  results: TestCaseResultDto[];
  createdAt: string;
  updatedAt: string;
}

export type ForumSortOption = 'newest' | 'popular' | 'unanswered';

export type ForumPostStatus = 'PUBLISHED' | 'FLAGGED' | 'REMOVED';

export interface ForumAuthor {
  id: string;
  name: string;
  headline: string | null;
}

export interface ForumPostDto {
  id: string;
  title: string;
  body: string;
  tags: string[];
  author: ForumAuthor;
  upvotes: number;
  hasUpvoted: boolean;
  replyCount: number;
  viewCount: number;
  createdAt: string;
}

export interface ForumCommentDto {
  id: string;
  postId: string;
  author: ForumAuthor;
  body: string;
  upvotes: number;
  hasUpvoted: boolean;
  createdAt: string;
}

export interface ForumReportDto {
  id: string;
  reason: string;
  createdAt: string;
}

export interface AdminForumPostDto {
  id: string;
  title: string;
  body: string;
  tags: string[];
  author: ForumAuthor;
  authorEmail: string;
  status: ForumPostStatus;
  upvotes: number;
  replyCount: number;
  viewCount: number;
  reportCount: number;
  reports: ForumReportDto[];
  createdAt: string;
}

export type LeaderboardTimeframe = 'all-time' | 'monthly' | 'weekly';

export interface LeaderboardEntryDto {
  rank: number;
  userId: string;
  name: string;
  headline: string | null;
  points: number;
  assessmentsCompleted: number;
  badges: string[];
  streakDays: number;
  isCurrentUser: boolean;
}

export interface DashboardJobTrackerStats {
  total: number;
  byStatus: Record<JobApplicationStatus, number>;
  upcomingInterviews: number;
}

export interface DashboardAssessmentStats {
  problemsSolved: number;
  problemsAttempted: number;
  totalSubmissions: number;
  acceptanceRate: number;
  byDifficulty: Record<AssessmentDifficulty, number>;
}

export interface DashboardLeaderboardStats {
  rank: number | null;
  points: number;
  streakDays: number;
  badges: string[];
  assessmentsCompleted: number;
}

export interface DashboardForumStats {
  postsCreated: number;
  commentsPosted: number;
  upvotesReceived: number;
}

export interface DashboardRecentSubmission {
  problemTitle: string;
  difficulty: AssessmentDifficulty;
  status: string;
  passedCount: number;
  totalCount: number;
  createdAt: string;
}

export interface DashboardStatsDto {
  jobTracker: DashboardJobTrackerStats;
  assessments: DashboardAssessmentStats;
  leaderboard: DashboardLeaderboardStats;
  forum: DashboardForumStats;
  recentSubmissions: DashboardRecentSubmission[];
}

export interface DailyChallengeDto {
  id: string;
  challengeDate: string;
  problem: ProblemSummaryDto;
  completed: boolean;
}

export interface StreakCalendarCellDto {
  date: string;
  completed: boolean;
}

export interface StreakSummaryDto {
  current: number;
  longest: number;
  lastActiveDate: string | null;
  calendar: StreakCalendarCellDto[];
}

export interface DailyChallengeScheduleDto {
  id: string;
  challengeDate: string;
  problemId: string;
  problemTitle: string;
  difficulty: AssessmentDifficulty;
  completionCount: number;
}

export interface CreateDailyChallengeDto {
  challengeDate: string;
  problemId: string;
}

export interface SubmissionHeatmapCellDto {
  date: string;
  count: number;
}

export interface SubmissionHeatmapDto {
  cells: SubmissionHeatmapCellDto[];
}

export type InvitationStatus = 'PENDING' | 'ACCEPTED' | 'REVOKED' | 'EXPIRED';

export type OrgMemberStatus = 'active' | 'invited';

export interface OrgCompanyDto {
  name: string;
  plan: string;
}

export interface SeatUsageDto {
  used: number;
  total: number;
}

export interface OrgMemberDto {
  id: string;
  email: string;
  status: OrgMemberStatus;
  avgScore: number;
}

export interface OrgPerformancePointDto {
  label: string;
  score: number;
}

export interface InvitationDto {
  id: string;
  email: string;
  status: InvitationStatus;
  createdAt: string;
  expiresAt: string;
}

export interface OrgOverviewDto {
  company: OrgCompanyDto;
  seats: SeatUsageDto;
  members: OrgMemberDto[];
  teamPerformance: OrgPerformancePointDto[];
  invitations: InvitationDto[];
}

export interface InviteCreatedDto extends InvitationDto {
  token: string;
  inviteUrl: string;
}

export interface InvitePreviewDto {
  tenantName: string;
  email: string;
  status: InvitationStatus;
  valid: boolean;
}

export type BadgeCriteriaType =
  | 'PROBLEMS_SOLVED'
  | 'STREAK_DAYS'
  | 'ASSESSMENTS_COMPLETED'
  | 'FORUM_POSTS'
  | 'POINTS';

export interface BadgeDto {
  id: string;
  key: string;
  name: string;
  description: string;
  icon: string;
  criteriaType: BadgeCriteriaType;
  threshold: number;
  isActive: boolean;
}

export interface UserBadgeDto extends BadgeDto {
  awardedAt: string;
}

export interface LockedBadgeDto extends BadgeDto {
  progress: number;
}

export interface AdminBadgeDto extends BadgeDto {
  awardCount: number;
}

export interface AchievementsViewDto {
  earned: UserBadgeDto[];
  locked: LockedBadgeDto[];
}

export interface CreateBadgeDto {
  key: string;
  name: string;
  description: string;
  icon: string;
  criteriaType: BadgeCriteriaType;
  threshold: number;
  isActive: boolean;
}

export interface GrantBadgeDto {
  userId: string;
  badgeId: string;
}

export type NotificationType =
  | 'BADGE_AWARDED'
  | 'STREAK_MILESTONE'
  | 'FORUM_REPLY'
  | 'FORUM_UPVOTE'
  | 'SUBMISSION_ACCEPTED'
  | 'SYSTEM';

export interface NotificationDto {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  linkUrl: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationsViewDto {
  notifications: NotificationDto[];
  unreadCount: number;
}

export interface UnreadCountDto {
  unreadCount: number;
}

export interface NotificationPreferenceDto {
  type: NotificationType;
  inAppEnabled: boolean;
}

export interface UpdateNotificationPreferenceDto {
  type: NotificationType;
  inAppEnabled: boolean;
}
