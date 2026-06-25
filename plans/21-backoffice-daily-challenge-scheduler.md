# Backoffice: Daily Challenge Scheduler

> **Status: TODO** — planned, not yet implemented. First gamification feature to build.

The internal admin surface for scheduling which published `Problem` runs as the daily challenge on each date, and reviewing participation. Backed by the admin endpoints in Plan 19.

## Proposed UI/UX Changes

### Admin Backoffice (`apps/admin`)

#### [NEW] `apps/admin/src/app/daily-challenges/page.tsx`
- **Schedule list:** responsive table (desktop) / card stack (mobile) of scheduled dates showing date, problem title, difficulty `Badge` (local `apps/admin/src/components/ui/Badge.tsx`), and completion count. Mirrors the `users/page.tsx` / `coding-problems/page.tsx` table pattern.
- **Schedule control:** `Button` "Schedule a day" opens a `Modal` (`@elevatesde/ui`) with a `DatePicker` (date) + `Select` listing **published** problems. Save calls `createDailyChallenge()`.
- **Unschedule:** `ConfirmDialog` (`@elevatesde/ui`) guarding removal of a future-dated entry.
- **Range filter:** simple from/to controls to page through past/upcoming weeks. Success/error via `useToastStore` (`apps/admin/src/store/toast.store.ts`).

#### [NEW] `apps/admin/src/store/daily-challenges.store.ts`
- Zustand store mirroring `coding-problems.store.ts`: state `{ schedule, range, isModalOpen, savingId, deletingId }`, actions `loadSchedule()`, `createDailyChallenge()`, `removeDailyChallenge()`. Calls a thin `apps/admin/src/lib/daily-challenges-api.ts` wrapper over the shared `api` client (`apps/admin/src/lib/api.ts`).

#### [MODIFY] `apps/admin/src/components/AdminLayout.tsx`
- Add to `navItems`: `{ name: 'Daily Challenges', href: '/daily-challenges', icon: CalendarDays }` (lucide `CalendarDays`).

### Shared Types (`packages/shared-types`)
- Consume `DailyChallengeScheduleDto`, `CreateDailyChallengeDto` from Plan 19.

## Backend Dependency
- Plan 19 admin endpoints under `/v1/admin/daily-challenges` (`@Roles(UserRole.ADMIN)`).

## Verification Plan

### Automated Checks
- `pnpm --filter @elevatesde/admin type-check`
- `pnpm --filter @elevatesde/admin lint`

### Manual Verification
- Sign in as `ADMIN`, open `http://localhost:3001/admin/daily-challenges`; schedule a published problem for today and confirm it appears in the list.
- Open the candidate `/dashboard/daily` and confirm the scheduled problem is today's challenge.
- Remove a future entry via the confirm dialog; confirm a `USER` cannot reach the admin route (middleware redirect to `/login`).
