# Backoffice: Coding Contest Builder

> **Status: TODO** — planned, not yet implemented.

Admin surface to assemble, schedule, and publish contests from the existing `Problem` bank, backed by admin contest endpoints (Plan 30).

## Proposed UI/UX Changes (`apps/admin`)

#### [NEW] `apps/admin/src/app/admin/contests/page.tsx`
- Table of contests (status, window, participant count) with create/edit/publish/delete actions, mirroring `admin/coding-problems` and `admin/daily-challenges`.

#### [NEW] `apps/admin/src/app/admin/contests/[id]/page.tsx`
- Contest editor: title/description/window (DatePicker), problem picker from the `Problem` bank with per-problem `points` and `ordinal` reordering, publish toggle.

#### [NEW] `apps/admin/src/store/contests.store.ts`
- Zustand store using the admin `api` instance.

#### [MODIFY] admin nav
- Add a "Contests" entry alongside the existing problem/daily-challenge nav items.

## Endpoints (admin, `RolesGuard` + `@Roles(ADMIN)`)
- `GET/POST /v1/admin/contests`, `PATCH/DELETE /v1/admin/contests/:id`, `POST /v1/admin/contests/:id/problems`, `PATCH /v1/admin/contests/:id/publish`.

## Reusable Components
- `@elevatesde/ui` `DatePicker`, `Select`, `Button`, `Modal`, `ConfirmDialog`; the existing problem-picker pattern from the daily-challenge scheduler.

## Verification Plan
- `pnpm --filter @elevatesde/admin type-check && lint`.
- Manual: create a contest, attach problems with points, schedule a window, publish; confirm it appears in the candidate contest list (Plan 31).
