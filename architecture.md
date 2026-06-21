# ElevateSDE: Enterprise AI Interview Preparation Platform

## Vision

A comprehensive, enterprise-grade multi-tenant platform where software engineering candidates can prepare for interviews, take timed assessments, attend real-time AI-driven mock interviews, and receive personalized learning plans.

This platform is built as a SaaS product, supporting individual users as well as B2B tenants (companies purchasing seats for their employees).

---

## Tech Stack

### Frontend

- **Core:** Next.js 16.2.9 (App Router, Turbopack)
- **Architecture:** React Server Components (RSC), Suspense, Error Boundaries, Optimistic Updates
- **Styling & UI:** Tailwind CSS (v4) with custom, in-house components in `packages/ui` (no Shadcn). Theme is driven by CSS custom properties with light/dark modes; no gradients or glassmorphism.
- **Icons & Charts:** `lucide-react` for icons, `recharts` for data visualisation (e.g. seat gauges, performance charts).
- **State Management:** Zustand (Client State), TanStack Query / React Query (Server State — planned)
- **Forms & Validation:** React Hook Form, Zod (planned)
- **Data Fetching & Real-time:** Axios, Socket.io Client
- **Performance:** TanStack Virtual (Infinite scrolling for leaderboards/discussions — planned)
- **Testing:** Playwright (E2E), Jest + React Testing Library (Unit)

### Backend

- **Core:** NestJS, TypeScript
- **Database & ORM:** PostgreSQL, Prisma ORM, `pgvector` (for AI similarity search)
- **Caching & Queues:** Redis, BullMQ
- **Real-time & Events:** Socket.io, Event-Driven Architecture (Node.js EventEmitter)
- **Authentication:** Passport.js, JWT (Access/Refresh rotation)
- **Monetization & Billing:** Stripe API (Webhooks, Subscriptions, Multi-tenant billing)

### Observability & Infrastructure

- **Telemetry & Tracing:** OpenTelemetry (End-to-End request tracing)
- **Monitoring:** Prometheus, Grafana
- **Error Tracking:** Sentry
- **Cloud Infrastructure:** AWS S3 (Storage), CloudFront (CDN), AWS SES (Emails)
- **DevOps:** Docker, Docker Compose, NGINX (Reverse Proxy)
- **CI/CD:** GitHub Actions (Lint -> Unit Tests -> E2E -> Build -> Docker -> Deploy)

### AI Orchestration

- **Engine:** LangChain
- **Models:** OpenAI, Claude, Gemini API integrations

---

## Monorepo Workspace Structure (Turborepo)

```text
elevatesde/
├── apps/
│   ├── web/                 (Next.js 16.2.9 Frontend — Candidate Portal, port 3001)
│   ├── api/                 (NestJS Backend — Core API, port 4400)
│   └── admin/               (Internal Super-Admin Dashboard, internal port 3002, served at /admin)
│
├── packages/
│   ├── shared-types/        (TypeScript Interfaces used across apps)
│   ├── ui/                  (Shared custom Tailwind components)
│   ├── eslint-config/       (Standardized linting)
│   ├── ts-config/           (Standardized TypeScript rules)
│   └── logger/              (Custom Winston + OpenTelemetry wrapper)
│
├── turbo.json
└── package.json

```

---

## Application Topology & Routing

The platform exposes a **single public origin** to users; the admin backoffice is a separate deployable that sits behind the same origin.

```text
                 ┌──────────────────────────────────────────────┐
   Browser  ───▶ │  Web app  (apps/web)        :3001            │
                 │  • /            Candidate portal              │
                 │  • /dashboard   Candidate dashboard          │
                 │  • /dashboard/org  Organization (TENANT_ADMIN)│
                 │  • /admin/:path*  ── rewrite ──┐             │
                 └────────────────────────────────┼─────────────┘
                                                   ▼
                 ┌──────────────────────────────────────────────┐
                 │  Admin app (apps/admin)     :3002 (internal)  │
                 │  • basePath: '/admin'                         │
                 │  • Super-Admin backoffice (ADMIN only)        │
                 └──────────────────────────────────────────────┘
                                   │  Axios (Bearer JWT)
                                   ▼
                 ┌──────────────────────────────────────────────┐
                 │  API (apps/api, NestJS)     :4400             │
                 │  • Global prefix /api, URI versioning /v1     │
                 │  • PostgreSQL :5432 · Redis :6379             │
                 └──────────────────────────────────────────────┘
```

- **Single entry point:** users only ever visit the web origin (`http://localhost:3001`). The candidate portal and dashboards are served directly; `/admin/*` is transparently forwarded to the admin app.
- **Why two apps:** the Super-Admin backoffice is an independently deployable application with its own auth/middleware and a hard security boundary. It runs on its own internal port (`3002`) with `basePath: '/admin'`.
- **Dev proxy:** `apps/web/next.config.ts` rewrites `/admin/:path*` → `http://localhost:3002/admin/:path*`. In production a reverse proxy (NGINX) performs the equivalent routing under one domain.
- **Local ports:** web `3001`, admin (internal) `3002`, API `4400` (configurable via `PORT`), PostgreSQL `5432`, Redis `6379`. Clients read the API URL from `NEXT_PUBLIC_API_URL`.

### Dashboard Surfaces

| Surface                | Route (via web origin)   | Access                 |
| ---------------------- | ------------------------ | ---------------------- |
| Candidate dashboard    | `/dashboard`             | Any authenticated user |
| Job tracker            | `/dashboard/job-tracker` | Any authenticated user |
| Organization dashboard | `/dashboard/org`         | `TENANT_ADMIN`         |
| Super-Admin backoffice | `/admin`                 | `ADMIN`                |

The backoffice consumes live `/api/v1/admin/*` endpoints (including forum moderation and leaderboard management). The job tracker, coding assessments, community forum, and leaderboard all consume live, user-scoped endpoints (`/api/v1/job-applications`, `/api/v1/problems` + `/api/v1/submissions`, `/api/v1/forum/*`, `/api/v1/leaderboard`). The remaining candidate and organization dashboard surfaces (mock interviews, resume analyzer, seats, invitations) are currently backed by typed client-side Zustand stores until their domain models are implemented.

---

## Domain-Driven Design (DDD) Backend Architecture

Instead of grouping by framework features (controllers/services), the API is structured by business domains. Current domain modules include `users`, `auth`, `audit-log`, `feature-flag`, `admin`, `job-application` (the candidate job tracker), `problem` and `code-runner` (the coding assessment bank and Dockerized execution sandbox), and `forum` and `leaderboard` (the community discussion board and rankings), each following the layered template below.

### Example: Users Domain

```text
apps/api/src/modules/users/
├── domain/
│   ├── entities/            (Core business entities with private constructors & factories)
│   │   └── user.ts
│   └── interfaces/          (Abstract repository contracts)
│       └── users-repository.interface.ts
│
├── application/
│   └── users.service.ts     (Application services/orchestration)
│
├── infrastructure/
│   ├── mappers/             (Translates between database rows and domain entities)
│   │   └── user.mapper.ts
│   └── repositories/        (Prisma concrete database implementations)
│       └── users.repository.ts
│
└── presentation/
    ├── controllers/         (API endpoints)
    │   └── users.controller.ts
    ├── mappers/             (Translates between domain entities and response DTOs)
    │   └── user-presentation.mapper.ts
    └── dtos/                (Request/Response validation DTOs)
        └── user-response.dto.ts
```

### API Versioning & Documentation

- Versioning enabled globally via `app.enableVersioning()` in NestJS.
- Endpoints prefixed: `/api/v1/users`, `/api/v2/assessments`.
- Fully documented using Swagger/OpenAPI.

---

## Core Database Schema & Multi-Tenancy

**Tenants & Users**

- `Tenant` (B2B Companies): `id`, `name`, `stripeCustomerId`, `subscriptionPlan`
- `User`: `id`, `tenantId` (Nullable for B2C), `email`, `role`, `createdAt`

**Audit & Telemetry**

- `AuditLog`: `id`, `userId`, `action` (e.g., "ROLE_CHANGED"), `metadata` (JSON), `createdAt`
- `FeatureFlag`: `id`, `flagKey` (e.g., "AI_MOCK_INTERVIEW_BETA"), `isEnabled`, `percentageRollout`

**Core Business**

- `Resume`: `id`, `userId`, `s3FileUrl`, `atsScore`, `parsedSkills`
- `Question`: `id`, `title`, `difficulty`, `idealSolution`, `idealSolutionEmbedding` (Vector)
- `AssessmentAttempt`: `id`, `userId`, `assessmentId`, `score`, `startTime`, `endTime`
- `MockInterview`: `id`, `userId`, `transcript` (JSONB), `aiFeedback`, `overallScore`

**Community & Tracking**

- `ForumPost`: `id`, `userId`, `title`, `body`, `tags`, `status` (`ForumPostStatus` enum: PUBLISHED, FLAGGED, REMOVED), `viewCount`, `createdAt`, `updatedAt`
- `ForumComment`: `id`, `postId`, `userId`, `body`, `createdAt`, `updatedAt`
- `ForumPostVote` / `ForumCommentVote`: composite-key join tables (`postId`/`commentId` + `userId`) backing upvote counts and per-viewer `hasUpvoted`
- `ForumReport`: `id`, `postId`, `reporterId`, `reason`, `createdAt` (drives the backoffice moderation queue)
- `UserStats`: `userId`, `points`, `monthlyPoints`, `weeklyPoints`, `assessmentsCompleted`, `badges`, `streakDays` (powers the leaderboard timeframe rankings)
- `Problem` / `ProblemTestCase` / `Submission` / `SubmissionResult`: the coding assessment bank and per-test execution results produced by the sandbox
- `JobApplication`: `id`, `userId`, `company`, `role`, `status` (`JobApplicationStatus` enum: APPLIED, OA, INTERVIEW, OFFER, REJECTED), `salaryRange`, `jobDescriptionUrl`, `interviewDate`, `boardPosition` (Kanban ordering), `createdAt`, `updatedAt`

---

## Advanced Systems & Workflows

### 1. Event-Driven Architecture

Business logic is decoupled using events.

- **Action:** User completes an assessment.
- **Event:** `AssessmentCompletedEvent` is fired.
- **Listeners:** \* `NotificationListener`: Sends email via AWS SES.
- `AnalyticsListener`: Updates the user's learning dashboard.
- `LeaderboardListener`: Recalculates Redis sorted sets.

### 2. Distributed Queues (BullMQ + Redis)

Resource-intensive tasks are offloaded from the main event loop.

- **Resume Processing:** Extracts text from S3 documents, parses via LLM, and calculates ATS score.
- **Code Execution Engine** _(implemented)_: Secure, isolated Docker environment (the `code-runner` module) for evaluating candidate DSA submissions against test cases, with per-language drivers (JavaScript, Python, C++), timeouts, and memory limits. Currently invoked synchronously; migrating execution onto BullMQ is a follow-up once the queue layer lands.

### 3. AI Mock Interviews (RAG Implementation)

- When a user submits an answer (text or transcribed audio), the backend converts the response into an embedding.
- `pgvector` performs a cosine similarity search against the `idealSolutionEmbedding`.
- LangChain orchestrates the comparison to generate contextual, accurate feedback and a dynamic follow-up question.

### 4. CI/CD Pipeline (GitHub Actions)

1. **PR Created:** Triggers pipeline.
2. **Lint & Format:** Checks `eslint` and `prettier` rules.
3. **Unit Tests:** Runs Jest for core use-cases.
4. **E2E Tests:** Runs Playwright against a transient staging environment.
5. **Build:** Compiles Next.js (Turbopack) and NestJS applications.
6. **Containerize:** Builds Docker images and pushes to AWS ECR / Docker Hub.
7. **Deploy:** Updates production services.

---

## Phased Execution Plan

- **Phase 1 (Core Foundations):** Monorepo setup, Auth, Users, RBAC, Basic Questions, Next.js Dashboard.
- **Phase 2 (Asynchronous & Real-time):** Redis, BullMQ, WebSockets, Notifications, Job Tracker.
- **Phase 3 (Enterprise & AI):** Multi-tenancy, Stripe Subscriptions, AI Resume Analyzer, LangChain integration.
- **Phase 4 (Advanced Systems):** pgvector RAG _(pending)_, Dockerized Code Execution Engine _(done)_, Discussion Forums _(done)_, Leaderboards _(done)_.
- **Phase 5 (Production Readiness):** OpenTelemetry, Sentry, Swagger Docs, Feature Flags, Audit Logging, CI/CD pipelines.
