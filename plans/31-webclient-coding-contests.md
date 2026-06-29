# Webclient: Coding Contests

> **Status: TODO** — planned, not yet implemented.

Candidate-facing contest list, detail/registration, in-contest solve view, and live standings, backed by the `contest` API (Plan 30). Standings poll for v1 (no WebSocket).

## Proposed UI/UX Changes (`apps/web`)

#### [NEW] `apps/web/src/app/dashboard/contests/page.tsx`
- Grid of contest cards (status `Badge`, countdown to start/end, problem count). Tabs for Upcoming / Live / Past.

#### [NEW] `apps/web/src/app/dashboard/contests/[slug]/page.tsx`
- Contest detail: description, problem list (locked until LIVE), Register button, live countdown. While LIVE, links each problem to the solve view.

#### [NEW] `apps/web/src/app/dashboard/contests/[slug]/[problemId]/page.tsx`
- Reuse the existing Monaco assessment editor + console components (no new editor). Submits to the contest endpoint.

#### [NEW] `apps/web/src/app/dashboard/contests/[slug]/standings/page.tsx`
- Ranked table reusing the leaderboard table styling; polls `GET /standings` (~15s while LIVE).

#### [NEW] `apps/web/src/store/contests.store.ts`
- Zustand store mirroring existing stores; uses shared `api`.

#### [MODIFY] `apps/web/src/lib/dashboard-nav.ts`
- Add `{ href: '/dashboard/contests', label: 'Contests', icon: Swords }`.

## Reusable Components
- Existing Monaco editor/console from the assessment feature, leaderboard table styling, `@elevatesde/ui` `Tabs`/`Badge`/`Button`.

## Backend Dependency
- Plan 30 contest endpoints.

## Verification Plan
- `pnpm --filter @elevatesde/web type-check && lint`.
- Manual: register for a LIVE contest, solve a problem in the reused editor, confirm standings update on poll; verify responsive + light/dark.
