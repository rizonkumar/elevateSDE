# Backoffice: Interview Question Bank & Results Review

> **Status: TODO** — planned, not yet implemented.

The internal admin panel for curating the mock-interview question bank that feeds the AI interviewer (candidate webclient Plan 07) and the WebSockets + RAG similarity backend (Plan 14), plus a read-only review surface for completed candidate interview sessions. Administrators author questions grouped by topic and role level with an "ideal answer" used as the RAG reference, and review scored session outcomes.

> **Backend status:** No `Question` (pgvector) or `MockInterviewSession` Prisma models or endpoints exist yet (see Plan 14). The admin UI is built **mock-driven** first (Zustand stores seeded with in-memory data) and swaps to the real `/api/v1/admin/interview-questions` and results endpoints once the backend lands. The webclient already defines the shared shapes (`InterviewConfig`, `MockInterviewSession`, `MockInterviewFeedback`, `TranscriptEntry`) in `packages/shared-types`.

## Proposed UI/UX Changes

### Admin Backoffice (`apps/admin`)

#### [NEW] [interview-bank/page.tsx](file:///Users/rizon.rahi/Personal/elevateSDE/apps/admin/src/app/interview-bank/page.tsx)

- **Question Directory:** Questions grouped by topic (System Design / Behavioral / Coding / DSA) and role level (Junior / Mid / Senior / Staff), rendered as a responsive table / card stack reusing the `users`/`tenants` page pattern.
- **Filters:** Topic and role-level filters via the local `Select` component; text search across prompts.
- **Create / Edit:** `Modal` (from `@elevatesde/ui`) with:
  - Question prompt `Textarea`, topic `Select`, role-level `Select`, company-style `Select`, difficulty/weight `Input`.
  - **Ideal answer** `Textarea` (the reference text the future RAG service embeds for similarity scoring).
  - Tags input for retrieval grouping.
- **Delete:** `ConfirmDialog` guarding removal. Toasts via `useToastStore`.

#### [NEW] [interview-results/page.tsx](file:///Users/rizon.rahi/Personal/elevateSDE/apps/admin/src/app/interview-results/page.tsx)

- **Sessions Feed:** Read-only list of completed `MockInterviewSession`s — candidate email, topic + role-level `Badge`s, overall score, and completion date.
- **Session Detail Drawer/Modal:** Opens a single session showing the `MockInterviewFeedback` competency breakdown (score bars), strengths/improvements, summary, and the full `TranscriptEntry[]` conversation (AI vs candidate bubbles, matching the webclient transcript styling).

#### [NEW] [interview-bank.store.ts](file:///Users/rizon.rahi/Personal/elevateSDE/apps/admin/src/store/interview-bank.store.ts)

- Zustand store managing the question list, active draft, modal/filter state, and CRUD actions against the `api` client (seeded in-memory until the backend exists).

#### [NEW] [interview-results.store.ts](file:///Users/rizon.rahi/Personal/elevateSDE/apps/admin/src/store/interview-results.store.ts)

- Zustand store loading completed sessions and the selected session for the detail view.

#### [MODIFY] [AdminLayout.tsx](file:///Users/rizon.rahi/Personal/elevateSDE/apps/admin/src/components/AdminLayout.tsx)

- Add two nav items to `navItems`: `{ name: 'Interview Bank', href: '/interview-bank', icon: MessageSquare }` and `{ name: 'Interview Results', href: '/interview-results', icon: ClipboardList }` (lucide icons).

### Shared Types (`packages/shared-types`)

- Reuse `MockInterviewTopic`, `InterviewRoleLevel`, `InterviewCompanyStyle`, `MockInterviewSession`, `MockInterviewFeedback`, `TranscriptEntry`. Add an `InterviewQuestionDto` (id, prompt, topic, roleLevel, companyStyle, idealAnswer, tags[], weight, createdAt, updatedAt) when the backend is built.

## Backend Dependency (future — Plan 14)

- **Prisma + pgvector:** `Question` model with prompt, topic, roleLevel, idealAnswer, an embedding `vector` column, and a cosine-distance index; `MockInterviewSession` model persisting config, transcript (JSON), feedback (JSON), and timestamps. All `tenantId`-scoped.
- **Endpoints** under `/api/v1/admin`, guarded by `JwtAuthGuard` + `RolesGuard` (`@Roles(UserRole.TENANT_ADMIN, UserRole.ADMIN)`):
  - `interview-questions`: `GET /`, `POST /`, `PATCH /:id`, `DELETE /:id`.
  - `interview-sessions`: `GET /` (list completed), `GET /:id` (detail).
- **DDD module** `modules/interview/` following the `job-application` module layout (domain entities, repository interface + Prisma repository with mapper, application service, presentation controller + DTOs). Embedding generation hooks into the RAG service from Plan 14.

## Verification Plan

### Automated Checks

- `pnpm --filter @elevatesde/admin type-check`
- `pnpm --filter @elevatesde/admin lint`

### Manual Verification

- Sign in as `ADMIN`, open `http://localhost:3001/admin/interview-bank`.
- Create a System Design question for the Senior level with an ideal answer; verify it appears under the correct group and filters.
- Edit and delete a question via the confirm dialog; confirm toast feedback.
- Open `http://localhost:3001/admin/interview-results`, open a seeded session, and verify the competency breakdown and transcript render.
- Authenticate as a `USER` and confirm both admin routes are unreachable (middleware redirect to `/login`).
