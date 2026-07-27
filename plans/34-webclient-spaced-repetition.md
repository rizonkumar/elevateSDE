# Webclient: Spaced-Repetition Review Queue

> **Status: DONE** — implemented at `apps/web/src/app/dashboard/review/` with
> `review.store.ts`, `lib/review-api.ts`, and `components/dashboard/review/`.
>
> Notes on deviations from the original plan:
>
> - The plan called for reusing the profile heatmap to show "review history", but no endpoint
>   exposed it — `GET /v1/review/due` returns only items already due. Two changes cover it:
>   the existing `/v1/users/me/submission-heatmap` powers a "Practice activity" panel, and a new
>   additive `GET /v1/review/summary` endpoint (counts + 30-day due forecast) powers the stat
>   cards and an "Upcoming reviews" bar strip. No Prisma schema change or migration.
> - Rating buttons live inline on each queue card (Again/Hard/Good/Easy) with a secondary
>   "Solve" link into the existing assessment editor, rather than requiring a round trip through
>   the solve view first.
> - The sidebar shows a due-count pill on the Review row, fed by `loadSummary()`.

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
