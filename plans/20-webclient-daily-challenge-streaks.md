# Webclient: Daily Challenge & Streaks

> **Status: TODO** — planned, not yet implemented. First gamification feature to build.

The candidate-facing surface for the daily coding challenge and streak tracking, backed by the `daily-challenge` API (Plan 19). Shows today's problem, the current/longest streak, and a contribution-style calendar of solved days.

## Proposed UI/UX Changes

### Candidate Webclient (`apps/web`)

#### [NEW] `apps/web/src/app/dashboard/daily/page.tsx`
- **Today's Challenge card:** problem title, difficulty `Badge` (from `@elevatesde/ui`), tags, and a `Button` "Solve Challenge" linking to `/dashboard/assessment/[id]` (existing code editor, Plan 08). When already completed, show a solved check state instead of the button.
- **Streak summary:** current streak with a `Flame` (lucide) counter and a "Longest: N days" stat. Solid surface cards using `--color-*` tokens — no gradients/glassmorphism.
- **Contribution calendar:** a custom CSS-grid heatmap (last ~17 weeks) where each cell is shaded by completion. Built as a plain grid (not recharts) — simpler and lighter than `RadialBarChart`; one `<div>` per day with a token-driven background and a title tooltip.

#### [NEW] `apps/web/src/components/dashboard/DailyChallengeWidget.tsx`
- Compact card for the main dashboard (`apps/web/src/app/dashboard/page.tsx`): today's problem + streak count + link to `/dashboard/daily`. Reuses the existing dashboard card styling.

#### [NEW] `apps/web/src/store/daily-challenge.store.ts`
- Zustand store mirroring `job-tracker.store.ts`: state `{ today, streak, isLoading }`, actions `loadToday()`, `loadStreak()`. Calls the axios client `apps/web/src/lib/api.ts` against `/api/v1/daily-challenge/*`. Errors surface via `useToastStore` (`apps/web/src/store/toast.store.ts`).

#### [MODIFY] `apps/web/src/lib/dashboard-nav.ts`
- Add `{ href: '/dashboard/daily', label: 'Daily Challenge', icon: Flame }` to `buildNavLinks()` (lucide `Flame`), placed near Leaderboard.

### Shared Types (`packages/shared-types`)
- Consume `DailyChallengeDto`, `StreakSummaryDto`, `StreakCalendarCellDto` added in Plan 19.

## Backend Dependency
- Plan 19 endpoints `GET /v1/daily-challenge/today` and `GET /v1/daily-challenge/streak`.

## Verification Plan

### Automated Checks
- `pnpm --filter @elevatesde/web type-check`
- `pnpm --filter @elevatesde/web lint`

### Manual Verification
- Sign in as a USER, open `http://localhost:3001/dashboard/daily`; confirm today's problem renders and "Solve Challenge" opens the editor.
- Get an ACCEPTED submission; return and confirm the streak increments and today's calendar cell fills.
- Confirm the dashboard widget and the new nav item appear and the page is fully responsive (mobile → desktop).
