# Webclient: In-App Notification Center

> **Status: IN PROGRESS** — built on `feature/in-app-notifications`.

Candidate-facing bell + notification center, backed by the `notification` API (Plan 28). Polls unread count (~45s); no WebSocket in v1.

## Proposed UI/UX Changes (`apps/web`)

#### [NEW] `apps/web/src/store/notifications.store.ts`
- Zustand store mirroring `achievements.store.ts`: state `{ notifications, unreadCount, isLoading, hasLoaded }`; actions `fetchNotifications()`, `fetchUnreadCount()`, `markRead(id)`, `markAllRead()`, `startPolling()` / `stopPolling()` (~45s). Uses the shared `api` instance (`src/lib/api.ts`); errors surface via `useToastStore`.

#### [NEW] `apps/web/src/components/dashboard/NotificationItem.tsx`
- Single shared row reused by the bell dropdown and the full page (no duplicated markup). Resolves a `NotificationType → { icon, label, variant }` map (lucide icon + `Badge` variant). Renders unread dot, title, body, relative time; clicking navigates to `linkUrl` and marks read. Solid `--color-*` surfaces; no gradients/glassmorphism.

#### [NEW] `apps/web/src/components/dashboard/NotificationBell.tsx`
- Bell icon with an unread-count `Badge`; popover mirrors `UserMenu.tsx` (ref + click-outside + keyboard + `z-50`). Lists the most recent `NotificationItem`s with "Mark all read" and "View all" (→ `/dashboard/notifications`). Starts polling on mount, stops on unmount.

#### [MODIFY] `apps/web/src/components/dashboard/DashboardTopbar.tsx`
- Insert `<NotificationBell />` between the spacer `<div>` and `<UserMenu />`.

#### [NEW] `apps/web/src/app/dashboard/notifications/page.tsx`
- Client Component mirroring `achievements/page.tsx`: `PageHeader`, `Tabs` (All / Unread), list of `NotificationItem`, "Mark all read". Guard array access (`noUncheckedIndexedAccess`).

#### [MODIFY] `apps/web/src/lib/dashboard-nav.ts`
- Add `{ href: '/dashboard/notifications', label: 'Notifications', icon: Bell }`.

## Reusable Components
- `@elevatesde/ui`: `Badge` (type chip + unread count), `Button` (actions), `Tabs` (filter). No new primitives.

## Shared Types (`packages/shared-types`)
- Consume `NotificationDto`, `NotificationsViewDto`, `UnreadCountDto` from Plan 28.

## Backend Dependency
- Plan 28 endpoints under `/v1/notifications`.

## Verification Plan
### Automated Checks
- `pnpm --filter @elevatesde/web type-check && pnpm --filter @elevatesde/web lint`
### Manual Verification
- Sign in (`:3001`); trigger a notification (forum reply/badge) from another session; confirm the bell count increments within ~45s, the dropdown shows the item with the right icon/label, clicking deep-links and clears the dot, "mark all read" zeroes the count, and `/dashboard/notifications` Tabs filter correctly. Verify responsive + light/dark.
