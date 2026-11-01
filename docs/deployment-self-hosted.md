# Self-Hosted Deployment Runbook

Backend (API, Postgres, Redis, Docker code sandbox, Ollama) on an Ubuntu laptop, exposed through Tailscale Funnel. Web and admin on Vercel. Background and reasoning: `plans/41-self-hosted-deployment.md`.

This file is written so an AI coding agent on the Ubuntu laptop can execute it end to end. Humans can follow it too.

---

## 0. Instructions for the AI agent

Read this whole file first, then run the phases in order. Do not skip a verification gate.

**Ground rules**
- Work in the cloned repo on branch `main` (after the deployment PR is merged) or on `feature/self-hosted-deployment` before it is.
- Never print, log, or commit secrets. Generate secrets with `openssl rand -base64 48`.
- Never commit `.env` files. They are gitignored on purpose.
- Do not change application code to make a step pass. If a step fails, diagnose it, and report the cause to the user if it cannot be fixed by configuration.
- Prefer the exact commands below. Ask the user only for items marked **HUMAN**.

**HUMAN steps (the agent cannot do these, stop and ask the user, then continue)**
1. Sudo password, if sudo prompts for one.
2. `sudo tailscale up` login in a browser, and enabling HTTPS certificates and Funnel in the Tailscale admin console.
3. `vercel login` in a browser.
4. Adding the Vercel URLs to the Google OAuth client in Google Cloud Console (only if Google sign-in is wanted).

**Values to collect and keep in a scratch note (outside the repo)**

| Name | Where it comes from |
|---|---|
| `DB_PASSWORD` | generated in phase 3 |
| `JWT_SECRET` | generated in phase 3 |
| `API_URL` | `https://<machine>.<tailnet>.ts.net`, printed by Tailscale in phase 5 |
| `ADMIN_URL` | Vercel admin project production URL, phase 6 |
| `WEB_URL` | Vercel web project production URL, phase 6 |

**Phase order:** 1 laptop prerequisites, 2 keep awake, 3 backend, 4 Ollama, 5 Tailscale, 6 Vercel, 7 wire CORS, 8 backups, 9 smoke test. Section 10 is the checklist for switching to a custom domain later.

---

## 1. Laptop prerequisites

```bash
sudo apt update && sudo apt install -y git curl ca-certificates openssl
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker "$USER"
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pnpm@10.33.0 pm2 vercel
```

The `docker` group applies after a new login. In the same shell use `newgrp docker`, or prefix with `sudo` until then.

```bash
docker pull node:20-alpine
docker pull python:3.12-alpine
docker pull gcc:13
```

The three images are the code-execution sandbox languages (JavaScript, Python, C++). Pull them now so the first submission does not time out downloading.

**Gate:** `docker run --rm hello-world`, `node -v` (v24 LTS; do not use odd-numbered or pre-release Node versions), `pnpm -v`, `pm2 -v` all succeed.

---

## 2. Keep the laptop awake

```bash
sudo systemctl mask sleep.target suspend.target hibernate.target hybrid-sleep.target
sudo sed -i 's/^#\?HandleLidSwitch=.*/HandleLidSwitch=ignore/' /etc/systemd/logind.conf
sudo sed -i 's/^#\?HandleLidSwitchExternalPower=.*/HandleLidSwitchExternalPower=ignore/' /etc/systemd/logind.conf
sudo systemctl restart systemd-logind
sudo systemctl enable docker
```

Keep the laptop on power, ideally on ethernet.

**Gate:** `systemctl status sleep.target` shows `masked`.

---

## 3. Backend

### 3.1 Get the code and install

```bash
git clone https://github.com/rizonkumar/elevateSDE.git
cd elevateSDE
pnpm install
```

### 3.2 Secrets and env files

```bash
DB_PASSWORD="$(openssl rand -hex 24)"
JWT_SECRET="$(openssl rand -base64 48 | tr -d '\n')"
echo "POSTGRES_PASSWORD=$DB_PASSWORD" > .env
cp apps/api/.env.production.example apps/api/.env
```

Edit `apps/api/.env` and set:
- `DATABASE_URL="postgresql://postgres:<DB_PASSWORD>@127.0.0.1:5432/elevatesde"`
- `JWT_SECRET="<JWT_SECRET>"` (the API refuses to start if it is shorter than 32 characters)
- `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD` for the owner admin (see 3.5). Type them on the server only.
- `CORS_ALLOWED_ORIGINS="https://placeholder.invalid"` for now. In production the API refuses to start without an explicit origin list; phase 7 replaces it with the real Vercel URLs.
- Leave `WEB_APP_URL` for phase 7.
- Keep `SWAGGER_ENABLED="false"` (API docs are off in production) and `TRUST_PROXY="1"` (see the rate-limit check in section 9).
- Leave the `MOCK_INTERVIEW_AI_*` values as they are if Ollama will be installed in phase 4. Otherwise set `MOCK_INTERVIEW_AI_ENABLED="false"`.

### 3.3 Start Postgres and Redis

```bash
docker compose -f docker-compose.prod.yml up -d
docker compose -f docker-compose.prod.yml ps
```

**Gate:** both containers show `healthy`.

### 3.4 Migrate and seed

```bash
pnpm --filter @elevatesde/api db:generate
pnpm --filter @elevatesde/api db:migrate
pnpm --filter @elevatesde/api db:seed
pnpm --filter @elevatesde/api db:seed:runnable
```

What the seeds load:
- `db:seed`: demo users, feature flags, badges, forum community content, and the **coding problem bank of 2,788 LeetCode-style problems** (`apps/api/prisma/seed-data/leetcode/problems.dataset.json`, committed to the repo).
- `db:seed:runnable`: the problems that have real test cases and can actually be executed in the Docker sandbox (slug prefix `rp-`). Without this step, problems show up but code submissions cannot be judged.
- `db:seed:problems` is only needed to re-seed problems on their own. `db:seed` already includes it.

All seeds are idempotent and safe to re-run.

**Gate:** run

```bash
docker exec elevatesde-postgres psql -U postgres -d elevatesde -c 'select count(*) from "Problem";'
```

and expect a count of about 2,788 or more. If the table name differs, check `apps/api/prisma/schema.prisma` for the model's mapped name.

### 3.5 Owner admin account (required before the API is public)

The seed creates exactly one admin from `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD` in `apps/api/.env`, and refuses to run if either is missing. Set them on the server only; never commit them and never put them in the web or admin env files (those are exposed to the browser).

Keep `SEED_DEMO_ACCOUNTS="false"` in production. Demo accounts with the public password `Password123!` are never seeded when `NODE_ENV=production`. If an older database still has `*@elevatesde.dev` demo accounts, disable them:

```bash
cd apps/api
NEW_HASH="$(node -e "require('bcrypt').hash(process.argv[1], 12).then(h => process.stdout.write(h))" "$(openssl rand -base64 18)")"
docker exec elevatesde-postgres psql -U postgres -d elevatesde -c "update \"User\" set \"passwordHash\" = '$NEW_HASH', status = 'REJECTED' where email like '%@elevatesde.dev';"
cd ../..
```

Every new registration stays in `PENDING_APPROVAL` until the owner approves it from **Users → Pending approval** in the backoffice.

On a server that was already deployed, set both variables and run `pnpm --filter @elevatesde/api db:migrate && pnpm --filter @elevatesde/api db:seed` once. The migration keeps every existing account active; the seed creates or updates the owner admin and deletes `admin@elevatesde.dev`.

### 3.6 Build and run the API

```bash
pnpm --filter @elevatesde/api build
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup
```

Run the command that `pm2 startup` prints (it needs sudo).

**Gate:** `curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:4400/api/v1/problems` returns `401` (the API is up and requires sign-in), `curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:4400/api/docs` returns `404` (docs are off in production), and `pm2 status` shows `elevatesde-api` as `online`. If pm2 shows it errored, `pm2 logs elevatesde-api` names the missing or weak env var.

---

## 4. Ollama (local AI)

Skip this phase if `MOCK_INTERVIEW_AI_ENABLED="false"`.

```bash
curl -fsSL https://ollama.com/install.sh | sh
sudo systemctl edit ollama
```

In the editor that opens, add:

```
[Service]
Environment="OLLAMA_KEEP_ALIVE=24h"
```

Then:

```bash
sudo systemctl restart ollama
ollama pull qwen2.5:7b-instruct
```

**Gate:**

```bash
curl -s http://127.0.0.1:11434/v1/chat/completions \
  -d '{"model":"qwen2.5:7b-instruct","response_format":{"type":"json_object"},"messages":[{"role":"user","content":"Return {\"ok\": true}"}]}'
```

returns JSON containing `"ok": true` (the first call can take a while to load the model).

```bash
pm2 restart elevatesde-api --update-env
```

Model notes: with 24–32 GB RAM, `qwen2.5:14b-instruct` also fits and scores better but is slower. A turn takes roughly 20–40 seconds on CPU, which is why the timeouts in `.env` are 90 s and 120 s. If a model returns invalid JSON, the API silently falls back to the built-in interviewer for that turn. Check `pm2 logs elevatesde-api` for `Falling back to deterministic` to see how often.

---

## 5. Tailscale Funnel (public HTTPS for the API)

```bash
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up
```

**HUMAN:** complete the login in the browser. In the Tailscale admin console (https://login.tailscale.com/admin/dns) enable **MagicDNS** and **HTTPS Certificates**, and in the access controls allow **Funnel** for this machine.

```bash
sudo tailscale funnel --bg 4400
tailscale funnel status
```

`tailscale funnel status` prints `https://<machine>.<tailnet>.ts.net`. That is `API_URL`.

**Gate:** from a different network (a phone on mobile data), `https://<API_URL>/api/docs` loads. From the laptop itself `curl -sI "$API_URL/api/docs"` should return `200`.

---

## 6. Vercel (web and admin)

Deploy **admin first**, because the web project needs the admin URL.

### 6.1 Login

```bash
vercel login
```

**HUMAN:** complete the browser login.

### 6.2 Create two projects (dashboard, once)

In the Vercel dashboard, import the GitHub repository `rizonkumar/elevateSDE` twice:

| Project name | Root Directory | Framework |
|---|---|---|
| `elevatesde-admin` | `apps/admin` | Next.js |
| `elevatesde-web` | `apps/web` | Next.js |

For both projects:
- Turn on **Include source files outside of the Root Directory in the Build Step** (the workspace packages in `packages/` live outside the root directory).
- Production Branch: `main`.
- Leave Build Command and Output Directory on their defaults. The install runs at the repo root with pnpm, detected from `pnpm-lock.yaml` and the `packageManager` field.

### 6.3 Admin environment variables, then deploy

```bash
cd apps/admin
vercel link --yes --project elevatesde-admin
printf '%s' "$API_URL" | vercel env add NEXT_PUBLIC_API_URL production
printf '%s' "" | vercel env add NEXT_PUBLIC_GOOGLE_CLIENT_ID production
vercel deploy --prod
cd ../..
```

Skip the Google line if Google sign-in is not being set up (an empty value is fine, or skip it).

The admin app uses `basePath: '/admin'`, so it is served at `https://<admin-project>.vercel.app/admin`. Record `ADMIN_URL` as `https://<admin-project>.vercel.app` (no `/admin`).

**Gate:** `curl -sI "$ADMIN_URL/admin"` returns `200` or a redirect to the admin login page.

### 6.4 Web environment variables, then deploy

```bash
cd apps/web
vercel link --yes --project elevatesde-web
printf '%s' "$API_URL" | vercel env add NEXT_PUBLIC_API_URL production
printf '%s' "$ADMIN_URL" | vercel env add ADMIN_APP_URL production
printf '%s' "" | vercel env add NEXT_PUBLIC_GOOGLE_CLIENT_ID production
vercel deploy --prod
cd ../..
```

`ADMIN_APP_URL` must have no trailing slash and no `/admin`. The web app rewrites `/admin/*` to it.

Record `WEB_URL` (the production URL printed by the deploy).

**Gate:** `curl -sI "$WEB_URL"` returns `200`, and `$WEB_URL/admin` reaches the admin app.

If the build fails with an unresolved `@elevatesde/*` import, the "Include source files outside of the Root Directory" setting is off. Turn it on and redeploy.

### 6.5 Google OAuth (only if Google sign-in is wanted)

**HUMAN:** in Google Cloud Console, add `WEB_URL` and `ADMIN_URL` to the OAuth client's **Authorized JavaScript origins**. Put the client ID in `GOOGLE_CLIENT_ID` in `apps/api/.env` and `NEXT_PUBLIC_GOOGLE_CLIENT_ID` in both Vercel projects (`vercel env add`, then redeploy with `vercel deploy --prod`).

---

## 7. Wire the API to the deployed frontends

Edit `apps/api/.env`:

```
WEB_APP_URL="<WEB_URL>"
CORS_ALLOWED_ORIGINS="<WEB_URL>,<ADMIN_URL>"
```

```bash
pm2 restart elevatesde-api --update-env
```

**Gate:** from a browser on `WEB_URL`, the sign-up and sign-in requests to `API_URL` succeed with no CORS error in the browser console.

---

## 8. Backups

```bash
crontab -l 2>/dev/null; echo "0 3 * * * $HOME/elevateSDE/scripts/backup-postgres.sh >> $HOME/elevatesde-backup.log 2>&1" | crontab -
```

Adjust the path if the repo was cloned elsewhere.

**Gate:** run `~/elevateSDE/scripts/backup-postgres.sh` once and confirm a `.sql.gz` file appears in `~/elevatesde-backups`.

---

## 9. Smoke test

Report pass or fail for each item.

1. `WEB_URL` loads and the landing page renders.
2. Register a new account. The web app shows "Registration received" and signing in says the account is awaiting approval.
   Sign in to `WEB_URL/admin` as the owner admin, open **Users → Pending approval**, approve the account, then sign in with it on `WEB_URL`.
3. The dashboard loads with no failed API calls.
4. The problem list shows the seeded problems, and a `rp-` problem opens in the editor.
5. Submit a correct solution to a `rp-` problem. It should be judged through the Docker sandbox (check `docker ps -a` briefly shows `elevate-*` containers, and `pm2 logs` has no sandbox errors).
6. Start a mock interview and finish it through to the report. Check `pm2 logs elevatesde-api` for `Falling back to deterministic` to see whether the model answered.
7. `WEB_URL/admin` loads the admin login. Sign in with the admin account from step 3.5.
8. `pm2 logs elevatesde-api` shows scheduler startup with no errors.
9. Rate limiting sees real client IPs. From two different networks (for example laptop Wi-Fi and a phone on mobile data), try signing in with a wrong password 11 times on one of them. Only that network should get `429 Too Many Requests`; the other must still be able to sign in. If both are blocked, the API sees every visitor as the same proxy IP: change `TRUST_PROXY` in `apps/api/.env` (try `2`) and `pm2 restart elevatesde-api --update-env`.

---

## 10. Moving to a custom domain (CORS and origins)

The API never allows every origin. In production it **refuses to start** unless `CORS_ALLOWED_ORIGINS` lists the exact web origins, and there is no `*` fallback. Until a domain is ready, list the Vercel URLs from phase 7. When the domain arrives, change every item below in one go. Missing one breaks sign-in or Google login.

Example: web on `https://elevatesde.com`, admin served at `https://elevatesde.com/admin` (through the web rewrite), API on `https://api.elevatesde.com`.

| Where | Setting | New value |
| --- | --- | --- |
| `apps/api/.env` (server) | `CORS_ALLOWED_ORIGINS` | `https://elevatesde.com,https://www.elevatesde.com`. Exact scheme and host, no trailing slash, no paths, never `*`. Add the admin Vercel origin only if people open it directly instead of through `/admin`. |
| `apps/api/.env` (server) | `WEB_APP_URL` | `https://elevatesde.com` (used in invitation links) |
| `apps/api/.env` (server) | `TRUST_PROXY` | Re-run smoke test 9 if a new proxy or CDN now sits in front of the API |
| Vercel web project | `NEXT_PUBLIC_API_URL` | `https://api.elevatesde.com`, then **redeploy**. The value is baked in at build time and also feeds the CSP `connect-src`, so the browser blocks API calls to any other host. |
| Vercel admin project | `NEXT_PUBLIC_API_URL` | Same API URL, then **redeploy** |
| Vercel web project | `ADMIN_APP_URL` | Admin project URL (unchanged unless the admin project moves) |
| Vercel | Domains | Attach the domain to the web project |
| Google Cloud Console | OAuth client, Authorized JavaScript origins | Add `https://elevatesde.com` (and `www`), and remove old URLs once they are no longer used |

Then on the server:

```bash
pm2 restart elevatesde-api --update-env
```

**Gate:**

```bash
curl -s -o /dev/null -D - -X OPTIONS https://api.elevatesde.com/api/v1/auth/login \
  -H 'Origin: https://elevatesde.com' -H 'Access-Control-Request-Method: POST' | grep -i access-control-allow-origin
curl -s -o /dev/null -D - -X OPTIONS https://api.elevatesde.com/api/v1/auth/login \
  -H 'Origin: https://evil.example' -H 'Access-Control-Request-Method: POST' | grep -i access-control-allow-origin
```

The first command prints `access-control-allow-origin: https://elevatesde.com`. The second prints nothing.

**What CORS does and does not do:** CORS only stops *browsers on other websites* from calling the API on behalf of signed-in users. The API URL stays reachable from the internet, so scripts and tools like `curl` can still send requests. Those requests are protected by sign-in (JWT), the admin approval gate for new accounts, role checks, and rate limiting, not by CORS.

## 11. Updating after code changes

```bash
cd ~/elevateSDE
git pull
pnpm install
pnpm --filter @elevatesde/api db:generate
pnpm --filter @elevatesde/api db:migrate
pnpm --filter @elevatesde/api build
pm2 restart elevatesde-api --update-env
```

The Vercel projects redeploy automatically on every push to `main`. Pushes to other branches create preview URLs, but those previews call the same `API_URL`, and the API only allows origins listed in `CORS_ALLOWED_ORIGINS`, so previews will be blocked by CORS unless added there.

---

## 12. Troubleshooting

| Symptom | Likely cause and fix |
|---|---|
| Browser console shows a CORS error | `CORS_ALLOWED_ORIGINS` is missing the exact origin (scheme and host, no trailing slash). Fix and `pm2 restart elevatesde-api --update-env`. |
| `/api/docs` works locally but not through the tunnel | Funnel not enabled for the machine, or `tailscale funnel status` shows nothing. Re-run `sudo tailscale funnel --bg 4400`. |
| Code submissions hang or fail | The API user is not in the `docker` group, or sandbox images are not pulled. `docker ps` as the pm2 user, and re-run the pulls from phase 1. |
| Mock interview never uses the model | Wrong endpoint (it must end in `/v1/chat/completions`), model not pulled, or timeouts too short. Check `pm2 logs` and `ollama list`. |
| API stops after reboot | `pm2 startup` was not run, or `pm2 save` was skipped. Repeat both. |
| Vercel build cannot resolve `@elevatesde/ui` or `@elevatesde/api-client` | "Include source files outside of the Root Directory" is off. |
| Prisma errors about a missing table | `db:migrate` was not run against the right `DATABASE_URL`. Check `apps/api/.env`. |
