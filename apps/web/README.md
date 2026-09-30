# ElevateSDE Candidate Web Client

Next.js 16.2.9 App Router client for candidate preparation, job tracking, Interview Readiness, coding assessments, learning paths, review, community, and organization workspaces.

## Local development

From the repository root, install dependencies and start the complete stack:

```bash
pnpm install
pnpm -w run dev:all
```

Open [http://localhost:3001](http://localhost:3001). The API defaults to `http://localhost:4400`; configure `NEXT_PUBLIC_API_URL` in `apps/web/.env.local` when using another address.

## Interview Readiness

Authenticated routes:

- `/dashboard/interview-readiness`
- `/dashboard/interview-readiness/[planId]`
- `/dashboard/interview-readiness/peer/[sessionId]`

The workspace uses live `/api/v1/interview-preparation` endpoints. Its readiness indicator is deterministic preparation guidance and is not a hiring probability.

## Commands

```bash
pnpm dev
pnpm type-check
pnpm lint
pnpm build
pnpm screenshots
```

Build before capturing screenshots. `pnpm screenshots` uses the pinned Playwright runner, installed Google Chrome, synthetic authenticated fixtures, a 1440x900 viewport, reduced motion, and explicit light/dark themes. Curated files are written to `public/screenshots`.
