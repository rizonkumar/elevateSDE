# Backend: Distributed Task Queues (BullMQ & Redis)

> **Status: TODO** — planned, not yet implemented.

An infrastructure system managing resource-intensive tasks (e.g. LLM evaluations, resume parsing, code execution) asynchronously in the background.

## Database & Redis Architecture

- **Redis Queue Keying:** Custom naming scopes to split tasks:
  - `elevatesde:queue:resume` (resume analysis processing)
  - `elevatesde:queue:code` (candidate code evaluation docker runs)
  - `elevatesde:queue:email` (SES notifications handling)

## Proposed Changes

### NestJS Backend API (`apps/api`)

#### [NEW] [queues.module.ts](file:///Users/rizonkumarrahi/Developer/elevateSDE/apps/api/src/modules/queues/queues.module.ts)

- Module configuring BullMQ root connections to Redis database.

#### [NEW] [queues.service.ts](file:///Users/rizonkumarrahi/Developer/elevateSDE/apps/api/src/modules/queues/application/queues.service.ts)

- Service exposing helper methods to dispatch tasks to relevant queues.

#### [NEW] [resume-processing.worker.ts](file:///Users/rizonkumarrahi/Developer/elevateSDE/apps/api/src/modules/queues/infrastructure/workers/resume-processing.worker.ts)

- Concrete worker consumer polling from `resume` queue and running CPU-intensive LLM/ATS evaluation.

---

## Verification Plan

### Automated Tests

- Run unit tests targeting job dispatchers:
  ```bash
  pnpm --filter=@elevatesde/api test src/modules/queues
  ```
