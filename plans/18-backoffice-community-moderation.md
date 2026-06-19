# Backoffice: Community Moderation & Leaderboard Management

The internal admin panel for moderating the candidate Community Forum and curating the
Leaderboard that ship in the webclient (Plan 09). Administrators review reported and flagged
posts, approve or remove content, and adjust leaderboard standings (points, badges).

> **Backend status:** No `ForumPost`, `ForumComment`, `ForumReport`, or `LeaderboardEntry`
> Prisma models or endpoints exist yet. The admin UI is built **mock-driven** first (Zustand
> stores seeded with in-memory data) and swaps to the real `/api/v1/admin/forum-posts` and
> `/api/v1/admin/leaderboard` endpoints once the backend lands. Mirrors how `apps/admin`
> separates store logic from `lib/api.ts`, and matches the webclient shapes already added in
> `packages/shared-types` (`ForumPostDto`, `ForumCommentDto`, `ForumPostStatus`,
> `LeaderboardEntryDto`).

## Proposed UI/UX Changes

### Admin Backoffice (`apps/admin`)

#### [NEW] [forum-moderation/page.tsx](file:///Users/rizon.rahi/Personal/elevateSDE/apps/admin/src/app/forum-moderation/page.tsx)

- **Post Directory:** Responsive table (desktop) / card stack (mobile) listing each post with
  author email, title, status `Badge` (PUBLISHED / FLAGGED / REMOVED), upvotes, reply count,
  report count, and created date. Reuses the table pattern from `users/page.tsx` and
  `feature-flags/page.tsx`.
- **Filters:** Status filter via the local `Select` component (`src/components/ui/Select.tsx`)
  and a text search across title and author.
- **Detail / Review:** `Modal` (from `@elevatesde/ui`) showing the full post body, tags, the
  reported reasons, and the comment thread, with **Approve**, **Flag**, and **Remove** actions.
- **Remove:** `ConfirmDialog` (from `@elevatesde/ui`) guarding destructive removal. Status
  changes surface success/error via `useToastStore`.

#### [NEW] [leaderboard-management/page.tsx](file:///Users/rizon.rahi/Personal/elevateSDE/apps/admin/src/app/leaderboard-management/page.tsx)

- **Standings Table:** Ranked list of members with rank, name, points, assessments completed,
  streak, and badges. Read-only stat cards summarize top contributor and total active members.
- **Adjust Points:** `Modal` with an `Input` to set or delta a member's points (e.g. to correct
  abuse), reflected optimistically with a toast.
- **Badges:** Award or revoke a badge via a small multi-select of badge keys.

#### [NEW] [forum-moderation-data.ts](file:///Users/rizon.rahi/Personal/elevateSDE/apps/admin/src/lib/forum-moderation-data.ts)

- Mock seed + thin async accessors (`getModerationPosts`, `getPostComments`, `getTagLabel`,
  `FORUM_TAGS`) mirroring `apps/web/src/lib/forum-data.ts`. The page holds list/filter/modal
  state in local `React.useState` and approve/flag/remove mutate that state — matching the
  admin app's existing convention (`feature-flags/page.tsx`) rather than introducing Zustand.
  Each accessor is the single swap point for the real `/api/v1/admin/forum-posts` endpoints.

#### [NEW] [leaderboard-management-data.ts](file:///Users/rizon.rahi/Personal/elevateSDE/apps/admin/src/lib/leaderboard-management-data.ts)

- Mock seed reusing the Plan-09 `PEOPLE` roster, exposing `getStandings()` and a `BADGE_KEYS`
  constant. The page loads standings into local state; points/badge edits mutate and re-rank
  in place.

#### [NEW] [relative-time.ts](file:///Users/rizon.rahi/Personal/elevateSDE/apps/admin/src/lib/relative-time.ts)

- `formatRelativeTime` and `getNameInitials`, mirrored from the webclient for post/comment
  timestamps and avatar initials in the moderation views.

#### [MODIFY] [AdminLayout.tsx](file:///Users/rizon.rahi/Personal/elevateSDE/apps/admin/src/components/AdminLayout.tsx)

- Add two nav items to the `navItems` array: `{ name: 'Forum Moderation', href: '/forum-moderation', icon: ShieldAlert }`
  and `{ name: 'Leaderboard', href: '/leaderboard-management', icon: Trophy }` (lucide icons).

### Shared Types (`packages/shared-types`)

- Reuse `ForumCommentDto`, `ForumPostStatus`, `ForumAuthor`, `LeaderboardEntryDto` (already
  added for Plan 09). Added `AdminForumPostDto` (post fields + `status`, `reportCount`,
  `reports`, `authorEmail`) and `ForumReportDto` (`id`, `reason`, `createdAt`) for the
  moderation views. Defer `ForumModerationActionDto` and `LeaderboardAdjustmentDto` to the
  backend phase.

## Backend Dependency (future)

- **Prisma models:** `ForumPost` (title, body, tags[], authorId, status, upvotes, viewCount,
  tenantId), `ForumComment` (postId FK, authorId, body, upvotes), `ForumReport` (postId FK,
  reporterId, reason, resolvedAt), and `LeaderboardEntry` (userId, points, assessmentsCompleted,
  streakDays, badges[], tenantId) — with proper indexing and `tenantId` multi-tenant scoping.
- **Endpoints** under `/api/v1/admin`, guarded by `JwtAuthGuard` + `RolesGuard`
  (`@Roles(UserRole.TENANT_ADMIN, UserRole.ADMIN)`):
  - `forum-posts`: `GET /` (list with status filter), `GET /:id` (detail + comments + reports),
    `PATCH /:id/status` (approve / flag / remove).
  - `leaderboard`: `GET /` (ranked list), `PATCH /:userId/points`, `PATCH /:userId/badges`.
- **DDD module** `modules/community/` following the `job-application` module layout (domain
  entities, repository interface + Prisma repository with mapper, application service,
  presentation controller + DTOs).

## Verification Plan

### Automated Checks

- `pnpm --filter @elevatesde/admin type-check`
- `pnpm --filter @elevatesde/admin lint`

### Manual Verification

- Sign in as `ADMIN`, open `http://localhost:3002/forum-moderation`.
- Filter by FLAGGED; open a post, review the thread, and remove it via the confirm dialog;
  confirm the status badge updates and a toast fires.
- Open `http://localhost:3002/leaderboard-management`; adjust a member's points and award a
  badge; verify the standings reflect the change.
- Authenticate as a `USER` and confirm both admin routes are unreachable (middleware redirect
  to `/login`).
