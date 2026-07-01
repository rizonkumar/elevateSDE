# Backend: Problem Discussions + Bookmarks, Notes & Lists

> **Status: DONE** — implemented as the `problem-social` DDD module (`apps/api/src/modules/problem-social/`).
>
> Notes on deviations from the original plan:
> - The custom-list shared types are named **`ProblemCollectionDto` / `ProblemCollectionItemDto`** (not `ProblemListDto` / `ProblemListItemDto`) because `ProblemListDto` already exists in `@elevatesde/shared-types` as the paginated problem bank. User-facing routes still read `/v1/me/lists`.
> - Discussion **notifications were deferred** — the forum's `FORUM_UPVOTE` / `FORUM_REPLY` events are not mirrored for discussions yet.
> - The vote/threading logic is not extracted into a cross-module helper (Prisma delegate generics would force `any`); duplication is instead avoided within the module via a single `applyToggle` control-flow helper plus batch voted-id set builders that mirror the forum repository.

Per-problem community discussion plus personal curation (bookmarks, private notes, custom problem lists). Fully in-house (Postgres only). Discussion reuses the existing `forum` voting/threading patterns scoped to a `problemId`.

## Data Model (`apps/api/prisma/schema.prisma`)

- **[NEW] `ProblemDiscussion`** — `id`, `problemId` (FK → `Problem`), `userId` (FK → `User`), `title`, `body`, `createdAt`, `updatedAt`. `@@index([problemId, createdAt])`. (Comments/votes reuse the same shape as `ForumComment`/`ForumPostVote`, scoped to discussions.)
- **[NEW] `Bookmark`** — `id`, `userId` (FK), `problemId` (FK), `createdAt`. `@@unique([userId, problemId])`.
- **[NEW] `ProblemNote`** — `id`, `userId` (FK), `problemId` (FK), `body`, `updatedAt`. `@@unique([userId, problemId])` (one private note per user/problem).
- **[NEW] `ProblemList`** — `id`, `userId` (FK), `name`, `isPublic Boolean @default(false)`, `createdAt`.
- **[NEW] `ProblemListItem`** — `id`, `listId` (FK → `ProblemList`), `problemId` (FK), `ordinal`. `@@unique([listId, problemId])`.

## DDD Module (`apps/api/src/modules/problem-social/`)
- domain entities + `IProblemSocialRepository`; Prisma repo + mappers.
- `application/problem-social.service.ts` — discussion CRUD + voting (delegating to shared forum vote logic to avoid duplication), `toggleBookmark`, `upsertNote`, list CRUD + add/remove/reorder items.
- presentation controllers/dtos/mappers; module registered in `app.module.ts`.

### Reuse (no duplication)
- Extract the forum's vote/threading helpers for shared use rather than copying; the `Problem` summary mapper from `modules/problem`.

## Endpoints (candidate, `JwtAuthGuard`)
- Discussions: `GET /v1/problems/:id/discussions`, `POST /v1/problems/:id/discussions`, comment + upvote routes mirroring forum.
- Bookmarks: `POST /v1/problems/:id/bookmark` (toggle), `GET /v1/me/bookmarks`.
- Notes: `GET/PUT /v1/problems/:id/note`.
- Lists: `GET/POST /v1/me/lists`, `PATCH/DELETE /v1/me/lists/:id`, `POST/DELETE /v1/me/lists/:id/items`.

## Shared Types
`ProblemDiscussionDto`, `BookmarkDto`, `ProblemNoteDto`, `ProblemListDto`, `ProblemListItemDto`.

## Verification Plan
- `pnpm --filter @elevatesde/api type-check && lint`; unit spec for bookmark toggle idempotency, note upsert, list reordering.
- Manual: create a discussion on a problem, bookmark it, save a note, add it to a custom list; confirm all read back correctly.
