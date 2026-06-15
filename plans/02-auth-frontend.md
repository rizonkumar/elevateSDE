# Feature Plan: User Authentication & UI Integration (Frontend)

Implementation details for client-side authentication, state management, form validation, page layouts, and middleware routing guards in the Next.js frontend client (`apps/web`).

---

## 1. Objectives

- Integrate the portfolio design token set (near-black `#020617`, sky-400 accent, slate borders, and custom buttons/cards/typography) into `globals.css`.
- Implement state management using Zustand for tracking authentication tokens (`accessToken`, `refreshToken`) and active `user` profiles.
- Create login and registration pages using custom-built validation controls (no Shadcn UI).
- Configure Next.js Middleware to enforce route guards (protecting `/dashboard` and redirecting authenticated sessions away from `/login`/`/register`).
- Implement an API interceptor client (Axios) to handle JWT refreshing automatically.

---

## 2. Design & Styling System (globals.css)

We will define custom CSS variables and utility classes inside `apps/web/src/app/globals.css` based on your provided token definitions:

- **Colors:** Near-black background (`#020617`), light text (`#e5e7eb`), accent sky-400 (`#38bdf8`), and border (`rgba(148, 163, 184, 0.2)`).
- **Base Layout:** Max-width page wrapper (`960px`), cards with top-left radial gradients, and clamp-based scalable headings.
- **Custom UI:** Reusable buttons (`btn-primary`, `btn-ghost`), inputs, and cards.

---

## 3. Client State & API Interceptor

### Auth Store (Zustand)

We will maintain auth state in `apps/web/src/store/auth.store.ts`:

- State: `user` profile, `accessToken`, `isAuthenticated`.
- Actions: `setAuth(user, accessToken)`, `clearAuth()` (logout).

### API Client (Axios)

We will define an Axios client in `apps/web/src/lib/api.ts`:

- Automatically appends `Authorization: Bearer <accessToken>` to request headers.
- Intercepts `401 Unauthorized` responses to call the token refresh endpoint (`/api/v1/auth/refresh`) and retry the failed request.

---

## 4. Pages & Routing

### Authentication Pages

- `/register`: Form for registering new users. Includes inputs for Email, Password, and an optional B2B Company name.
- `/login`: Form for credentials validation.

### Protected Dashboard (`/dashboard`)

- Displays current user profile (Email, Role, Creation Date).
- Extends the wins/metrics styling for stats demonstration.

### Route Guard Middleware (`middleware.ts`)

- Evaluates auth status using a cookie (syncing token presence from Zustand state).
- Redirects unauthenticated traffic attempting to load `/dashboard/*` to `/login`.
- Redirects authenticated traffic attempting to load `/login` or `/register` to `/dashboard`.

---

## 5. Verification Plan

- Run typescript checking: `pnpm run type-check`.
- Run linting: `pnpm run lint`.
- Manually test the full user flow (Register -> Login -> Dashboard -> Page Refresh -> Logout) and verify correct token refresh executions.
