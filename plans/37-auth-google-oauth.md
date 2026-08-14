# Feature Plan: Google Sign-In (OAuth/OIDC)

Adds "Sign in with Google" to the candidate web app and the admin console, alongside the existing email/password flow, using the Google Identity Services (GIS) ID-token flow.

---

## 1. Objectives

- Let candidates sign in or sign up on `apps/web` using their Google account, without a server-side redirect.
- Let admins sign in on `apps/admin` using Google, but never create an admin account this way.
- Auto-link a Google identity to an existing password account when the verified email matches.
- Ask first-time Google users to pick Candidate vs Organization (mirroring the existing register form) before an account is created.
- Reuse the existing token issuance, cookie storage, and refresh-interceptor logic untouched.

---

## 2. Flow

1. Browser renders Google's own button (GIS `renderButton`) and receives a signed ID token in a client-side callback — no redirect URI, no client secret in the browser.
2. Frontend POSTs `{ idToken, context }` to `POST /api/v1/auth/google`.
3. NestJS verifies the token's signature/audience/`email_verified` via `google-auth-library`.
4. Resolution:
   - Known `googleId` → issue tokens (`AuthResponseDto`).
   - Known email, no `googleId` → auto-link, issue tokens.
   - Unknown (web context only) → return a short-lived onboarding token; no account created yet.
   - Unknown / non-admin (admin context) → rejected, nothing created.
5. First-time web users submit role (+ company name if Organization) to `POST /api/v1/auth/google/complete`, which creates the `Tenant` (if any) and `User`, then returns `AuthResponseDto`.

---

## 3. Database Schema (Prisma)

`apps/api/prisma/schema.prisma`, `model User`:

```prisma
passwordHash String?
googleId     String? @unique
```

`passwordHash` becomes nullable — a Google-only account has no password. Migration name: `google_oauth_accounts`.

---

## 4. API Use Cases & Endpoints

### Auth Controller (`/api/v1/auth`)

- `POST /google`: Verifies a Google ID token, resolves or auto-links the account, returns either `AuthResponseDto` or an onboarding token.
- `POST /google/complete`: Verifies the onboarding token, creates the tenant (if `TENANT_ADMIN`) and user, returns `AuthResponseDto`.
- `POST /login`: Gains a guard rejecting Google-only accounts (no `passwordHash`) with 401 instead of throwing on `bcrypt.compare`.

---

## 5. Implementation Steps

### Step 5.1: Google Cloud project

1. Create project, configure OAuth consent screen (External, `openid` + `userinfo.email` + `userinfo.profile` scopes only).
2. Create a **Web application** OAuth client with Authorized JavaScript origins for `localhost:3001`, `localhost:3002`, and prod. Leave Authorized redirect URIs empty.
3. Distribute the Client ID (not the secret) to `GOOGLE_CLIENT_ID` (API) and `NEXT_PUBLIC_GOOGLE_CLIENT_ID` (web, admin).

### Step 5.2: Domain & persistence

1. `User` entity: nullable `passwordHash`, new `googleId`, `hasPassword()`, `linkGoogleId()`.
2. `IUsersRepository` / `UsersRepository` / `UserMapper`: `findByGoogleId`, carry `googleId` through mapping and `upsert`.
3. `UsersService`: accept `googleId` in `create()`, add `findByGoogleId` and `linkGoogleAccount`.

### Step 5.3: Token issuance extraction

1. Move `AuthService.generateTokens` into `application/token.service.ts` (`TokenService.issueFor`).
2. `register`/`login`/`refresh` delegate to it; `login` rejects passwordless accounts.

### Step 5.4: Google verification & onboarding

1. `domain/interfaces/google-token-verifier.interface.ts` (abstract class) + `infrastructure/google-token-verifier.ts` (`google-auth-library` `OAuth2Client`).
2. `application/google-auth.service.ts`: resolution order (googleId → email auto-link → onboarding/reject), admin-context rules, onboarding JWT issuance (`purpose: 'GOOGLE_ONBOARDING'`, no `sub`, 10 min expiry) and verification.
3. `presentation/google-auth.controller.ts` + DTOs for both endpoints, registered in `auth.module.ts`.

### Step 5.5: Swagger

1. Annotate both new endpoints with `@ApiOperation`/`@ApiResponse` matching `auth.controller.ts`.

---

## 6. Frontend

- `packages/ui`: `GoogleSignInButton` + a small GIS script-loader/type helper, exported from `index.ts`.
- `apps/web`: `lib/google-auth.ts` API wrappers, `components/RoleToggle.tsx` (extracted from `register/page.tsx`), `components/GoogleOnboardingPanel.tsx`, button + onboarding wired into `login/page.tsx` and `register/page.tsx`.
- `apps/admin`: button wired into `login/page.tsx` with `context: 'ADMIN'`, reusing the existing role guard and toast handling.
- No changes to either app's `proxy.ts` — both already gate on the `accessToken` cookie `setAuth` writes.

---

## 7. Verification Plan

- `prisma migrate dev` + `prisma generate`; `pnpm type-check` / `pnpm lint` across the workspace.
- Manual: new Google user (candidate + organization paths), returning Google user, auto-link against an existing password account, password login against a Google-only account (expect 401, not 500), admin Google sign-in (allowed for `ADMIN`, rejected otherwise, nothing created).
- Confirm both new endpoints appear correctly in Swagger UI at `http://localhost:4400/api/docs`.
