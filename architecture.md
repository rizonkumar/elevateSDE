# ElevateSDE: Enterprise AI Interview Preparation Platform

## Vision
A comprehensive, enterprise-grade multi-tenant platform where software engineering candidates can prepare for interviews, take timed assessments, attend real-time AI-driven mock interviews, and receive personalized learning plans. 

This platform is built as a SaaS product, supporting individual users as well as B2B tenants (companies purchasing seats for their employees).

---

## Tech Stack

### Frontend
* **Core:** Next.js 16.2.9 (App Router, Turbopack)
* **Architecture:** React Server Components (RSC), Suspense, Error Boundaries, Optimistic Updates
* **Styling & UI:** Tailwind CSS, Shadcn UI
* **State Management:** Zustand (Client State), TanStack Query / React Query (Server State)
* **Forms & Validation:** React Hook Form, Zod
* **Data Fetching & Real-time:** Axios, Socket.io Client
* **Performance:** TanStack Virtual (Infinite scrolling for leaderboards/discussions)
* **Testing:** Playwright (E2E), Jest + React Testing Library (Unit)

### Backend
* **Core:** NestJS, TypeScript
* **Database & ORM:** PostgreSQL, Prisma ORM, `pgvector` (for AI similarity search)
* **Caching & Queues:** Redis, BullMQ
* **Real-time & Events:** Socket.io, Event-Driven Architecture (Node.js EventEmitter)
* **Authentication:** Passport.js, JWT (Access/Refresh rotation)
* **Monetization & Billing:** Stripe API (Webhooks, Subscriptions, Multi-tenant billing)

### Observability & Infrastructure
* **Telemetry & Tracing:** OpenTelemetry (End-to-End request tracing)
* **Monitoring:** Prometheus, Grafana
* **Error Tracking:** Sentry
* **Cloud Infrastructure:** AWS S3 (Storage), CloudFront (CDN), AWS SES (Emails)
* **DevOps:** Docker, Docker Compose, NGINX (Reverse Proxy)
* **CI/CD:** GitHub Actions (Lint -> Unit Tests -> E2E -> Build -> Docker -> Deploy)

### AI Orchestration
* **Engine:** LangChain
* **Models:** OpenAI, Claude, Gemini API integrations

---

## Monorepo Workspace Structure (Turborepo)

```text
elevatesde/
├── apps/
│   ├── web/                 (Next.js 16.2.9 Frontend)
│   ├── api/                 (NestJS Backend)
│   └── admin/               (Internal Super-Admin Dashboard)
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

## Domain-Driven Design (DDD) Backend Architecture

Instead of grouping by framework features (controllers/services), the API is structured by business domains.

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

* Versioning enabled globally via `app.enableVersioning()` in NestJS.
* Endpoints prefixed: `/api/v1/users`, `/api/v2/assessments`.
* Fully documented using Swagger/OpenAPI.

---

## Core Database Schema & Multi-Tenancy

**Tenants & Users**

* `Tenant` (B2B Companies): `id`, `name`, `stripeCustomerId`, `subscriptionPlan`
* `User`: `id`, `tenantId` (Nullable for B2C), `email`, `role`, `createdAt`

**Audit & Telemetry**

* `AuditLog`: `id`, `userId`, `action` (e.g., "ROLE_CHANGED"), `metadata` (JSON), `createdAt`
* `FeatureFlag`: `id`, `flagKey` (e.g., "AI_MOCK_INTERVIEW_BETA"), `isEnabled`, `percentageRollout`

**Core Business**

* `Resume`: `id`, `userId`, `s3FileUrl`, `atsScore`, `parsedSkills`
* `Question`: `id`, `title`, `difficulty`, `idealSolution`, `idealSolutionEmbedding` (Vector)
* `AssessmentAttempt`: `id`, `userId`, `assessmentId`, `score`, `startTime`, `endTime`
* `MockInterview`: `id`, `userId`, `transcript` (JSONB), `aiFeedback`, `overallScore`

**Community & Tracking**

* `DiscussionPost`: `id`, `userId`, `title`, `content`, `upvotes`
* `DiscussionComment`: `id`, `postId`, `userId`, `content`
* `JobApplication`: `id`, `userId`, `company`, `role`, `status` (APPLIED, OA, INTERVIEW, OFFER)

---

## Advanced Systems & Workflows

### 1. Event-Driven Architecture

Business logic is decoupled using events.

* **Action:** User completes an assessment.
* **Event:** `AssessmentCompletedEvent` is fired.
* **Listeners:** * `NotificationListener`: Sends email via AWS SES.
* `AnalyticsListener`: Updates the user's learning dashboard.
* `LeaderboardListener`: Recalculates Redis sorted sets.



### 2. Distributed Queues (BullMQ + Redis)

Resource-intensive tasks are offloaded from the main event loop.

* **Resume Processing:** Extracts text from S3 documents, parses via LLM, and calculates ATS score.
* **Code Execution Engine:** Secure, isolated Docker environment for evaluating candidate DSA submissions against test cases.

### 3. AI Mock Interviews (RAG Implementation)

* When a user submits an answer (text or transcribed audio), the backend converts the response into an embedding.
* `pgvector` performs a cosine similarity search against the `idealSolutionEmbedding`.
* LangChain orchestrates the comparison to generate contextual, accurate feedback and a dynamic follow-up question.

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

* **Phase 1 (Core Foundations):** Monorepo setup, Auth, Users, RBAC, Basic Questions, Next.js Dashboard.
* **Phase 2 (Asynchronous & Real-time):** Redis, BullMQ, WebSockets, Notifications, Job Tracker.
* **Phase 3 (Enterprise & AI):** Multi-tenancy, Stripe Subscriptions, AI Resume Analyzer, LangChain integration.
* **Phase 4 (Advanced Systems):** pgvector RAG, Dockerized Code Execution Engine, Discussion Forums, Leaderboards.
* **Phase 5 (Production Readiness):** OpenTelemetry, Sentry, Swagger Docs, Feature Flags, Audit Logging, CI/CD pipelines.
