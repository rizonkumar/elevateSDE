# Backend: Coding Contests

> **Status: TODO** — planned, not yet implemented.

Time-boxed competitions over the existing `Problem` bank, graded by the existing `code-runner` sandbox, with a penalty-based ranked leaderboard. Fully in-house (Postgres + BullMQ + Docker sandbox).

## Data Model (`apps/api/prisma/schema.prisma`)

- **[NEW] enum `ContestStatus`** — `DRAFT`, `SCHEDULED`, `LIVE`, `ENDED`.
- **[NEW] `Contest`** — `id`, `slug @unique`, `title`, `description`, `startsAt`, `endsAt`, `status ContestStatus`, `tenantId String?`, `createdAt`, `updatedAt`. `@@index([status, startsAt])`.
- **[NEW] `ContestProblem`** — `id`, `contestId` (FK), `problemId` (FK → `Problem`), `ordinal`, `points`. `@@unique([contestId, problemId])`.
- **[NEW] `ContestParticipant`** — `id`, `contestId` (FK), `userId` (FK), `registeredAt`, `score Int @default(0)`, `penaltySeconds Int @default(0)`. `@@unique([contestId, userId])`, `@@index([contestId, score])`.
- **[NEW] `ContestSubmission`** — `id`, `contestId` (FK), `problemId` (FK), `userId` (FK), `submissionId` (FK → `Submission`), `accepted Boolean`, `attemptedAt`. `@@index([contestId, userId, problemId])`.

## DDD Module (`apps/api/src/modules/contest/`)
Mirror `modules/daily-challenge/`:
- domain entities (`contest.ts`, scoring value objects), `IContestRepository`.
- `application/contest.service.ts` — `register(userId, contestId)`, `listProblems(contestId)`, `submit(...)` (delegates to the existing assessment submit/`code-runner` flow, then records a `ContestSubmission` and recomputes the participant's score/penalty), `standings(contestId)` (ranked by score desc, penalty asc).
- `application/contest-scheduler.ts` — BullMQ delayed jobs flip `SCHEDULED → LIVE → ENDED` at `startsAt`/`endsAt` (reuse the `queues` module).
- presentation controllers/dtos/mappers; `contest.module.ts` registered in `app.module.ts`.

### Reuse (no duplication)
- Grading: existing `code-runner` sandbox + `Submission` pipeline (do not re-implement execution).
- Ranking display patterns: `modules/leaderboard`.

## Endpoints
- Candidate (`JwtAuthGuard`): `GET /v1/contests`, `GET /v1/contests/:slug`, `POST /v1/contests/:slug/register`, `POST /v1/contests/:slug/problems/:problemId/submit`, `GET /v1/contests/:slug/standings`.
- Admin: see Plan 32.

## Shared Types
`ContestDto`, `ContestProblemDto`, `ContestStandingRowDto`, `ContestStatus`.

## Verification Plan
- `pnpm --filter @elevatesde/api type-check && lint`; unit spec for scoring/penalty math and status transitions.
- Manual: schedule a contest in the past/now, register, submit an ACCEPTED solution, confirm standings reflect score + penalty and status auto-transitions.
