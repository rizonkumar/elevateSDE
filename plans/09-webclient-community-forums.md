# Webclient: Community Forums & Leaderboard UI

A discussion platform and ranking system for candidates to interact, share interview
experiences, compare offers, and view their standing against the community.

> **Backend status:** No forum or leaderboard Prisma models or endpoints exist yet. The
> webclient is built **mock-driven** first — Zustand stores seeded with in-memory data
> (`apps/web/src/lib/forum-data.ts`, `apps/web/src/lib/leaderboard-data.ts`) — and swaps to
> real endpoints later, one line per action, matching the `job-tracker.store.ts` pattern.
> The shared shapes live in `packages/shared-types` (`ForumPostDto`, `ForumCommentDto`,
> `ForumSortOption`, `ForumPostStatus`, `LeaderboardEntryDto`, `LeaderboardTimeframe`).

## Proposed UI/UX Changes

### Candidate Webclient (`apps/web`)

#### [NEW] [forum/page.tsx](file:///Users/rizon.rahi/Personal/elevateSDE/apps/web/src/app/dashboard/forum/page.tsx)

- **Discussion Feed:** Sortable post list (Newest / Popular / Unanswered) via the shared
  `Tabs` component, with a horizontally scrollable tag filter (`TagFilter`) and a search input.
- **Load-more pagination:** The feed renders in batches with a "Load more" button. (Virtualization
  via `@tanstack/react-virtual` was dropped — it is not a project dependency and adds no value
  for the current mock-scale data; revisit if the real feed grows large.)
- **Upvote Actions:** A shared `UpvoteButton` with a framer-motion tap micro-animation, reused
  on post cards, the detail view, and comments.
- **New Post:** `Modal` (from `@elevatesde/ui`) with title, details, and topic selection.

#### [NEW] [forum/[id]/page.tsx](file:///Users/rizon.rahi/Personal/elevateSDE/apps/web/src/app/dashboard/forum/[id]/page.tsx)

- **Thread View:** Full post with author, tags, and body; a reply composer (`Textarea`); and the
  threaded comment list (`CommentItem`), all sharing the upvote control.

#### [NEW] [leaderboard/page.tsx](file:///Users/rizon.rahi/Personal/elevateSDE/apps/web/src/app/dashboard/leaderboard/page.tsx)

- **Podium:** Top-3 highlighted cards with the current user's standing summarized in an accent card.
- **Rankings:** Responsive scoreboard — table on desktop, card stack on mobile — showing rank,
  member, points, assessments completed, streak, and badges. The current user's row is
  emphasized. Timeframe `Tabs` (All time / This month / This week) and load-more pagination.

#### [NEW] Stores & helpers

- [forum.store.ts](file:///Users/rizon.rahi/Personal/elevateSDE/apps/web/src/store/forum.store.ts) —
  posts, comments, sort/tag/search filters, pagination, optimistic upvotes, create-post, and
  comments. Exposes the pure `filterAndSortPosts` selector.
- [leaderboard.store.ts](file:///Users/rizon.rahi/Personal/elevateSDE/apps/web/src/store/leaderboard.store.ts) —
  timeframe selection and pagination.
- [relative-time.ts](file:///Users/rizon.rahi/Personal/elevateSDE/apps/web/src/lib/relative-time.ts) —
  `formatRelativeTime` and `getNameInitials`, shared across forum and avatars.

#### [MODIFY] [dashboard-nav.ts](file:///Users/rizon.rahi/Personal/elevateSDE/apps/web/src/lib/dashboard-nav.ts)

- Add `Community` (`MessagesSquare`) and `Leaderboard` (`Trophy`) to `BASE_LINKS`.

---

## Verification Plan

### Automated Checks

- `pnpm --filter @elevatesde/web type-check`
- `pnpm --filter @elevatesde/web lint`

### Manual Verification

- Access `http://localhost:3001/dashboard/forum`. Sort tabs reorder the feed; tag chips and
  search filter; "Load more" reveals additional posts; "New post" creates a post that appears
  at the top; upvotes toggle with a tap animation.
- Open a post → `/dashboard/forum/[id]`; add a reply and verify it appears; upvote a comment.
- Access `http://localhost:3001/dashboard/leaderboard`. Podium shows the top 3; timeframe tabs
  swap rankings; the current user's row is highlighted and matches the "Your standing" card;
  load-more works; the table collapses to cards on mobile.
