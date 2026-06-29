# Webclient: Spaced-Repetition Review Queue

> **Status: TODO** — planned, not yet implemented.

Candidate "Due today" review surface backed by the `review` API (Plan 33).

## Proposed UI/UX Changes (`apps/web`)

#### [NEW] `apps/web/src/app/dashboard/review/page.tsx`
- "Due today" list/queue: each due item shows the problem summary, difficulty `Badge`, and a "Review" action that opens the existing assessment solve view. After solving, present self-rating buttons (Again / Hard / Good / Easy) that call `grade`. Reuse the GitHub-style heatmap component from the profile page to visualize review history/consistency.
- Empty state when nothing is due.

#### [NEW] `apps/web/src/store/review.store.ts`
- Zustand store (state `{ due, isLoading }`, actions `loadDue()`, `grade(problemId, quality)`) on the shared `api`.

#### [MODIFY] `apps/web/src/lib/dashboard-nav.ts`
- Add `{ href: '/dashboard/review', label: 'Review', icon: Repeat }`.

## Reusable Components
- Existing Monaco assessment editor/console, the profile heatmap component, `@elevatesde/ui` `Button`/`Badge`.

## Backend Dependency
- Plan 33 `/v1/review` endpoints.

## Verification Plan
- `pnpm --filter @elevatesde/web type-check && lint`.
- Manual: with seeded review items, open `/dashboard/review`, review one, rate it, confirm it leaves the due list and `dueAt` advances. Verify responsive + light/dark.
