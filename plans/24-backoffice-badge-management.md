# Backoffice: Badge Management

> **Status: TODO** — planned, not yet implemented.

The internal admin surface for defining badge criteria and manually granting/revoking badges. Backed by the admin endpoints in Plan 22.

## Proposed UI/UX Changes

### Admin Backoffice (`apps/admin`)

#### [NEW] `apps/admin/src/app/badges/page.tsx`
- **Badge directory:** responsive table / card stack listing each badge with icon, name, criteria type `Badge` (local `apps/admin/src/components/ui/Badge.tsx`), threshold, active `Toggle` (local `Toggle`), and award count. Mirrors `coding-problems/page.tsx`.
- **Create / Edit:** `Button` "New badge" opens a `Modal` (`@elevatesde/ui`) with `Input` (name, key, icon), `Textarea` (description), `Select` (criteria type), `Input` (threshold). Save calls `saveBadge()`.
- **Activate toggle:** local `Toggle` flips `isActive`.
- **Grant / Revoke:** a small "Manual grant" `Modal` with a user `Select`/search + badge `Select`; revoke from a user's badge list. Destructive revoke guarded by `ConfirmDialog`.
- Feedback via `useToastStore` (`apps/admin/src/store/toast.store.ts`).

#### [NEW] `apps/admin/src/store/badges.store.ts`
- Zustand store mirroring `coding-problems.store.ts`: state `{ badges, isModalOpen, editing, savingId, deletingId }`, actions `loadBadges()`, `saveBadge()`, `toggleActive()`, `removeBadge()`, `grant()`, `revoke()`. Calls `apps/admin/src/lib/badges-api.ts` over the shared `api` client (`apps/admin/src/lib/api.ts`).

#### [MODIFY] `apps/admin/src/components/AdminLayout.tsx`
- Add to `navItems`: `{ name: 'Badges', href: '/badges', icon: Medal }` (lucide `Medal`).

### Shared Types (`packages/shared-types`)
- Consume `BadgeDto`, `CreateBadgeDto`, `GrantBadgeDto`, `BadgeCriteriaType` from Plan 22.

## Backend Dependency
- Plan 22 admin endpoints under `/v1/admin/badges` (`@Roles(UserRole.ADMIN)`).

## Verification Plan

### Automated Checks
- `pnpm --filter @elevatesde/admin type-check`
- `pnpm --filter @elevatesde/admin lint`

### Manual Verification
- Sign in as `ADMIN`, open `http://localhost:3001/admin/badges`; create a badge, toggle active, edit, and confirm toast feedback.
- Manually grant the badge to a user and confirm it appears on their candidate `/dashboard/achievements`; revoke and confirm removal.
- Confirm a `USER` cannot reach the admin route.
