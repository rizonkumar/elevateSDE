# Feature Plan: Earned Leaderboard Points + Background Scheduler

Makes the leaderboard reflect real activity and adds recurring background jobs for time-based state (period rollovers, streak expiry, contest finalization, interview-prep reminders).

---

## 1. Objectives

- Award points automatically for solving problems, completing the daily challenge, and finishing contests.
- Make every award idempotent so BullMQ retries (`attempts: 3`) can never double-count.
- Keep an auditable history of every point change (`PointLedger`).
- Roll weekly / monthly totals over on schedule, rebuilding them from the ledger, expire broken streaks nightly, finalize ended contests, and sweep interview-prep reminders server-side.
- Preserve the admin "set absolute points" UX while recording it as a ledger delta.

---

## 2. Point Rules (`POINT_RULES` in `@elevatesde/shared-types`)

| Source | refId | Delta |
|---|---|---|
| `PROBLEM_SOLVED` (first accept per problem) | problemId | EASY 10 / MEDIUM 20 / HARD 40, plus `assessmentsCompleted += 1` |
| `DAILY_CHALLENGE` | dailyChallengeId | 15 |
| `CONTEST_RESULT` (score > 0) | contestId | `round(score / 10)` plus a podium bonus of 50 / 30 / 20 |
| `ADMIN_ADJUSTMENT` | generated UUID | `target - current`; changes the all-time total only |

The rules are shared, so the web leaderboard's "How points work" panel reads the same constants.

---

## 3. Database Schema (Prisma)

- `enum PointSource { PROBLEM_SOLVED DAILY_CHALLENGE CONTEST_RESULT ADMIN_ADJUSTMENT }`
- `model PointLedger`:
  - fields: `id`, `userId`, `tenantId?`, `source`, `refId`, `delta`, `createdAt`
  - `@@unique([userId, source, refId])`, `@@index([userId, createdAt])`, `@@index([tenantId])`
- `Contest.finalizedAt DateTime?` with `@@index([finalizedAt, endsAt])`.
- `ContestParticipant`: add `finalRank?`, `finalScore?`, `finalPenaltySeconds?`.
- `InterviewPreparationPlan`: add `@@index([status, targetAt])` for the global reminder sweep.

Migrations:
- `20261004120000_points_ledger_and_contest_finalization`: schema.
- `20261004130000_backfill_point_ledger`: inserts zero-delta `PROBLEM_SOLVED` and `DAILY_CHALLENGE` rows for activity that happened before the ledger existed. Old solves are never re-awarded, and existing totals stay unchanged.

---

## 4. Backend

### Leaderboard
- `domain/entities/point-award.ts`: a value object with factories per source that encapsulate the rules.
- `domain/interfaces/point-ledger-repository.interface.ts` and `infrastructure/repositories/point-ledger.repository.ts`. The repository writes the ledger row and increments `UserStats` in one transaction. A unique-key violation means "already awarded" and returns `false`.
- `application/points.service.ts`: `awardProblemSolved`, `awardDailyChallenge`, `awardContestResults`, `adjustTo`, `refreshPeriodTotals`.
- `LeaderboardService.adjustPoints` now records the change through the ledger and only overwrites badges.
- **Admin adjustments are race-free.** `PointLedgerRepository.adjustTo` reads the current total with `SELECT … FOR UPDATE` inside the same transaction that writes the delta. A concurrent award is either already counted or waits until the adjustment commits.
- **Period rollovers can't lose ledger-recorded points.** `refreshPeriodTotals(period)` rebuilds `weeklyPoints` / `monthlyPoints` from the ledger since the start of the current UTC week or month, excluding admin adjustments. A late, retried or manual run therefore keeps points earned after the boundary.
  - Before this feature nothing increased `weeklyPoints` / `monthlyPoints`, so their existing values come only from seed data. The first rollover (or a manual run) normalizes them to the ledger, which is the intended source of truth.
  - The rebuild runs as a batch transaction, so it has no interactive timeout. Award transactions use explicit `maxWait` / `timeout` budgets.
  - The rebuild holds an exclusive Postgres advisory lock. Every award holds the shared side of the same lock, so no in-flight award is missed by the rebuild's snapshot.

### Award wiring
- `CodeExecutionProcessor` on ACCEPTED, in order:
  1. daily completion (awards the daily points)
  2. problem points
  3. achievement evaluation
  4. emit the event
- `DailyChallengeService.registerCompletion` awards daily points after recording a new completion.

### Contest finalization
- `contest/domain/contest-standings.ts`: a pure ranking function shared by live standings and finalization.
- `ContestFinalizationService.finalizeEnded(now)` only considers contests that ended more than 2 minutes ago, and defers any contest that still has queued or running submissions in its window. It then runs in this order:
  1. award points (idempotent, one participant at a time)
  2. persist final rank, score and penalty
  3. stamp `finalizedAt`
- Exact ties (same score and penalty) share a rank, so they also get the same podium bonus.

### Scheduler (new `scheduler` module)
- Queue `scheduled` (BullMQ job schedulers, so Redis deduplicates the schedules across instances).

  | Job | Cron (UTC) |
  |---|---|
  | `leaderboard.rollover-weekly` | `0 0 * * 1` |
  | `leaderboard.rollover-monthly` | `0 0 1 * *` |
  | `streaks.expire` | `5 0 * * *` |
  | `contests.finalize` | `*/5 * * * *` |
  | `preparation.reminders-sweep` | `0 8 * * *` |

- `SchedulerRegistrar` upserts the schedules on bootstrap and removes stale ones. Set `SCHEDULER_ENABLED=false` to opt out.
- `ScheduledJobRunner` maps each job name to its handler. `ScheduledJobsProcessor` delegates to it.
- `POST /api/v1/admin/scheduler/jobs/:job/run` (ADMIN only, audit logged) queues a one-off run.

---

## 5. Frontend

- `apps/web` leaderboard: a "How points work" disclosure driven by `POINT_RULES`.

---

## 6. Tests

- Points service:
  - difficulty mapping
  - idempotency
  - contest podium math
  - admin delta
- Daily challenge: daily award and streak expiry.
- Contest finalization: ranks persisted, points awarded, re-run is a no-op.
- Scheduler: registrar upsert/cleanup/disabled, runner dispatch, processor delegation.
- Code-execution processor: points awarded before achievements.
- `PointAward` domain rules, including clamping and period exclusion.
- Database-backed `PointLedgerRepository` spec, skipped by default. It covers atomic award and duplicate rejection, exact admin targets, period rebuild exclusions, and awards racing a rollover. Run it against a disposable database:
  `RUN_DATABASE_INTEGRATION=1 DATABASE_URL=<test db> pnpm --filter @elevatesde/api exec jest point-ledger.repository.integration`

---

## 7. Known Limitations / Follow-ups

- `ContestParticipant.final*` columns are persisted for future rating and history work. Standings are still computed live.

## 8. Out of Scope

- Badge key vs display-name mismatch between achievements and the admin leaderboard page.
- Contest rating (Elo).
- Points-history UI.
- Tenant-scoped leaderboards.
- Email delivery of reminders.

---

## 9. Progress

- [x] Schema + migration
- [x] Points ledger + service
- [x] Award wiring (processor, daily challenge)
- [x] Contest finalization
- [x] Streak expiry + reminder sweep
- [x] Scheduler module + admin trigger
- [x] Web "How points work"
- [x] Tests, lint, type-check, build
- [x] Code review fixes (grace period, pending-judging guard, tie ranks, sequential writes, ledger backfill, shared date helpers)
- [ ] Manual verification on seeded DB
