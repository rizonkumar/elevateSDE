# Backoffice: Coding Problem Bank Manager

The internal admin panel for authoring and curating the DSA problem bank that powers the candidate Coding Assessment Sandbox (webclient Plan 08) and the Dockerized execution backend (Plan 15). Administrators create problems, define visible/hidden test cases, manage per-language starter code, and publish problems to candidates.

> **Backend status:** No `CodingProblem`, `TestCase`, or `CodeSubmission` models or endpoints exist yet (see Plan 15). The admin UI is built **mock-driven** first (a Zustand store seeded with in-memory problems) and swaps to the real `/api/v1/admin/coding-problems` API once the backend lands. Mirrors how `apps/admin` already separates store logic from `lib/api.ts`.

## Proposed UI/UX Changes

### Admin Backoffice (`apps/admin`)

#### [NEW] [coding-problems/page.tsx](file:///Users/rizon.rahi/Personal/elevateSDE/apps/admin/src/app/coding-problems/page.tsx)

- **Problem Directory:** Responsive table (desktop) / card stack (mobile) listing each problem with title, difficulty `Badge` (Easy/Medium/Hard), tags, test-case count, and a published `Toggle`. Reuses the table pattern from `users/page.tsx` and `tenants/page.tsx`.
- **Filters:** Search by title and filter by difficulty using the local `Select` component (`src/components/ui/Select.tsx`).
- **Create / Edit:** `Modal` (from `@elevatesde/ui`) with:
  - Title `Input`, difficulty `Select`, tags input, time-limit (minutes) `Input`.
  - Markdown description `Textarea`.
  - **Starter code** per language (JavaScript, Python, C++) via a small language `Tabs` + `Textarea`.
  - **Test case editor:** repeatable rows of `input` / `expectedOutput` with an `isHidden` `Toggle`; add/remove controls.
- **Delete:** `ConfirmDialog` (from `@elevatesde/ui`) guarding destructive removal.
- **Publish control:** `Toggle` flips `isPublished`; success/error surfaced via `useToastStore`.

#### [NEW] [coding-problems.store.ts](file:///Users/rizon.rahi/Personal/elevateSDE/apps/admin/src/store/coding-problems.store.ts)

- Zustand store managing the problem list, the active edit draft, modal open state, and filter state. CRUD actions call the `api` client; until the backend exists, actions operate on seeded in-memory data and emit toasts identically, so the swap to real endpoints is a one-line change per action.

#### [MODIFY] [AdminLayout.tsx](file:///Users/rizon.rahi/Personal/elevateSDE/apps/admin/src/components/AdminLayout.tsx)

- Add a nav item to the `navItems` array: `{ name: 'Coding Problems', href: '/coding-problems', icon: Code2 }` (lucide `Code2`).

### Shared Types (`packages/shared-types`)

- Reuse `CodingProblemDto`, `AssessmentTestCase`, `AssessmentDifficulty`, `AssessmentLanguage` already added for Plan 08. Add admin-facing fields when the backend is built: `isPublished: boolean`, `createdAt`, `updatedAt`, and a `CodeSubmissionDto` for the future submissions view.

## Backend Dependency (future — Plan 15)

- **Prisma models:** `CodingProblem` (title, difficulty, description, constraints[], tags[], starterCode JSON, timeLimitMinutes, isPublished, tenantId) and `TestCase` (problemId FK, input, expectedOutput, isHidden), with proper indexing and `tenantId` multi-tenant scoping.
- **Endpoints** under `/api/v1/admin/coding-problems`, guarded by `JwtAuthGuard` + `RolesGuard` (`@Roles(UserRole.TENANT_ADMIN, UserRole.ADMIN)`):
  - `GET /` list, `POST /` create, `PATCH /:id` update, `DELETE /:id`, `PATCH /:id/publish`.
- **DDD module** `modules/coding-problem/` following the `job-application` module layout (domain entity, repository interface + Prisma repository with mapper, application service, presentation controller + DTOs).

## Future Enhancement

- **Submissions Review** (`/coding-problems/[id]/submissions`): read-only list of candidate `CodeSubmission`s with status (Accepted / Wrong Answer / Runtime Error), runtime/memory, and the submitted source — depends on the execution backend persisting submissions. Flagged as a follow-up, not part of the first cut.

## Verification Plan

### Automated Checks

- `pnpm --filter @elevatesde/admin type-check`
- `pnpm --filter @elevatesde/admin lint`

### Manual Verification

- Sign in as `ADMIN`, open `http://localhost:3001/admin/coding-problems`.
- Create a problem with two visible and two hidden test cases; verify it appears in the directory.
- Edit starter code per language; toggle publish on/off and confirm toast feedback.
- Delete a problem via the confirm dialog.
- Authenticate as a `USER` and confirm the admin route is unreachable (middleware redirect to `/login`).
