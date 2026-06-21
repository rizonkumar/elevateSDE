# Backend: Dockerized Code Execution Sandbox

A sandbox orchestrator that schedules candidate code submissions into isolated Docker containers, executes test suites, and tracks execution performance (memory/CPU metrics).

## Proposed Changes

### NestJS Backend API (`apps/api`)

#### [NEW] [code-runner.service.ts](file:///Users/rizonkumarrahi/Developer/elevateSDE/apps/api/src/modules/code-runner/application/code-runner.service.ts)

- Service generating script files for user code.
- Schedules Docker commands to spawn container runs, binding the directories read-only.

#### [NEW] [docker-sandbox/](file:///Users/rizonkumarrahi/Developer/elevateSDE/apps/api/src/modules/code-runner/infrastructure/docker-sandbox/)

- Isolated configurations containing ry.unner environments (Python/Node.js runtimes) with memory limits (`50mb`) and execution timeouts (`2s`).

---

## Verification Plan

### Automated Tests

- Submit basic script solutions and verify execution constraints are respected:
  ```bash
  pnpm --filter=@elevatesde/api test src/modules/code-runner
  ```
