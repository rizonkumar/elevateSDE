# Webclient: Problem Discussions + Bookmarks, Notes & Lists

> **Status: DONE** — implemented on the coding-assessment problem page plus a new `/dashboard/lists` page, backed by the `problem-social` API (Plan 35).
>
> Notes on deviations from the original plan:
> - **Notes became a third tab** inside `ProblemPanel` (Description | Discuss | Notes) rather than a separate collapsible panel. The bookmark star and an Add-to-list menu live in the panel header row, so both the desktop (`react-resizable-panels`) and mobile layouts inherit them automatically — no change to the page's mobile view bar.
> - **Discussions render inline** within the Discuss tab (list → inline thread with reply form), reusing the forum's `UpvoteButton`, `CommentItem`, and `AuthorAvatar`. To reuse `CommentItem` with zero copy, its prop type was generalized to a minimal `ThreadComment` shape (satisfied by both `ForumCommentDto` and `ProblemDiscussionCommentDto`), and `toggleVoteState` is now exported from `forum.store.ts`.
> - **List reordering uses framer-motion `Reorder`** (drag-and-drop) — framer-motion is already a dependency, so no new package.
> - Web client calls the API under the `/api/v1/...` prefix (matching `forum.store.ts`).

Adds a Discuss/Solutions tab, bookmark toggle, private notes, and "My Lists" curation, backed by the `problem-social` API (Plan 35).

## Proposed UI/UX Changes (`apps/web`)

#### [MODIFY] `apps/web/src/app/dashboard/assessment/[id]/page.tsx`
- Add a "Discuss" tab (reuse `@elevatesde/ui` `Tabs`) alongside the problem description, rendering the discussion thread (reuse the forum thread/comment components). Add a bookmark toggle (star icon) and a collapsible private-notes panel (`Textarea`, autosaves via `PUT note`).

#### [NEW] `apps/web/src/app/dashboard/lists/page.tsx`
- "My Lists" management: create/rename/delete lists, view items, reorder, remove. Add-to-list control surfaced from the problem page.

#### [NEW] `apps/web/src/store/problem-social.store.ts`
- Zustand store (discussions, bookmark state, note, lists) on the shared `api`.

#### [MODIFY] `apps/web/src/lib/dashboard-nav.ts`
- Add `{ href: '/dashboard/lists', label: 'My Lists', icon: ListChecks }`.

## Reusable Components
- Forum thread/comment components, `@elevatesde/ui` `Tabs`/`Textarea`/`Button`/`Badge`/`ConfirmDialog`.

## Backend Dependency
- Plan 35 endpoints.

## Verification Plan
- `pnpm --filter @elevatesde/web type-check && lint`.
- Manual: on a problem, post in Discuss, toggle bookmark, type a note (confirm persistence on reload), add to a custom list and reorder. Verify responsive + light/dark.
