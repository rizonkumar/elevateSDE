# Feature Plan: Super-Admin Backoffice Workspace

Implementation details for the internal platform administration system. This includes backend databases, API endpoints, DDD modules for Audit Logs and Feature Flags, and the Next.js `admin` backoffice panel application.

---

## 1. Objectives

- Define database models for `AuditLog` and `FeatureFlag` in Prisma.
- Implement backend DDD modules for managing Audit Logs and Feature Flags.
- Create a dedicated `/api/v1/admin` namespace in the NestJS backend, guarding endpoints with active `JwtAuthGuard` and `RolesGuard` set to `ADMIN` role.
- Scaffold `apps/admin` inside the monorepo by cloning the Next.js workspace config, Zustand stores, and Axios API client from `apps/web`.
- Implement administrative panels for:
  - **User Operations:** Listing all registered accounts and updating user roles.
  - **Tenant Monitoring:** Viewing company workspace names, stripe metadata, and subscriptions.
  - **Audit Log Stream:** Auditing a chronological feed of database changes.
  - **Feature Flags:** Toggling features on/off and updating percentage rollouts.

---

## 2. Database Schema (Prisma)

We will append the following models to `apps/api/prisma/schema.prisma`:

```prisma
model AuditLog {
  id        String   @id @default(uuid())
  userId    String?
  action    String
  metadata  Json?
  createdAt DateTime @default(now())
  user      User?    @relation(fields: [userId], references: [id], onDelete: SetNull)
}

model FeatureFlag {
  id                String   @id @default(uuid())
  flagKey           String   @unique
  isEnabled         Boolean  @default(false)
  percentageRollout Int      @default(100)
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}
```

We will also establish an audit relation inside the `User` model:
`auditLogs AuditLog[]`

---

## 3. Backend DDD Module Architecture

We will implement the following business domains under `apps/api/src/modules/`:

### 3.1. AuditLog Domain

- **Domain Entity:** `modules/audit-log/domain/entities/audit-log.ts`
- **Repository Contract:** `modules/audit-log/domain/interfaces/audit-log-repository.interface.ts`
- **Concrete Repository:** `modules/audit-log/infrastructure/repositories/audit-log.repository.ts` (using mapper)
- **Application Service:** `modules/audit-log/application/audit-log.service.ts`

### 3.2. FeatureFlag Domain

- **Domain Entity:** `modules/feature-flag/domain/entities/feature-flag.ts`
- **Repository Contract:** `modules/feature-flag/domain/interfaces/feature-flag-repository.interface.ts`
- **Concrete Repository:** `modules/feature-flag/infrastructure/repositories/feature-flag.repository.ts` (using mapper)
- **Application Service:** `modules/feature-flag/application/feature-flag.service.ts`

### 3.3. Admin Controller (`modules/admin/presentation/`)

Guarded by `@UseGuards(JwtAuthGuard, RolesGuard)` and `@Roles(UserRole.ADMIN)`:

- `GET /api/v1/admin/users`: Lists registered accounts.
- `PATCH /api/v1/admin/users/:id/role`: Promotes/demotes user roles.
- `GET /api/v1/admin/tenants`: Lists all B2B Tenants.
- `GET /api/v1/admin/audit-logs`: Retrieves latest platform audit logs.
- `GET /api/v1/admin/feature-flags`: Lists all feature flags.
- `POST /api/v1/admin/feature-flags`: Creates/updates feature flags.

---

## 4. Frontend Admin Application Setup (`apps/admin`)

We will scaffold a Next.js 16.2.9 client under `apps/admin/`:

1. Copy base configs (`package.json`, `tsconfig.json`, `postcss.config.mjs`, `next.config.ts`, `globals.css`) from `apps/web`.
2. Update dependencies to include `@elevatesde/ui`, Zustand, Axios, and js-cookie.
3. Configure `apps/admin/package.json` package name to `@elevatesde/admin`.
4. Include the project workspace inside `pnpm-workspace.yaml`.
5. Implement pages:
   - `/`: Dashboard landing showing summary counters (total users, total tenants, active flags).
   - `/users`: Tabular user directory with role-changing dropdowns.
   - `/tenants`: Company workspace directory.
   - `/audit-logs`: Feed displaying timeline of action logs.
   - `/feature-flags`: Flag cards with toggle controls.

---

## 5. Verification Plan

### Automated Checks

- Type checking: `pnpm run type-check`
- Code linting: `pnpm run lint`
- Production compilation: `pnpm run build`

### Manual Checks

- Authenticate as a normal user (`USER` role) and verify access to `/api/v1/admin/*` is rejected with `403 Forbidden`.
- Authenticate as an admin (`ADMIN` role) and verify access to admin APIs is successful.
- Verify toggling a feature flag updates the database state.
