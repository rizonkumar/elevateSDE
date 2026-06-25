# Webclient: Learning Paths / Prep Tracks

> **Status: TODO** — planned, not yet implemented.

The candidate-facing surface for browsing curated prep tracks, enrolling, and working through ordered modules with live progress. Backed by the `learning-path` API (Plan 25).

## Proposed UI/UX Changes

### Candidate Webclient (`apps/web`)

#### [NEW] `apps/web/src/app/dashboard/paths/page.tsx`
- **Browse grid:** responsive card grid of published paths showing title, level `Badge`, tags, total problems, and (if enrolled) a progress bar. Solid surface cards via `--color-*` tokens.
- **Filter:** by level using the `Select` component (`@elevatesde/ui`).

#### [NEW] `apps/web/src/app/dashboard/paths/[slug]/page.tsx`
- **Path detail:** header with title/description/level, overall progress bar, and an **Enroll** `Button` (becomes "Continue" once enrolled).
- **Modules:** ordered sections; each lists its problems with a solved check / open state and a link to `/dashboard/assessment/[id]`. "Resume where you left off" jumps to the first unsolved item.

#### [NEW] `apps/web/src/store/learning-paths.store.ts`
- Zustand store mirroring `job-tracker.store.ts`: state `{ paths, active, isLoading }`, actions `loadPaths()`, `loadPath(slug)`, `enroll(id)` against `/api/v1/learning-paths/*` via `apps/web/src/lib/api.ts`. Errors via `useToastStore`.

#### [MODIFY] `apps/web/src/lib/dashboard-nav.ts`
- Add `{ href: '/dashboard/paths', label: 'Prep Tracks', icon: Route }` (lucide `Route`).

### Shared Types (`packages/shared-types`)
- Consume `LearningPathDto`, `LearningPathDetailDto`, `PathProgressDto` from Plan 25.

## Backend Dependency
- Plan 25 endpoints `GET /v1/learning-paths`, `GET /v1/learning-paths/:slug`, `POST /v1/learning-paths/:id/enroll`.

## Verification Plan

### Automated Checks
- `pnpm --filter @elevatesde/web type-check`
- `pnpm --filter @elevatesde/web lint`

### Manual Verification
- Sign in as a USER, open `http://localhost:3001/dashboard/paths`; enroll in a path, open its detail, solve a problem via the linked editor, and confirm the progress bar advances.
- Confirm "Resume where you left off" targets the first unsolved item and the layout is responsive.
