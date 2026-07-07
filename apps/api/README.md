# @elevatesde/api — Core API

The NestJS backend for ElevateSDE. Runs on **port 4400** (configurable via `PORT`), with a global `/api` prefix and URI versioning (`/api/v1/...`). Interactive OpenAPI docs are served at `/api/docs`.

For the full product, architecture, and database diagrams, see the [root README](../../README.md) and [architecture.md](../../architecture.md).

## Domain-Driven Design

Each business domain is a NestJS module under `src/modules/`, layered as `domain/` (entities, interfaces) → `application/` (services) → `infrastructure/` (Prisma repositories, mappers, drivers) → `presentation/` (controllers, DTOs, mappers). Shared Prisma access lives in `src/infrastructure/prisma/`.

Current modules: `auth`, `users`, `organization`, `admin`, `audit-log`, `feature-flag`, `job-application`, `problem`, `code-runner`, `daily-challenge`, `dashboard`, `forum`, `leaderboard`, `achievement`, `notification`, `problem-social`, `review`, `contest`, `queues`.

## Notable subsystems

- **`code-runner`** — harness-based Dockerized execution sandbox (JavaScript/Python/C++). `POST /api/v1/assessments/run` runs visible cases synchronously; `POST /api/v1/assessments/submit` enqueues a BullMQ job that runs all cases (incl. hidden) and transitions the submission `QUEUED → RUNNING → ACCEPTED/…`. **Requires Docker running.**
- **`queues`** — shared BullMQ root (Redis) backing async execution.
- **`daily-challenge` / `achievement` / `notification`** — gamification: streaks, badge awards, and the in-app notification center.

## Local development

```bash
# from the repo root
pnpm install

# generate client, apply migrations, seed demo data (run inside apps/api)
pnpm --filter @elevatesde/api exec prisma generate
pnpm --filter @elevatesde/api exec prisma migrate deploy
pnpm --filter @elevatesde/api exec prisma db seed     # or: pnpm run db:setup

# run in watch mode
pnpm --filter @elevatesde/api dev                     # http://localhost:4400
```

Requires PostgreSQL and Redis (see the root `docker-compose.yml`). Configure `apps/api/.env` from `.env.example` (`DATABASE_URL`, `REDIS_URL`, `JWT_SECRET`, `PORT`).

### Prisma & seeding

| Command                     | Purpose                                                                             |
| --------------------------- | ----------------------------------------------------------------------------------- |
| `pnpm run db:migrate`       | Apply migrations (`prisma migrate deploy`)                                          |
| `pnpm run db:seed`          | Full seed — demo users/tenants, problem bank + runnable problems, community, badges |
| `pnpm run db:seed:problems` | Reseed only the problem catalogue                                                   |
| `pnpm run db:setup`         | `migrate deploy` + `db seed` in one step                                            |

Seeded demo logins (password `Password123!`): `admin@elevatesde.dev` (ADMIN), `org@elevatesde.dev` (TENANT_ADMIN), `candidate@elevatesde.dev` (USER).
