# Backoffice: Learning Path Builder

> **Status: TODO** — planned, not yet implemented.

The internal admin surface for authoring prep tracks: create a path, add modules, pull problems from the existing bank into ordered items, reorder, and publish. Backed by the admin endpoints in Plan 25.

## Proposed UI/UX Changes

### Admin Backoffice (`apps/admin`)

#### [NEW] `apps/admin/src/app/learning-paths/page.tsx`
- **Path directory:** responsive table / card stack listing each path with title, level `Badge` (local `apps/admin/src/components/ui/Badge.tsx`), module count, total problems, and a published `Toggle` (local `Toggle`). Mirrors `coding-problems/page.tsx`.
- **Create / Edit path:** `Button` "New path" opens a `Modal` (`@elevatesde/ui`) with `Input` (title, slug, tags), `Textarea` (description), `Select` (level).
- **Builder view** (`learning-paths/[id]/page.tsx`): manage modules (add/rename/reorder) and, within each module, add problems via a `Select`/search over the **published** problem bank and reorder items. Reorder uses up/down controls (no drag dependency) calling the reorder endpoint.
- **Publish:** `Toggle` flips `isPublished`; delete guarded by `ConfirmDialog`. Feedback via `useToastStore` (`apps/admin/src/store/toast.store.ts`).

#### [NEW] `apps/admin/src/store/learning-paths.store.ts`
- Zustand store mirroring `coding-problems.store.ts`: state `{ paths, active, isModalOpen, editing, savingId, deletingId }`, actions `loadPaths()`, `savePath()`, `togglePublish()`, `removePath()`, `addModule()`, `addItem()`, `reorder()`. Calls `apps/admin/src/lib/learning-paths-api.ts` over the shared `api` client (`apps/admin/src/lib/api.ts`).

#### [MODIFY] `apps/admin/src/components/AdminLayout.tsx`
- Add to `navItems`: `{ name: 'Learning Paths', href: '/learning-paths', icon: Map }` (lucide `Map`).

### Shared Types (`packages/shared-types`)
- Consume `LearningPathDto`, `LearningPathDetailDto`, `CreateLearningPathDto` from Plan 25.

## Backend Dependency
- Plan 25 admin endpoints under `/v1/admin/learning-paths` (`@Roles(UserRole.ADMIN)`).

## Verification Plan

### Automated Checks
- `pnpm --filter @elevatesde/admin type-check`
- `pnpm --filter @elevatesde/admin lint`

### Manual Verification
- Sign in as `ADMIN`, open `http://localhost:3001/admin/learning-paths`; create a path, add a module and two problems, reorder them, and publish.
- Confirm the published path appears on the candidate `/dashboard/paths`; confirm a `USER` cannot reach the admin route.
