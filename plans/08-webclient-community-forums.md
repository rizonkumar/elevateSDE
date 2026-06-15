# Webclient: Community Forums & Leaderboard UI

A discussion platform and ranking system for candidates to interact, share interview experiences, and view global progress.

## Proposed UI/UX Changes

### Candidate Webclient (`apps/web`)

#### [NEW] [forum/page.tsx](file:///Users/rizonkumarrahi/Developer/elevateSDE/apps/web/src/app/dashboard/forum/page.tsx)

- **Infinite Scroll Post List:** Integrated with `tanstack/react-virtual` for performance.
- **Filter Bar:** Toggle sorting between Newest, Popular, and Tag categories (e.g. #meta, #leetcode).
- **Upvote Actions:** High-contrast buttons with micro-animations on upvoting.

#### [NEW] [leaderboard/page.tsx](file:///Users/rizonkumarrahi/Developer/elevateSDE/apps/web/src/app/dashboard/leaderboard/page.tsx)

- **Rankings Table:** Virtualized scoreboard highlighting top users, scores, assessments completed, and badges.

---

## Verification Plan

### Manual Verification

- Access `http://localhost:3000/dashboard/forum`. Verify virtualized rendering performance.
- Create a post; verify it updates feed instantly.
