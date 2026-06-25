# Backend: Daily Challenge & Streaks

> **Status: TODO** — planned, not yet implemented. First gamification feature to build.

The backend that schedules one coding problem per day and tracks each candidate's solving streak. Reuses the existing `Problem` bank (Plan 15/16) and the `UserStats` row (Plan 09 leaderboard). A candidate who gets an **ACCEPTED** submission on the day's problem advances their streak; missing a day resets it.

## Data Model (`apps/api/prisma/schema.prisma`)

- **[NEW] `DailyChallenge`** — `id`, `challengeDate DateTime @db.Date`, `problemId` (FK → `Problem`), `tenantId String?` (null = global), `createdAt`. `@@unique([challengeDate, tenantId])` so each tenant/global scope has one problem per date. Index `challengeDate`.
- **[NEW] `DailyChallengeCompletion`** — `id`, `userId` (FK → `User`), `dailyChallengeId` (FK → `DailyChallenge`), `submissionId` (FK → `Submission`), `completedAt`. `@@unique([userId, dailyChallengeId])`.
- **[MODIFY] `UserStats`** — add `longestStreak Int @default(0)` and `lastActiveDate DateTime? @db.Date`. Keep the existing `streakDays` as the **current** streak (currently unused — this feature activates it).

## DDD Module (`apps/api/src/modules/daily-challenge/`)

Mirror the `modules/leaderboard/` layout exactly:

- `domain/entities/daily-challenge.ts`, `domain/entities/streak-state.ts` (encapsulates the advance/reset rules), `domain/interfaces/daily-challenge-repository.interface.ts`.
- `infrastructure/repositories/daily-challenge.repository.ts` (+ `mappers/`). Reuse the `upsert()` write pattern from `leaderboard.repository.ts` for `UserStats`.
- `application/daily-challenge.service.ts` — `getToday(tenantId)`, `getStreakSummary(userId)` (current + longest + calendar cells), `registerCompletion(userId, problemId, submissionId)` (the streak hook), admin `schedule(dto)` / `unschedule(id)` / `listSchedule(range)`.
- `presentation/controllers/daily-challenge.controller.ts` and `daily-challenge-management.controller.ts`, plus `dtos/` and presentation `mappers/`.
- `daily-challenge.module.ts`, registered in `app.module.ts`.

### Streak hook (decision: direct service call)

`code-runner` records submissions but never touches `UserStats` today. In `code-runner.service.ts` (or `assessments.controller.ts` after `SubmissionService.record()`), when a submission resolves to `ACCEPTED` **and** its `problemId` matches today's `DailyChallenge`, call `DailyChallengeService.registerCompletion(...)`. Streak rules in `streak-state.ts`:
- `lastActiveDate == today` → no-op (already counted).
- `lastActiveDate == yesterday` → `streakDays += 1`.
- otherwise → `streakDays = 1`.
- always `longestStreak = max(longestStreak, streakDays)`, set `lastActiveDate = today`, upsert `UserStats`, insert `DailyChallengeCompletion`.

This mirrors the "stats written synchronously" reality. An `@nestjs/event-emitter` `SubmissionAcceptedEvent` is a documented follow-up (also consumed by Plan 22 badges) — out of scope for the first cut.

## Endpoints

Candidate (`@UseGuards(JwtAuthGuard)`):
- `GET /v1/daily-challenge/today` → today's problem summary + whether the viewer completed it.
- `GET /v1/daily-challenge/streak` → `{ current, longest, lastActiveDate, calendar: { date, completed }[] }` for the last ~120 days.

Admin (`@UseGuards(JwtAuthGuard, RolesGuard)` + `@Roles(UserRole.ADMIN)`, path `admin/daily-challenges`):
- `GET /v1/admin/daily-challenges?from=&to=` list schedule with participation counts.
- `POST /v1/admin/daily-challenges` `{ challengeDate, problemId }`.
- `DELETE /v1/admin/daily-challenges/:id`.

## Shared Types (`packages/shared-types/src/index.ts`)

`DailyChallengeDto`, `StreakSummaryDto`, `StreakCalendarCellDto`, `DailyChallengeScheduleDto`, `CreateDailyChallengeDto`.

## Verification Plan

### Automated Checks
- `pnpm --filter @elevatesde/api type-check && pnpm --filter @elevatesde/api lint`
- Unit spec `daily-challenge.service.spec.ts` mirroring `leaderboard.service.spec.ts`: covers same-day no-op, consecutive-day increment, gap reset, `longestStreak` tracking.

### Manual Verification
- Run the Prisma migration; confirm `DailyChallenge`, `DailyChallengeCompletion` tables and `UserStats.longestStreak` / `lastActiveDate` columns exist.
- Seed today's `DailyChallenge`, submit an ACCEPTED solution as a USER, confirm `streakDays` → 1 and a completion row is written; resubmit and confirm no double-count.
