# 42 — Security Hardening & Account Approval

Branch: `feature/security-hardening` (from `origin/main` @ `e9131d8`)

Goal: close every finding from the pre-UAT security review (critical → low), replace the
public demo admin with a private owner account, and require admin approval for every new
registration.

## Decisions (confirmed by owner)

- Next.js upgraded to **16.4.3**; `CLAUDE.md` pin updated accordingly.
- Owner admin credentials live in **`apps/api/.env` only**.
- **Every** new account waits for approval, including invited organisation members.
- httpOnly refresh-cookie migration (#9) is **in scope** for this branch.

---

## Part A — Owner admin account (credentials never committed)

| Item | Change |
| --- | --- |
| Credentials location | `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` in **`apps/api/.env` only** (gitignored, verified with `git check-ignore`). |
| Why not web/admin env | Their `.env.local` vars are `NEXT_PUBLIC_*` and get shipped to the browser. A password there would be readable by anyone. The frontends never need it. |
| `.env.example` / `.env.production.example` | Placeholder keys only: `SEED_ADMIN_EMAIL=""`, `SEED_ADMIN_PASSWORD=""`. |
| `prisma/seed.ts` | Reads admin email + password from env; **fails** if either is missing or password is weak. Removes `admin@elevatesde.dev`. |
| Demo accounts (`candidate@`, `org@`, community members, shared `Password123!`) | Seeded only when `SEED_DEMO_ACCOUNTS="true"` (default `false`, never in production). |
| Existing DB | Seed upserts the owner admin and deletes `admin@elevatesde.dev` if present. |
| Docs | README + `docs/deployment-self-hosted.md` updated: no credentials in docs, explain env-based owner seeding. |
| Git safety | Before every commit: `git diff --cached` grep for the owner email/password must return nothing. |

---

## Part B — Registration approval workflow

### Schema (`prisma/schema.prisma` + migration)

```prisma
enum AccountStatus {
  PENDING_APPROVAL
  ACTIVE
  REJECTED
}

model User {
  status          AccountStatus @default(ACTIVE)
  reviewedAt      DateTime?
  reviewedById    String?
  rejectionReason String?
  reviewedBy      User?  @relation("UserReviews", fields: [reviewedById], references: [id], onDelete: SetNull)
  reviewedUsers   User[] @relation("UserReviews")
  @@index([status, createdAt])
}
```

- Column default `ACTIVE` so **existing users are not locked out** by the migration.
- New sign-ups set `PENDING_APPROVAL` explicitly in code.

### Rules

| Flow | Behaviour |
| --- | --- |
| Email register | Creates user as `PENDING_APPROVAL`, **issues no tokens**, returns `{ status: 'PENDING_APPROVAL' }`. |
| Google sign-up (`/auth/google/complete`) | Same as above. |
| Login / Google sign-in while pending | `403` — "Your account is awaiting approval." |
| Login while rejected | `403` — "Your registration was not approved." |
| `JwtStrategy.validate` + `/auth/refresh` | Reject any non-`ACTIVE` user, so a rejection takes effect within one access-token lifetime (15 min). |
| Owner admin | Seeded as `ACTIVE`; cannot be rejected or demoted by anyone (incl. self). |

### API (all `@Roles(ADMIN)`, audit-logged)

- `GET  /api/v1/admin/users?status=PENDING_APPROVAL` — paginated pending list.
- `GET  /api/v1/admin/users/pending-count` — badge count.
- `PATCH /api/v1/admin/users/:id/approve`
- `PATCH /api/v1/admin/users/:id/reject` — body `{ reason?: string (max 500) }`.
- New in-app notification to all ADMINs on every new registration (existing notification module).
- Approving/rejecting a non-pending user → `409`.

### UI

- **Admin app** — `Users` page gets a "Pending approval" tab (default when count > 0) with
  name, email, requested role, company, signed-up date, **Approve** / **Deny** (deny opens a
  dialog with optional reason). Sidebar "Users" item shows pending count badge.
- **Web app** — after register (email or Google), show a "Pending approval" screen instead of
  redirecting to the dashboard. Login shows the pending/rejected message from the API.

---

## Part C — Fixes from the security review

### Critical

1. **Self-assigned ADMIN on register** — remove `role` from `RegisterDto`; role is derived only
   from `companyName` (`TENANT_ADMIN`) or defaults to `USER`. Add a regression test.
2. **TENANT_ADMIN can edit/delete global problems** — drop `TENANT_ADMIN` from
   `CodingProblemsAdminController` (problems are platform content, ADMIN-only). Admin app
   already hides this for non-ADMINs; verify.
3. **Hardcoded JWT fallback** — new `requireEnv` config helper; API **refuses to boot** if
   `JWT_SECRET` is missing or shorter than 32 chars. Same for `DATABASE_URL`.

### High

4. **Rate limiting** — add `@nestjs/throttler` (global default e.g. 120 req/min/IP) with stricter
   limits: login/register/google/refresh 5–10 per min, `/assessments/run` + `/submit` 10 per min
   per user, mock-interview turns 20 per min. `trust proxy` set so limits use the real client IP
   behind the reverse proxy.
5. **CORS fail-open** — in production, missing `CORS_ALLOWED_ORIGINS` aborts startup; never
   fall back to `origin: true`.
6. **Public Swagger** — mount `/api/docs` only when `NODE_ENV !== 'production'` (or
   `SWAGGER_ENABLED="true"`).
7. **Security headers** — `helmet` on the API; `headers()` in both `next.config.ts` with HSTS,
   `X-Frame-Options: DENY`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`,
   and a CSP that allows Google Identity + Monaco.
8. **Vulnerable dependencies**
   - `next` 16.2.9 → **16.4.3** in web + admin (all critical Next advisories cover ≤ 16.4.0).
     **Requires updating the `16.2.9` pin in `CLAUDE.md`.**
   - `axios` → 1.21.x, `pdfjs-dist` → 6.4.x, `mammoth` → 1.13.x.
   - Transitive (`multer`, `express`/`proxy-addr`, `body-parser`, `@xmldom/xmldom`, `js-yaml`,
     `dompurify`, `postcss`, `sharp`) via `pnpm.overrides` (stay on Nest 11).
   - Target: `pnpm audit --prod` shows **0 critical / 0 high**; anything unfixable documented.

### Medium

9. **JS-readable auth cookies** — move refresh token to an `httpOnly; Secure; SameSite=Strict`
   cookie set by the API (`/auth/refresh` and `/auth/logout` read it from the cookie); access
   token stays short-lived in memory/JS cookie for the Next proxy redirect. CSRF covered by
   `SameSite=Strict` + CORS allow-list on the refresh endpoint.
   > This is the largest change in the plan. It touches `api-client` and both apps.
10. **Unvalidated role in `PATCH /admin/users/:id/role`** — proper DTO with `@IsEnum(UserRole)`;
    block changing the owner admin.
11. **Password policy** — min 10 chars with letters + digits on register (login keeps accepting
    existing passwords); bcrypt cost fixed at 12.
12. **Generic auth errors** — login no longer reveals whether an email exists or uses Google
    ("Invalid credentials" for both); register returns the same pending response for
    already-registered emails to stop account enumeration.

### Low

13. **Sandbox runs as root** — add `--user 65534:65534` to `buildDockerRunArgs`.
14. **Hidden test inputs readable from `cases.json`** — run only the public cases' inputs on
    `/run`; on `/submit` keep hidden inputs but mount `cases.json` read-only and delete the
    file from inside the harness after it is loaded into memory before user code executes.
15. **Request body size** — explicit `json` limit (1 MB) on the API.
16. Full IDOR sweep of all ~30 controllers (ownership checks) — fix anything found.

---

## Testing

- Unit tests: register role stripping, pending/rejected login, JWT strategy status check,
  approve/reject service, owner protection, throttler config, docker run args.
- `pnpm type-check`, `pnpm lint`, `pnpm test`, `pnpm build` all green.
- Manual: register → pending screen → admin approves → user logs in; deny path; rate limit
  returns 429; `/api/docs` 404 in prod mode; `pnpm audit --prod` result recorded.

## Commit order

1. Plan + owner admin seeding (Part A)
2. Critical fixes 1–3
3. Approval workflow backend → admin UI → web UI
4. High fixes 4–8
5. Medium 9–12, Low 13–16
