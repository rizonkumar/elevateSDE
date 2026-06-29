# Backend: In-App Notification Center

> **Status: IN PROGRESS** — built on `feature/in-app-notifications`.

An in-app notification system (no email/third-party). Existing flows emit domain events; a listener inside the `notification` module persists a `Notification` row for the recipient. Candidates read them via a bell + center. Email digests are explicitly out of scope (no provider wired).

## Data Model (`apps/api/prisma/schema.prisma`)

- **[NEW] enum `NotificationType`** — `BADGE_AWARDED`, `STREAK_MILESTONE`, `FORUM_REPLY`, `FORUM_UPVOTE`, `SUBMISSION_ACCEPTED`, `SYSTEM`.
- **[NEW] `Notification`** — `id`, `userId` (FK → `User`, recipient), `tenantId String?` (mirrors tenant convention), `type NotificationType`, `title`, `body`, `linkUrl String?` (deep link, e.g. `/dashboard/forum/:id`), `metadata Json?`, `readAt DateTime?`, `createdAt`. `@@index([userId, createdAt])`, `@@index([userId, readAt])`.
- **[NEW] `NotificationPreference`** — `id`, `userId` (FK → `User`), `type NotificationType`, `inAppEnabled Boolean @default(true)`. `@@unique([userId, type])`.
- **[MODIFY] `User`** — add `notifications Notification[]` and `notificationPreferences NotificationPreference[]`.

## DDD Module (`apps/api/src/modules/notification/`)

Mirror `modules/achievement/` exactly:
- `domain/entities/notification.ts` — private ctor + `create()` / `reconstitute()`; `markRead()` returns a new state.
- `domain/interfaces/notification-repository.interface.ts` — abstract class `INotificationRepository` (`create`, `listForUser(userId, paging)`, `countUnread(userId)`, `markRead(userId, id)`, `markAllRead(userId)`, `getPreferences(userId)`, `upsertPreference(userId, type, enabled)`).
- `domain/events/` — `BadgeAwardedEvent`, `StreakMilestoneEvent`, `ForumReplyEvent`, `ForumUpvoteEvent`, `SubmissionAcceptedEvent` (plain payload classes; `static readonly NAME`).
- `infrastructure/repositories/notification.repository.ts` + `infrastructure/mappers/notification.mapper.ts`.
- `application/notification.service.ts` — `listForUser`, `unreadCount`, `markRead`, `markAllRead`, `getPreferences`, `updatePreference`, and `notify(userId, type, {title, body, linkUrl, metadata})` (checks `NotificationPreference` before persisting).
- `application/listeners/notification.listener.ts` — `@OnEvent(...)` handlers mapping each event → `notificationService.notify(...)`. Centralizes title/body/linkUrl construction per type (single source, exhaustive switch).
- `presentation/controllers/notification.controller.ts`, presentation `mappers/`, `dtos/` (dates via `toISOString()`).
- `notification.module.ts` — bind `{ provide: INotificationRepository, useClass: NotificationRepository }`, provide `PrismaService`, register listener; register `EventEmitterModule.forRoot()` + `NotificationModule` in `app.module.ts`.

### Event emission (additive, 1 line per site — no logic moved)
Inject `EventEmitter2` and emit:
- `achievement/application/achievement.service.ts` `evaluate()` — on a newly awarded badge.
- `daily-challenge/application/daily-challenge.service.ts` `registerCompletion()` — on streak milestone.
- `forum/application/forum.service.ts` `addComment()` (notify post author, skip self) and `togglePostUpvote()`.
- `code-runner/.../code-execution.processor.ts` ACCEPTED branch — `SubmissionAcceptedEvent` (preference-gated, off by default).

## Endpoints (candidate, `JwtAuthGuard`, `req.user.getId()`)
- `GET /v1/notifications` (paginated) → `{ notifications, unreadCount }`
- `GET /v1/notifications/unread-count` → `{ unreadCount }`
- `PATCH /v1/notifications/:id/read`
- `POST /v1/notifications/read-all`
- `GET /v1/notifications/preferences` + `PATCH /v1/notifications/preferences`

## Shared Types (`packages/shared-types/src/index.ts`)
`NotificationType`, `NotificationDto`, `NotificationsViewDto`, `UnreadCountDto`, `NotificationPreferenceDto`.

## Future (out of scope here)
- Socket.io `NotificationsGateway` for live push (replaces frontend polling).
- Email/SES digest worker (BullMQ) once an email provider is wired.

## Verification Plan
### Automated Checks
- `pnpm --filter @elevatesde/api type-check && pnpm --filter @elevatesde/api lint`
- Unit spec `notification.service.spec.ts` (mirror `achievement.service.spec.ts`): preference gating, listener→notify mapping per type, mark-read / mark-all-read, unread count.
### Manual Verification
- Run the migration; confirm `Notification` / `NotificationPreference` tables exist.
- Trigger a forum reply / badge award; confirm a `Notification` row for the recipient and that `GET /v1/notifications` returns it with `unreadCount` incremented.
