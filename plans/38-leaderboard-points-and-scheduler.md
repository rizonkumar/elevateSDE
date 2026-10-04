# Feature Plan: Earned Leaderboard Points + Background Scheduler

Makes the leaderboard reflect real activity and adds recurring background jobs for time-based state (period resets, streak expiry, contest finalization, interview-prep reminders).

---

## 1. Objectives

- Award points automatically for solving problems, completing the daily challenge, and finishing contests.
- Make every award idempotent so BullMQ retries (`attempts: 3`) can never double-count.
- Keep an auditable history of every point change (`PointLedger`).
- Reset weekly / monthly totals on schedule, expire broken streaks nightly, finalize ended contests, and sweep interview-prep reminders server-side.
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

Migration: `20261004120000_points_ledger_and_contest_finalization`.

---

## 4. Backend

### Leaderboard
- `domain/entities/point-award.ts`: a value object with factories per source that encapsulate the rules.
- `domain/interfaces/point-ledger-repository.interface.ts` and `infrastructure/repositories/point-ledger.repository.ts`. The repository writes the ledger row and increments `UserStats` in one transaction. A unique-key violation means "already awarded" and returns `false`.
- `application/points.service.ts`: `awardProblemSolved`, `awardDailyChallenge`, `awardContestResults`, `adjustTo`, `resetWeekly`, `resetMonthly`.
- `LeaderboardService.adjustPoints` now records the change through the ledger and only overwrites badges.

### Award wiring
- `CodeExecutionProcessor` on ACCEPTED, in order:
  1. daily completion (awards the daily points)
  2. problem points
  3. achievement evaluation
  4. emit the event
- `DailyChallengeService.registerCompletion` awards daily points after recording a new completion.

### Contest finalization
- `contest/domain/contest-standings.ts`: a pure ranking function shared by live standings and finalization.
- `ContestFinalizationService.finalizeEnded(now)` runs in this order:
  1. award points (idempotent)
  2. persist final rank, score and penalty
  3. stamp `finalizedAt`

### Scheduler (new `scheduler` module)
- Queue `scheduled` (BullMQ job schedulers, so Redis deduplicates the schedules across instances).

  | Job | Cron (UTC) |
  |---|---|
  | `leaderboard.reset-weekly` | `0 0 * * 1` |
  | `leaderboard.reset-monthly` | `0 0 1 * *` |
  | `streaks.expire` | `5 0 * * *` |
  | `contests.finalize` | `*/5 * * * *` |
  | `preparation.reminders-sweep` | `0 * * * *` |

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

---

## 7. Out of Scope

- Badge key vs display-name mismatch between achievements and the admin leaderboard page.
- Contest rating (Elo).
- Points-history UI.
- Tenant-scoped leaderboards.
- Email delivery of reminders.

---

## 8. Progress

- [x] Schema + migration
- [ ] Points ledger + service
- [ ] Award wiring (processor, daily challenge)
- [ ] Contest finalization
- [ ] Streak expiry + reminder sweep
- [ ] Scheduler module + admin trigger
- [ ] Web "How points work"
- [ ] Tests, lint, type-check, build
- [ ] Manual verification on seeded DB
