# Backend: Learning Paths / Prep Tracks

> **Status: TODO** — planned, not yet implemented.

The backend for curated, ordered roadmaps that bundle existing coding problems into structured tracks (e.g. "FAANG DSA Prep"). Reuses the `Problem` bank (Plan 15/16); progress is derived from a candidate's ACCEPTED submissions on the problems referenced by a path.

## Data Model (`apps/api/prisma/schema.prisma`)

- **[NEW] enum `PathLevel`** — `BEGINNER`, `INTERMEDIATE`, `ADVANCED`.
- **[NEW] `LearningPath`** — `id`, `slug String @unique`, `title`, `description`, `level PathLevel`, `tags String[]`, `coverImage String?`, `isPublished Boolean @default(false)`, `tenantId String?`, `order Int`, `createdAt`, `updatedAt`.
- **[NEW] `LearningPathModule`** — `id`, `pathId` (FK → `LearningPath`, cascade), `title`, `order Int`. `@@index([pathId])`.
- **[NEW] `LearningPathItem`** — `id`, `moduleId` (FK → `LearningPathModule`, cascade), `problemId` (FK → `Problem`), `order Int`. `@@unique([moduleId, problemId])`.
- **[NEW] `PathEnrollment`** — `id`, `userId` (FK → `User`), `pathId` (FK → `LearningPath`), `enrolledAt`. `@@unique([userId, pathId])`.

Progress = count of distinct path-item `problemId`s for which the user has an ACCEPTED `Submission`, over total items. No stored progress column — derived at read time.

## DDD Module (`apps/api/src/modules/learning-path/`)

Mirror `modules/job-application/`:
- `domain/entities/learning-path.ts` (+ module/item value objects), `domain/interfaces/learning-path-repository.interface.ts`.
- `infrastructure/repositories/learning-path.repository.ts` (+ mappers).
- `application/learning-path.service.ts` — `listPublished(userId)` (cards + enrollment/progress), `getBySlug(slug, userId)` (modules, items, per-item solved flag, overall progress), `enroll(userId, pathId)`, admin `create/update/delete`, `addModule/addItem/reorder`, `publish/unpublish`.
- `presentation/controllers/learning-path.controller.ts` + `learning-path-management.controller.ts`, `dtos/`, presentation `mappers/`.
- `learning-path.module.ts`, registered in `app.module.ts`.

## Endpoints
- Candidate (`JwtAuthGuard`): `GET /v1/learning-paths` (published browse + my progress), `GET /v1/learning-paths/:slug` (detail + progress), `POST /v1/learning-paths/:id/enroll`.
- Admin (`JwtAuthGuard, RolesGuard`, `@Roles(UserRole.ADMIN)`, path `admin/learning-paths`): `GET /`, `POST /`, `PATCH /:id`, `DELETE /:id`, `PATCH /:id/publish`, module/item CRUD + `PATCH /:id/reorder` for ordering.

## Shared Types (`packages/shared-types/src/index.ts`)
`LearningPathDto`, `LearningPathDetailDto`, `LearningPathModuleDto`, `LearningPathItemDto`, `PathProgressDto`, `PathLevel`, `CreateLearningPathDto`.

## Verification Plan

### Automated Checks
- `pnpm --filter @elevatesde/api type-check && pnpm --filter @elevatesde/api lint`
- Unit spec `learning-path.service.spec.ts`: progress derivation from ACCEPTED submissions, enroll idempotency, publish gating (unpublished hidden from candidate list).

### Manual Verification
- Run the migration; confirm the four new tables exist.
- Create a path with one module + two problems, publish it, enroll as a USER, solve one problem, and confirm `GET /v1/learning-paths/:slug` reports 50% progress.
