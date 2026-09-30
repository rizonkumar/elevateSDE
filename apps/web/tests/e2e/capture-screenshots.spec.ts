import path from 'node:path';
import { expect, test } from '@playwright/test';
import { authenticate, mockApi, plan } from './readiness-fixtures';

const output = path.resolve(process.cwd(), 'public/screenshots');

for (const theme of ['light', 'dark'] as const) {
  test(`captures ${theme} marketing and readiness screens`, async ({ context, page }) => {
    await authenticate(context, theme);
    await mockApi(page);
    await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: theme });
    await page.setViewportSize({ width: 1440, height: 900 });

    await page.goto(`/dashboard/interview-readiness/${plan.id}`);
    await expect(page.getByRole('heading', { name: plan.company })).toBeVisible();
    await page.evaluate(async () => document.fonts.ready);
    await page.screenshot({ path: path.join(output, `interview-readiness-${theme}.png`) });

    await page.goto('/');
    const heading = page.getByRole('heading', { name: 'Elevate your software engineering career' });
    await expect(heading).toBeVisible();
    await expect(heading).toHaveCSS('opacity', '1');
    await page.evaluate(async () => document.fonts.ready);
    await page.screenshot({ path: path.join(output, `homepage-${theme}.png`) });
  });
}
