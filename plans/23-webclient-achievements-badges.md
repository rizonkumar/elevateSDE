# Webclient: Achievements & Badges

> **Status: TODO** — planned, not yet implemented.

The candidate-facing badge showcase, backed by the `achievement` API (Plan 22). Shows earned badges, locked badges with progress-to-next, and surfaces an unlock toast.

## Proposed UI/UX Changes

### Candidate Webclient (`apps/web`)

#### [NEW] `apps/web/src/app/dashboard/achievements/page.tsx`
- **Badge grid:** responsive grid of badge cards. Earned badges render in full color with `awardedAt`; locked badges render muted with a thin progress bar (`progress / threshold`) and the criteria label. Solid surface cards via `--color-*` tokens — no gradients/glassmorphism.
- **Header summary:** earned count vs total, using the `PageHeader` component (`apps/web/src/components/dashboard/PageHeader.tsx`).
- Badge icon resolves a lucide icon by name (fallback emoji).

#### [NEW] `apps/web/src/store/achievements.store.ts`
- Zustand store mirroring `job-tracker.store.ts`: state `{ earned, locked, isLoading }`, action `load()` against `/api/v1/achievements` via `apps/web/src/lib/api.ts`. New unlocks since last load fire `useToastStore.addToast('Badge unlocked: …', 'success')`.

#### [MODIFY] `apps/web/src/lib/dashboard-nav.ts`
- Add `{ href: '/dashboard/achievements', label: 'Achievements', icon: Award }` (lucide `Award`).

### Shared Types (`packages/shared-types`)
- Consume `AchievementsViewDto`, `BadgeDto`, `UserBadgeDto` from Plan 22.

## Backend Dependency
- Plan 22 endpoint `GET /v1/achievements`.

## Verification Plan

### Automated Checks
- `pnpm --filter @elevatesde/web type-check`
- `pnpm --filter @elevatesde/web lint`

### Manual Verification
- Sign in as a USER, open `http://localhost:3001/dashboard/achievements`; confirm earned and locked badges render with correct progress bars.
- Earn a new badge (e.g. solve enough problems) and confirm the unlock toast appears on next load.
- Verify responsive layout across mobile/tablet/desktop.
