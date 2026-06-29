# Webclient: Problem Discussions + Bookmarks, Notes & Lists

> **Status: TODO** — planned, not yet implemented.

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
