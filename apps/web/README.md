# @elevatesde/web — Candidate Portal

The candidate-facing Next.js 16 (App Router) frontend for ElevateSDE. This is the single public origin (**port 3001**) users visit; the admin backoffice (`apps/admin`) is transparently served under `/admin` via a rewrite in `next.config.ts`.

For the full product, architecture, and diagrams, see the [root README](../../README.md) and [architecture.md](../../architecture.md).

## Key surfaces

| Route                                                                    | Purpose                                                                         |
| ------------------------------------------------------------------------ | ------------------------------------------------------------------------------- |
| `/`                                                                      | Marketing landing page                                                          |
| `/login`, `/register`, `/invite/[token]`                                 | Auth and tenant-invitation acceptance                                           |
| `/dashboard`                                                             | Candidate home — solved stats, streak, job pipeline, progress charts            |
| `/dashboard/assessment`, `/dashboard/assessment/[id]`                    | Problem bank and the Monaco-based code runner (run/submit against test cases)   |
| `/dashboard/daily`                                                       | Daily challenge and streak calendar                                             |
| `/dashboard/profile`                                                     | Standing, badges, and a 365-day submission heatmap                              |
| `/dashboard/leaderboard`                                                 | All-time / monthly / weekly rankings                                            |
| `/dashboard/achievements`                                                | Badge showcase with unlock progress                                             |
| `/dashboard/forum`, `/dashboard/forum/[id]`                              | Community discussion board                                                      |
| `/dashboard/lists`, `/dashboard/job-tracker`, `/dashboard/notifications` | Problem collections, job-application Kanban, notification center                |
| `/dashboard/resume`, `/dashboard/mock-interview`                         | Resume analyzer and AI mock interview (client-side mocks pending domain models) |
| `/dashboard/org`                                                         | Organization dashboard (`TENANT_ADMIN` only)                                    |

## Stack

Next.js 16 (App Router, Turbopack) · Tailwind CSS v4 (custom `packages/ui` components, no Shadcn) · Zustand (client state) · Axios · `@monaco-editor/react` · `lucide-react` / `recharts`. Light/dark theming is driven by a `data-theme` attribute on `<html>` plus a `theme` key in `localStorage`.

## Local development

```bash
# from the repo root
pnpm install
pnpm --filter @elevatesde/web dev     # http://localhost:3001
```

Set `NEXT_PUBLIC_API_URL` in `apps/web/.env.local` (copy from `.env.example`) to match the API origin. The candidate portal expects the `@elevatesde/api` backend running — see the [root README](../../README.md) for the full stack (Postgres, Redis, migrations, seed).

> **Next.js version note:** this app runs a build of Next.js whose APIs may differ from older releases. Check the guides under `node_modules/next/dist/docs/` before touching App Router internals (see `AGENTS.md`).
