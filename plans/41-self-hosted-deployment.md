# Feature Plan: Self-Hosted Deployment (Laptop Backend + Vercel Frontend)

> **Status: IMPLEMENTED IN REPO, laptop and Vercel setup pending (follow `docs/deployment-self-hosted.md`).** Branch: `feature/self-hosted-deployment`. Tunnel: Tailscale Funnel. Laptop: Ubuntu, 24–32 GB RAM, 512 GB SSD. AI: Ollama.

Take ElevateSDE live at zero cost with no real users yet. `web` and `admin` run on Vercel. The API, Postgres, Redis, the Docker code sandbox, and an optional local AI model run on a second laptop (Ubuntu) and are exposed over HTTPS through a tunnel. The goal is a live production-like URL to test on and share for feedback, with a clean path to a small cloud host later.

---

## 1. Objectives

- Public HTTPS URLs for `web` and `admin`, backed by the laptop API.
- Everything the app does today keeps working live: auth, Google OAuth, queues, scheduler, code execution, AI mock interview.
- The backend setup is reproducible from the repo (compose file, env template, one runbook), so it can be rebuilt on a cloud VM.
- Downtime when the laptop sleeps or goes offline is acceptable, but it should be avoidable by configuration.

### Out of scope
- High availability, autoscaling, real user data guarantees.
- A feedback feature inside the product. Feedback is collected outside the app (a shared link and a form) for now.
- Moving the API to true serverless (see section 9 for why that is not a fit).

---

## 2. Target Architecture

```
Browser
  ├─ https://<web>.vercel.app          Vercel project 1  (apps/web)
  ├─ https://<admin>.vercel.app/admin  Vercel project 2  (apps/admin)
  └─ https://api.<host>                Tunnel (Cloudflare Tunnel or Tailscale Funnel)
                                          │
                                  Ubuntu laptop
                                    ├─ NestJS API   (host process, pm2 or systemd)   :4400
                                    ├─ Postgres 16  (docker compose)                 127.0.0.1:5432
                                    ├─ Redis 7      (docker compose)                 127.0.0.1:6379
                                    ├─ Docker daemon (code sandbox containers)
                                    └─ Ollama       (optional, local LLM)            127.0.0.1:11434
```

### Key findings from the codebase that shape this plan

| Finding | Consequence |
|---|---|
| Auth is Bearer token, session cookies are set client-side by `js-cookie` on the web origin (`packages/api-client/src/session-store.ts`) | No cross-site cookie problem. Web and API do not need a shared parent domain. |
| CORS is `origin: true, credentials: true` (`apps/api/src/main.ts`) | Works as is. Restricted through `CORS_ALLOWED_ORIGINS` in production. |
| `DockerSandboxRunner` spawns `docker run` and bind-mounts a temp workdir | The API must run on the host, or get the Docker socket plus an identical workdir path. The plan runs the API on the host. |
| Queues (BullMQ) and the scheduler need a long-running process | Rules out sleeping or serverless hosts for the API. |
| `apps/web/next.config.ts` rewrites `/admin/*` to `http://localhost:3002` | Breaks on Vercel. The destination must come from an env var. |
| Mock interview and readiness AI use an OpenAI-compatible endpoint (`MOCK_INTERVIEW_AI_*`, `READINESS_AI_*`) | Ollama exposes `/v1` in that format, so a local model works with env changes only. |

---

## 3. Decisions (resolved)

1. **Tunnel:** Tailscale Funnel. Free, no domain, stable `https://<machine>.<tailnet>.ts.net`. Move to Cloudflare plus a domain later if wanted.
2. **Laptop OS:** Ubuntu.
3. **AI:** Ollama with an open-weight model on the laptop (24–32 GB RAM). See section 7.

---

## 4. Code and Config Changes

Small and mostly config. No schema changes.

1. `apps/web/next.config.ts`: read the admin rewrite destination from `ADMIN_APP_URL`, defaulting to `http://localhost:3002` for local dev.
2. `docker-compose.prod.yml` (new, repo root): Postgres and Redis only, bound to `127.0.0.1`, with `restart: unless-stopped`, named volumes, passwords from env, and a Postgres healthcheck.
3. `apps/api/.env.production.example` (new): all production variables with placeholders, including the AI vars.
4. `apps/web/.env.production.example` and `apps/admin/.env.production.example` (new): `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_WEB_URL`, `NEXT_PUBLIC_GOOGLE_CLIENT_ID`, `ADMIN_APP_URL`.
5. `apps/api/src/modules/mock-interview/infrastructure/interviewers/openai-compatible-mock-interviewer.ts`: make the turn and summary timeouts configurable through `MOCK_INTERVIEW_AI_TURN_TIMEOUT_MS` and `MOCK_INTERVIEW_AI_SUMMARY_TIMEOUT_MS`. The current fixed 15 s and 30 s limits are too short for a CPU-only local model, and every timeout silently falls back to the deterministic interviewer, which would hide whether the model works at all.
6. `apps/api/src/main.ts`: restrict CORS to the origins listed in `CORS_ALLOWED_ORIGINS` when set, otherwise keep `origin: true`. Keeps local dev unchanged.
7. `ecosystem.config.cjs` (new, repo root): pm2 process definition for the API. Alternative: a systemd unit documented in the runbook.
8. `docs/deployment-self-hosted.md` (new): the runbook in section 5, with copy-paste commands.
9. `scripts/backup-postgres.sh` (new): nightly `pg_dump` with 7-day retention, scheduled by cron.

All code follows the repo rules: no comments in code, strict TypeScript, no `any`.

---

## 5. Runbook Outline (what the laptop setup looks like)

### 5.1 Laptop prerequisites
- Ubuntu LTS, Node 20+, pnpm 10, Docker Engine and the compose plugin, git.
- Add the service user to the `docker` group (the sandbox needs it).
- Pre-pull sandbox images: `node:20-alpine`, `python:3.12-alpine`, `gcc:13`.

### 5.2 Keep it awake
- `sudo systemctl mask sleep.target suspend.target hibernate.target hybrid-sleep.target`
- Set `HandleLidSwitch=ignore` in `/etc/systemd/logind.conf`.
- Keep it on power. Use ethernet if possible.
- Boot-time recovery: Docker and pm2 start on boot (`pm2 startup`, `systemctl enable docker`), so a reboot or power cut self-heals.

### 5.3 Backend
1. Clone the repo, `pnpm install`.
2. Copy `.env.production.example` to `apps/api/.env` and fill in secrets. `JWT_SECRET` must be a long random value.
3. `docker compose -f docker-compose.prod.yml up -d`.
4. `pnpm --filter @elevatesde/api db:generate && pnpm --filter @elevatesde/api db:migrate` (this is `prisma migrate deploy`, not `migrate dev`).
5. Seed once: `db:seed`, `db:seed:problems`, `db:seed:runnable`.
6. `pnpm --filter @elevatesde/api build`, then `pm2 start ecosystem.config.cjs && pm2 save`.
7. Smoke test locally: `curl http://127.0.0.1:4400/api/docs`.

### 5.4 Tunnel (Tailscale Funnel)
- Install Tailscale, run `sudo tailscale up`, enable HTTPS and Funnel for the tailnet in the admin console (one-time).
- `sudo tailscale funnel --bg 4400` publishes `https://<machine>.<tailnet>.ts.net` to the public internet with a managed certificate.
- Note the URL and use it as `NEXT_PUBLIC_API_URL` in Vercel.
- Funnel is served on port 443 only, which is what browsers expect, so no port suffix is needed.
- Verify from another network (phone on mobile data): `https://<tunnel-url>/api/docs`.

### 5.5 Frontend on Vercel
- Two Vercel projects from the same repo, root directories `apps/web` and `apps/admin`, with the monorepo install command using pnpm.
- Env vars per section 4 items 3 and 4. `NEXT_PUBLIC_API_URL` is the tunnel URL.
- `ADMIN_APP_URL` on the web project is the admin Vercel URL, so `/admin/*` rewrites correctly.
- Production branch is `main`. Pushes to other branches give free preview URLs, which are handy for sharing feature branches.

### 5.6 Google OAuth
- Add the Vercel web and admin origins to the OAuth client's authorized JavaScript origins in Google Cloud Console, and set `GOOGLE_CLIENT_ID` and `NEXT_PUBLIC_GOOGLE_CLIENT_ID`.

---

## 6. Testing Live Production and Collecting Feedback

- **Smoke checklist** (run after every deploy): sign up, sign in, Google sign in, dashboard load, submit a coding problem (exercises Docker sandbox and queue), run a mock interview to the report, admin login, scheduler job visible in logs.
- **Browser and device pass:** desktop, phone on mobile data, a second browser profile.
- **Feedback:** share the Vercel URL with a short note and a Google Form or a simple issue template. Create a few seeded test accounts so reviewers can skip signup. In-app feedback is a possible later feature.
- **Observability:** `pm2 logs`, `docker compose logs`, and Vercel's function and build logs are enough for this phase.

---

## 7. Local AI Model (Ollama)

The mock interviewer calls any OpenAI-compatible chat completions endpoint. The endpoint value is used as the **full URL** (the code does not append a path), so it must include `/chat/completions`.

```
MOCK_INTERVIEW_AI_ENABLED=true
MOCK_INTERVIEW_AI_ENDPOINT=http://127.0.0.1:11434/v1/chat/completions
MOCK_INTERVIEW_AI_API_KEY=ollama
MOCK_INTERVIEW_AI_MODEL=qwen2.5:7b-instruct
MOCK_INTERVIEW_AI_TURN_TIMEOUT_MS=90000
MOCK_INTERVIEW_AI_SUMMARY_TIMEOUT_MS=120000
```

`INTERVIEW_READINESS_AI_ENABLED` and `READINESS_AI_*` use the same pattern for the readiness narrative.

### Model choice for 24–32 GB RAM

| Model (Ollama tag) | Size in RAM (Q4) | Use |
|---|---|---|
| `qwen2.5:7b-instruct` | about 5 GB | **Default.** Strong at following JSON output formats, which this feature needs. |
| `llama3.1:8b` | about 5 GB | Alternative if Qwen's tone feels off. |
| `qwen2.5:14b-instruct` | about 9 GB | Better scoring and follow-ups. Fits in 24 GB but is about half the speed on CPU. |
| `llama3.2:3b` | about 2 GB | Fast smoke-test model only. Quality is poor. |

Run `ollama list` and the Ollama library page for newer releases before pulling. Any instruct model with reliable JSON output works through the same env vars.

### Setup
1. `curl -fsSL https://ollama.com/install.sh | sh` (installs a systemd service on `127.0.0.1:11434`).
2. `ollama pull qwen2.5:7b-instruct`
3. Keep the model loaded so the first interview turn is not a cold start: set `OLLAMA_KEEP_ALIVE=24h` in the service environment (`sudo systemctl edit ollama`).
4. Verify JSON mode: `curl http://127.0.0.1:11434/v1/chat/completions -d '{"model":"qwen2.5:7b-instruct","response_format":{"type":"json_object"},"messages":[{"role":"user","content":"Return {\"ok\": true}"}]}'`.

### Expectations and risks
- CPU-only, a 7B model produces roughly 5–10 tokens per second. One scored answer (scores, feedback, follow-up) is about 150 tokens, so expect roughly 20–40 seconds per turn. That is why the timeouts are raised. If a GPU is present, Ollama uses it automatically and this drops to a few seconds.
- The model can return malformed JSON or scores outside the rubric. The parsers reject those and `ResilientMockInterviewer` falls back to the deterministic interviewer for that turn. During testing, watch the API logs to see how often the fallback fires. If it fires often, switch model.
- The Docker sandbox and the model share the same CPU and RAM. Concurrent use is slow, which is fine for a no-user phase.
- "OpenCode" is a coding-agent CLI, not a model server. Ollama is the piece that serves the model here. OpenCode itself can also be pointed at the same Ollama instance for development work if you want that.
- Fallback if the model is too slow: leave `MOCK_INTERVIEW_AI_ENABLED=false` (deterministic interviewer), or point the same env vars at a hosted free-tier OpenAI-compatible API. No code change either way.

---

## 8. Risks and Mitigations

| Risk | Mitigation |
|---|---|
| Laptop sleeps, loses power or network | Sleep masked, boot-time services, UPS-style discipline. Downtime is acceptable at zero users. |
| Home IP or router issues | Tunnels use outbound connections only, so no port forwarding and no exposed home IP. |
| Data loss on a single laptop disk | Nightly `pg_dump` with a copy to another machine or cloud storage. |
| Postgres or Redis exposed to the LAN | Bind to `127.0.0.1` only. Replace `password123`. |
| Code sandbox escape on a personal machine | Existing run flags (`run-flags.ts`) apply. Run on a dedicated user, review flags for network disabled, memory and pid limits, and read-only root. Do not store personal data on this laptop. |
| Swagger exposed publicly at `/api/docs` | Acceptable now. Disable or protect it before real users. |
| Vercel Hobby is non-commercial only | Fine now. Revisit before launch. |
| Tailscale Funnel URL changes if the host is replaced | Move to Cloudflare plus a domain when it matters. |

---

## 9. Migration Path Off the Laptop

The API is not a fit for true serverless (Lambda, Vercel Functions, Cloud Run scale-to-zero) because it needs a persistent BullMQ worker, a scheduler, and Docker for code execution. The practical path is:

1. **Frontends:** already on Vercel, no change.
2. **Database:** `pg_dump` from the laptop, restore into Neon or Supabase (free tier), update `DATABASE_URL`.
3. **Redis:** move to Upstash (free tier), update `REDIS_URL`. Confirm BullMQ works with the chosen TLS and eviction settings first.
4. **API:** move the host process to a small always-on VM (Oracle Always Free ARM VM, or a ~$5 VPS), using the same runbook. Docker sandbox keeps working there. Cloud container platforms without a Docker daemon would need the code runner swapped for a hosted executor (Judge0 or Piston), which is a separate feature.
5. **Cutover:** change `NEXT_PUBLIC_API_URL` in Vercel (or repoint `api.<domain>` DNS if using a domain, which makes this a zero-frontend-change swap).
6. **AI:** run Ollama on the VM if it has the RAM, otherwise use a hosted OpenAI-compatible provider through the env vars.

---

## 10. Task List

- [x] Confirm decisions in section 3
- [x] Configurable AI timeouts in the mock interviewer
- [x] `ADMIN_APP_URL` rewrite in `apps/web/next.config.ts`
- [x] CORS allowlist from env in `apps/api/src/main.ts`
- [x] `docker-compose.prod.yml`
- [x] Production env templates for api, web, admin
- [x] `ecosystem.config.cjs` for pm2
- [x] `scripts/backup-postgres.sh`
- [x] `docs/deployment-self-hosted.md` runbook
- [ ] Laptop setup (keep awake, Docker, images, services on boot)
- [ ] Backend up: compose, migrate, seed, build, pm2
- [ ] Tunnel up and verified from an external network
- [ ] Two Vercel projects deployed with env vars
- [ ] Google OAuth origins updated
- [ ] Optional: Ollama installed and model chosen
- [ ] Live smoke checklist passes
- [ ] Share URL and collect feedback
