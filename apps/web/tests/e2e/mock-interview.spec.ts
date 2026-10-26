import { expect, test, type Page, type Route } from '@playwright/test';
import type {
  MockInterviewHistoryDto,
  MockInterviewSessionDto,
  MockInterviewTurnDto,
  StartMockInterviewDto,
} from '@elevatesde/shared-types';
import { authenticate } from './readiness-fixtures';

const sessionId = '00000000-0000-4000-8000-000000000501';
const opening = 'Tell me about a time you disagreed with a teammate on a technical decision.';
const followUp = 'What would you do differently if you faced that same situation today?';
const answer = 'I proposed a design review, we measured both options, and shipped the faster one.';

function turn(ordinal: number, question: string, answered: boolean): MockInterviewTurnDto {
  return {
    id: `00000000-0000-4000-8000-00000000060${ordinal}`,
    ordinal,
    question,
    askedAt: '2026-10-25T10:00:00.000Z',
    answer: answered ? answer : null,
    answeredAt: answered ? '2026-10-25T10:02:00.000Z' : null,
    score: answered ? 67 : null,
    dimensionScores: answered ? { structure: 3, ownership: 3, impact: 2, communication: 4 } : null,
    feedback: answered ? 'Quantify the impact of the faster option.' : null,
  };
}

function session(overrides: Partial<MockInterviewSessionDto>, config: StartMockInterviewDto): MockInterviewSessionDto {
  return {
    id: sessionId,
    config: {
      topic: config.topic,
      roleLevel: config.roleLevel,
      companyStyle: config.companyStyle,
      durationMinutes: config.durationMinutes,
    },
    status: 'ACTIVE',
    engine: 'DETERMINISTIC',
    preparationTaskId: config.preparationTaskId ?? null,
    startedAt: new Date().toISOString(),
    deadlineAt: new Date(Date.now() + config.durationMinutes * 60_000).toISOString(),
    endedAt: null,
    turns: [turn(0, opening, false)],
    feedback: null,
    failureReason: null,
    version: 0,
    maxTurns: 12,
    ...overrides,
  };
}

async function fulfill(route: Route, body: unknown, status = 200): Promise<void> {
  await route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
}

async function mockInterviewApi(page: Page): Promise<{ startRequests: StartMockInterviewDto[] }> {
  const startRequests: StartMockInterviewDto[] = [];
  let current: MockInterviewSessionDto | null = null;
  let scoringPolls = 0;

  await page.route('**/api/v1/**', async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    if (path.endsWith('/mock-interviews/active')) return fulfill(route, current?.status === 'ACTIVE' ? current : null);
    if (path.endsWith('/mock-interviews') && request.method() === 'POST') {
      const body = request.postDataJSON() as StartMockInterviewDto;
      startRequests.push(body);
      current = session({}, body);
      return fulfill(route, current, 201);
    }
    if (path.endsWith('/mock-interviews') && request.method() === 'GET') {
      const history: MockInterviewHistoryDto = {
        items: current
          ? [
              {
                id: current.id,
                config: current.config,
                status: current.status,
                engine: current.engine,
                startedAt: current.startedAt,
                endedAt: current.endedAt,
                overallScore: current.feedback?.overallScore ?? null,
                answeredCount: current.turns.filter((item) => item.answer !== null).length,
              },
            ]
          : [],
        nextCursor: null,
      };
      return fulfill(route, history);
    }
    if (path.endsWith('/answer') && current) {
      const config = { ...current.config, preparationTaskId: current.preparationTaskId ?? undefined };
      current = session({ version: current.version + 1, turns: [turn(0, opening, true), turn(1, followUp, false)] }, config);
      return fulfill(route, current);
    }
    if (path.endsWith('/end') && current) {
      current = { ...current, status: 'SCORING', endedAt: new Date().toISOString(), version: current.version + 1, turns: current.turns.slice(0, 1) };
      return fulfill(route, current);
    }
    if (path.endsWith(`/mock-interviews/${sessionId}`) && current) {
      scoringPolls += 1;
      if (current.status === 'SCORING' && scoringPolls >= 1) {
        current = {
          ...current,
          status: 'COMPLETED',
          feedback: {
            overallScore: 67,
            competencies: [
              { key: 'structure', label: 'Structure (STAR)', score: 67, severity: 'warning' },
              { key: 'ownership', label: 'Ownership', score: 67, severity: 'warning' },
              { key: 'impact', label: 'Impact', score: 33, severity: 'critical' },
              { key: 'communication', label: 'Communication', score: 100, severity: 'good' },
            ],
            strengths: ['Clear, concise communication.'],
            improvements: ['Quantify the outcome of your decisions.'],
            summary: 'You answered 1 question and scored 67 overall.',
          },
        };
      }
      return fulfill(route, current);
    }
    if (path.endsWith('/notifications/unread-count')) return fulfill(route, { unreadCount: 0 });
    return fulfill(route, {});
  });

  return { startRequests };
}

test('runs a typed mock interview from setup to the scored report', async ({ context, page }) => {
  await authenticate(context);
  const api = await mockInterviewApi(page);
  await page.emulateMedia({ reducedMotion: 'reduce' });

  await page.goto('/dashboard/mock-interview?taskId=00000000-0000-4000-8000-000000000303&topic=BEHAVIORAL');
  await expect(page.getByText('This round is linked to your preparation plan.')).toBeVisible();
  await page.getByRole('button', { name: 'Start interview' }).click();

  await expect(page.getByText(opening)).toBeVisible();
  expect(api.startRequests[0]).toMatchObject({
    topic: 'BEHAVIORAL',
    preparationTaskId: '00000000-0000-4000-8000-000000000303',
  });

  await page.getByLabel('Your answer').fill(answer);
  await page.getByRole('button', { name: 'Send answer' }).click();
  await expect(page.getByText(followUp)).toBeVisible();
  await expect(page.getByText('Question 2 of up to 12')).toBeVisible();

  await page.getByRole('button', { name: 'End interview' }).click();
  await expect(page.getByRole('heading', { name: 'Interview feedback' })).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText('You answered 1 question and scored 67 overall.')).toBeVisible();
  await expect(page.getByText('Practice scoring:', { exact: false })).toBeVisible();
  await expect(page.getByText('Quantify the impact of the faster option.')).toBeVisible();

  await page.getByRole('link', { name: 'Past interviews' }).click();
  await expect(page.getByRole('heading', { name: 'Past interviews' })).toBeVisible();
  await expect(page.getByText('1 answered', { exact: false })).toBeVisible();
});
