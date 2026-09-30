import type { BrowserContext, Page, Route } from '@playwright/test';
import type {
  InterviewLoopTemplateDto,
  InterviewPreparationOverviewDto,
  InterviewPreparationPlanDto,
  PreparationTaskDto,
  ReadinessSnapshotDto,
  UserDto,
} from '@elevatesde/shared-types';

export const user: UserDto = {
  id: '00000000-0000-4000-8000-000000000001',
  email: 'candidate@example.com',
  firstName: 'Alex',
  lastName: 'Morgan',
  headline: 'Software engineer',
  role: 'USER',
  tenantId: null,
  createdAt: '2026-01-01T00:00:00.000Z',
};

const snapshot: ReadinessSnapshotDto = {
  id: '00000000-0000-4000-8000-000000000101',
  formulaVersion: 'v1',
  score: 76,
  status: 'PROGRESSING',
  confidence: 0.68,
  coverage: 0.79,
  rounds: [
    {
      roundId: '00000000-0000-4000-8000-000000000201',
      roundType: 'CODING',
      title: 'Coding',
      score: 82,
      status: 'READY',
      confidence: 0.82,
      coverage: 1,
      evidence: [
        { source: 'CODING_SUBMISSIONS', label: 'Timed coding practice', score: 86, weight: 1, observedAt: '2026-09-29T12:00:00.000Z', stale: false, detail: 'Measured from accepted submissions and recent attempts.', deepLink: '/dashboard/assessment' },
        { source: 'SPACED_REPETITION', label: 'Review retention', score: 78, weight: 1, observedAt: '2026-09-28T12:00:00.000Z', stale: false, detail: 'Measured from your due and completed reviews.', deepLink: '/dashboard/review' },
      ],
      missingEvidence: [],
    },
    {
      roundId: '00000000-0000-4000-8000-000000000202',
      roundType: 'SYSTEM_DESIGN',
      title: 'System design',
      score: 68,
      status: 'PROGRESSING',
      confidence: 0.54,
      coverage: 0.67,
      evidence: [
        { source: 'LEARNING_PATH', label: 'Preparation track', score: 68, weight: 1, observedAt: '2026-09-26T12:00:00.000Z', stale: false, detail: 'Measured from your enrolled preparation track.', deepLink: '/dashboard/paths' },
        { source: 'PEER_SCORECARD', label: 'Peer feedback', score: null, weight: 1, observedAt: null, stale: false, detail: 'No durable evidence is available yet.', deepLink: '/dashboard/interview-readiness' },
      ],
      missingEvidence: ['PEER_SCORECARD'],
    },
  ],
  deterministicRecommendations: ['Schedule system design peer practice', 'Run a behavioral mock interview', 'Review the target role against your resume'],
  aiExplanation: null,
  aiSnapshotId: null,
  calculatedAt: '2026-09-30T12:00:00.000Z',
};

const tasks: PreparationTaskDto[] = [
  { id: '00000000-0000-4000-8000-000000000301', roundId: '00000000-0000-4000-8000-000000000201', type: 'SOLVE_PROBLEM', title: 'Complete a timed coding problem', description: null, status: 'COMPLETED', dueAt: null, completedAt: '2026-09-29T12:00:00.000Z', resourceType: null, resourceId: null, deepLink: '/dashboard/assessment', ordinal: 0, version: 1 },
  { id: '00000000-0000-4000-8000-000000000302', roundId: '00000000-0000-4000-8000-000000000201', type: 'REVIEW_PROBLEM', title: 'Review due coding problems', description: null, status: 'PENDING', dueAt: null, completedAt: null, resourceType: null, resourceId: null, deepLink: '/dashboard/review', ordinal: 1, version: 0 },
  { id: '00000000-0000-4000-8000-000000000303', roundId: '00000000-0000-4000-8000-000000000202', type: 'COMPLETE_PATH', title: 'Continue a preparation track', description: null, status: 'PENDING', dueAt: null, completedAt: null, resourceType: null, resourceId: null, deepLink: '/dashboard/paths', ordinal: 2, version: 0 },
];

export const plan: InterviewPreparationPlanDto = {
  id: '00000000-0000-4000-8000-000000000100',
  jobApplicationId: '00000000-0000-4000-8000-000000000010',
  company: 'Northstar Labs',
  role: 'Senior Software Engineer',
  targetAt: '2026-10-12T15:00:00.000Z',
  timeZone: 'America/New_York',
  archetype: 'STARTUP',
  status: 'ACTIVE',
  version: 0,
  latestReadiness: snapshot,
  createdAt: '2026-09-30T10:00:00.000Z',
  updatedAt: '2026-09-30T12:00:00.000Z',
  rounds: [
    { id: snapshot.rounds[0]!.roundId, type: 'CODING', title: 'Coding', weight: 1.2, ordinal: 0, version: 0, tasks: tasks.slice(0, 2), readiness: snapshot.rounds[0]! },
    { id: snapshot.rounds[1]!.roundId, type: 'SYSTEM_DESIGN', title: 'System design', weight: 1.2, ordinal: 1, version: 0, tasks: tasks.slice(2), readiness: snapshot.rounds[1]! },
  ],
  snapshots: [snapshot],
  peerSessions: [],
};

export const overview: InterviewPreparationOverviewDto = {
  plans: [plan],
  unplannedApplications: [
    { id: '00000000-0000-4000-8000-000000000011', userId: user.id, company: 'Acme Systems', role: 'Platform Engineer', status: 'INTERVIEW', salaryRange: null, jobDescriptionUrl: null, interviewDate: '2026-10-20T16:00:00.000Z', boardPosition: 0, createdAt: '2026-09-20T00:00:00.000Z', updatedAt: '2026-09-30T00:00:00.000Z' },
  ],
};

export const templates: InterviewLoopTemplateDto[] = [
  { archetype: 'GENERAL', title: 'General software engineering', description: 'Balanced preparation', rounds: [{ type: 'CODING', title: 'Coding', weight: 1.2, suggestedTaskTypes: ['SOLVE_PROBLEM'] }, { type: 'SYSTEM_DESIGN', title: 'System design', weight: 1, suggestedTaskTypes: ['COMPLETE_PATH'] }, { type: 'BEHAVIORAL', title: 'Behavioral', weight: 1, suggestedTaskTypes: ['RUN_MOCK_INTERVIEW'] }, { type: 'RESUME_ROLE_FIT', title: 'Resume and role fit', weight: 1, suggestedTaskTypes: ['ANALYZE_RESUME'] }] },
  { archetype: 'STARTUP', title: 'Startup', description: 'Practical preparation', rounds: [{ type: 'CODING', title: 'Practical coding', weight: 1.2, suggestedTaskTypes: ['SOLVE_PROBLEM'] }, { type: 'SYSTEM_DESIGN', title: 'Architecture and tradeoffs', weight: 1.2, suggestedTaskTypes: ['COMPLETE_PATH'] }] },
];

async function fulfill(route: Route, body: unknown, status = 200): Promise<void> {
  await route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
}

export async function authenticate(context: BrowserContext, theme: 'light' | 'dark' = 'light'): Promise<void> {
  await context.addCookies([
    { name: 'accessToken', value: 'e2e-token', domain: 'localhost', path: '/' },
    { name: 'user', value: JSON.stringify(user), domain: 'localhost', path: '/' },
  ]);
  await context.addInitScript((selectedTheme) => localStorage.setItem('theme', selectedTheme), theme);
}

export async function mockApi(page: Page, options: { empty?: boolean; error?: boolean } = {}): Promise<void> {
  await page.route('**/api/v1/**', async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    if (options.error && path.endsWith('/interview-preparation/overview')) return fulfill(route, { message: 'Unavailable' }, 503);
    if (path.endsWith('/interview-preparation/overview')) return fulfill(route, options.empty ? { plans: [], unplannedApplications: [] } : overview);
    if (path.endsWith('/interview-preparation/templates')) return fulfill(route, templates);
    if (path.endsWith(`/interview-preparation/plans/${plan.id}`)) return fulfill(route, plan);
    if (path.endsWith('/interview-preparation/plans/preview')) return fulfill(route, request.postDataJSON());
    if (path.endsWith('/interview-preparation/plans')) return fulfill(route, plan, 201);
    if (path.includes('/readiness-snapshots')) return fulfill(route, snapshot, 201);
    if (path.includes('/tasks/') && path.endsWith('/complete')) return fulfill(route, { ...tasks[1], status: 'COMPLETED', completedAt: '2026-09-30T13:00:00.000Z', version: 1 });
    if (path.endsWith('/peer-sessions')) return fulfill(route, { id: '00000000-0000-4000-8000-000000000401', planId: plan.id, roundId: plan.rounds[0]!.id, organizer: { id: user.id, displayName: 'Alex Morgan' }, invitee: { id: '00000000-0000-4000-8000-000000000002', displayName: 'Taylor' }, status: 'PENDING', startsAt: '2026-10-02T18:00:00.000Z', timeZone: 'UTC', durationMinutes: 60, meetingUrl: 'https://meet.example.com/readiness', scorecards: [], version: 0, createdAt: '2026-09-30T12:00:00.000Z', updatedAt: '2026-09-30T12:00:00.000Z' }, 201);
    if (path.endsWith('/notifications/unread-count')) return fulfill(route, { unreadCount: 0 });
    if (path.endsWith('/interview-preparation/reminders/sync')) return fulfill(route, {}, 201);
    return fulfill(route, {});
  });
}
