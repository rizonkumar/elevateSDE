# Backend: Achievements & Badges

> **Status: TODO** — planned, not yet implemented.

A badge/achievement engine on top of the existing `UserStats.badges String[]` field (currently a bare, manually-set array). Admins define badges with unlock criteria; candidates earn them automatically as they solve problems, build streaks, and post in the forum.

## Data Model (`apps/api/prisma/schema.prisma`)

- **[NEW] enum `BadgeCriteriaType`** — `PROBLEMS_SOLVED`, `STREAK_DAYS`, `ASSESSMENTS_COMPLETED`, `FORUM_POSTS`, `POINTS`.
- **[NEW] `Badge`** — `id`, `key String @unique`, `name`, `description`, `icon` (lucide name or emoji), `criteriaType BadgeCriteriaType`, `threshold Int`, `tenantId String?` (null = global), `isActive Boolean @default(true)`, `createdAt`, `updatedAt`.
- **[NEW] `UserBadge`** — `id`, `userId` (FK → `User`), `badgeId` (FK → `Badge`), `awardedAt`. `@@unique([userId, badgeId])`.

`UserBadge` is the **source of truth**. `UserStats.badges String[]` is kept in sync (badge `key`s) so the existing leaderboard display (Plan 09/18) keeps working unchanged.

## DDD Module (`apps/api/src/modules/achievement/`)

Mirror `modules/leaderboard/`:
- `domain/entities/badge.ts`, `domain/entities/user-badge.ts`, `domain/interfaces/achievement-repository.interface.ts`.
- `infrastructure/repositories/achievement.repository.ts` (+ mappers).
- `application/achievement.service.ts` — `listForUser(userId)` (earned + locked with progress vs threshold), `evaluate(userId)` (the award engine: read the user's current metrics, award any newly-qualified active badges, sync `UserStats.badges`), admin `create/update/delete(dto)`, `grant(userId, badgeId)`, `revoke(userId, badgeId)`.
- `presentation/controllers/achievement.controller.ts` + `badge-management.controller.ts`, `dtos/`, presentation `mappers/`.
- `achievement.module.ts`, registered in `app.module.ts`.

### Award trigger (reuse the Plan 19 hook)
Call `AchievementService.evaluate(userId)` from the same accepted-submission path that drives streaks (Plan 19), and additionally after a forum post is created (`modules/forum`). Metrics read from `UserStats` (`points`, `assessmentsCompleted`, `streakDays`) and counts (problems solved, forum posts). When `@nestjs/event-emitter` lands (Plan 19 follow-up), both streaks and achievements subscribe to `SubmissionAcceptedEvent` instead of direct calls — noted as the migration path.

## Endpoints
- Candidate (`JwtAuthGuard`): `GET /v1/achievements` → `{ earned: [...], locked: [{ ...badge, progress, threshold }] }`.
- Admin (`JwtAuthGuard, RolesGuard`, `@Roles(UserRole.ADMIN)`, path `admin/badges`): `GET /`, `POST /`, `PATCH /:id`, `DELETE /:id`, `POST /grant` `{ userId, badgeId }`, `POST /revoke` `{ userId, badgeId }`.

## Shared Types (`packages/shared-types/src/index.ts`)
`BadgeDto`, `UserBadgeDto`, `AchievementsViewDto`, `BadgeCriteriaType`, `CreateBadgeDto`, `GrantBadgeDto`.

## Verification Plan

### Automated Checks
- `pnpm --filter @elevatesde/api type-check && pnpm --filter @elevatesde/api lint`
- Unit spec `achievement.service.spec.ts`: threshold crossing awards exactly once, locked-progress math, `UserStats.badges` sync, manual grant/revoke.

### Manual Verification
- Run the migration; confirm `Badge` / `UserBadge` tables exist.
- Define a `PROBLEMS_SOLVED` threshold-1 badge; submit an ACCEPTED solution as a USER; confirm a `UserBadge` row and the `key` appearing in `UserStats.badges`.
- Confirm `GET /v1/achievements` returns it as earned and other badges as locked with progress.
