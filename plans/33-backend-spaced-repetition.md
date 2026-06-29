# Backend: Spaced-Repetition Review Queue

> **Status: TODO** — planned, not yet implemented.

Anki-style review scheduling that resurfaces previously solved problems on a forgetting curve. Fully in-house (Postgres + BullMQ). Builds on existing `Submission` history.

## Data Model (`apps/api/prisma/schema.prisma`)

- **[NEW] `ReviewItem`** — `id`, `userId` (FK → `User`), `problemId` (FK → `Problem`), `ease Float @default(2.5)`, `intervalDays Int @default(0)`, `repetitions Int @default(0)`, `dueAt DateTime`, `lastReviewedAt DateTime?`, `createdAt`. `@@unique([userId, problemId])`, `@@index([userId, dueAt])`.

## DDD Module (`apps/api/src/modules/review/`)
Mirror `modules/daily-challenge/`:
- `domain/entities/review-item.ts` — encapsulates SM-2/Leitner math: `applyRating(quality)` returns the next `ease`/`interval`/`dueAt`.
- `IReviewRepository`; Prisma repo + mappers.
- `application/review.service.ts` — `seedFromAcceptedSubmissions(userId)` (create `ReviewItem`s for newly solved problems), `dueToday(userId)`, `grade(userId, problemId, quality)`.
- `application/review-scheduler.ts` — optional BullMQ daily job to precompute due counts / seed from new ACCEPTED submissions (reuse `queues`).
- presentation controllers/dtos/mappers; `review.module.ts` registered in `app.module.ts`.

### Reuse (no duplication)
- Solved-problem source: existing `Submission` (status ACCEPTED). Seeding hooks the same accepted-submission path used by streaks/achievements (or subscribes to `SubmissionAcceptedEvent` from Plan 28).

## Endpoints (candidate, `JwtAuthGuard`)
- `GET /v1/review/due` → due items (problem summary + scheduling), `POST /v1/review/:problemId/grade` `{ quality }`.

## Shared Types
`ReviewItemDto`, `ReviewQuality`.

## Verification Plan
- `pnpm --filter @elevatesde/api type-check && lint`; unit spec for SM-2 interval/ease progression and due-date math.
- Manual: solve a problem (ACCEPTED) → confirm a `ReviewItem` is seeded; grade it and confirm `dueAt` advances per the algorithm.
