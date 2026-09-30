import { expect, test } from '@playwright/test';
import { authenticate, mockApi, plan } from './readiness-fixtures';

test.beforeEach(async ({ context, page }) => {
  await authenticate(context);
  await mockApi(page);
});

test('creates a guided plan and opens the durable detail route', async ({ page }) => {
  await page.goto('/dashboard/interview-readiness?application=00000000-0000-4000-8000-000000000011');
  await expect(page.getByRole('dialog', { name: 'Build your interview plan' })).toBeVisible();
  await page.getByRole('button', { name: 'Review rounds' }).click();
  await expect(page.getByRole('dialog', { name: 'Confirm your interview loop' })).toBeVisible();
  await page.getByRole('button', { name: 'Create plan' }).click();
  await expect(page).toHaveURL(new RegExp(`/dashboard/interview-readiness/${plan.id}$`));
  await expect(page.getByRole('heading', { name: plan.company })).toBeVisible();
  await page.reload();
  await expect(page.getByText('76', { exact: true }).first()).toBeVisible();
});

test('shows a useful empty state', async ({ context, page }) => {
  await page.unrouteAll();
  await authenticate(context);
  await mockApi(page, { empty: true });
  await page.goto('/dashboard/interview-readiness');
  await expect(page.getByRole('heading', { name: 'Build your first readiness plan' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Track an application first' })).toBeVisible();
});

test('updates a task optimistically and refreshes evidence', async ({ page }) => {
  await page.goto(`/dashboard/interview-readiness/${plan.id}`);
  const task = page.getByRole('button', { name: 'Complete Review due coding problems' });
  await task.click();
  await expect(page.getByText('Review due coding problems')).toHaveClass(/line-through/);
});

test('schedules peer practice with an external room', async ({ page }) => {
  await page.goto(`/dashboard/interview-readiness/${plan.id}`);
  await page.getByRole('button', { name: 'Schedule' }).click();
  await page.getByLabel('Candidate email').fill('peer@example.com');
  await page.getByLabel('HTTPS meeting link').fill('https://meet.example.com/readiness');
  await page.getByRole('button', { name: 'Send invitation' }).click();
  await expect(page.getByText('Taylor')).toBeVisible();
});

test('homepage leads with interview readiness and remains responsive', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Know what to prepare next' })).toBeVisible();
  await expect(page.getByRole('link', { name: /Build your readiness plan/ })).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  expect(overflow).toBe(false);
});
