# Dashboard UI: Candidate, Organization, and Admin Console

Implementation plan for the primary user dashboards covering the Candidate portal, Organization (Tenant Admin) workspace, and Super-Admin Backoffice console.

---

## 1. Candidate Dashboard UI (`apps/web`)

An interface where candidates track preparation progress, view assessment history, and initiate mock interviews.

### Proposed Changes

#### [NEW] [dashboard/page.tsx](file:///Users/rizonkumarrahi/Developer/elevateSDE/apps/web/src/app/dashboard/page.tsx)

- **Stats Grid:**
  - _Interviews Completed:_ Total count of simulated rounds.
  - _Avg. AI Score:_ Percentage display of evaluated performance.
  - _Active Goals:_ Countdown of target assessments.
- **Quick Start Actions:** Direct trigger cards for "Live Mock Interview", "Code Assessment Sandbox", and "Resume Analysis".
- **Activity Log:** Compact chronological list of recent scores and resume updates.

#### [NEW] [dashboard.store.ts](file:///Users/rizonkumarrahi/Developer/elevateSDE/apps/web/src/app/store/dashboard.store.ts)

- Client Zustand store holding candidate statistics, historical records, and quick actions state.

---

## 2. Organization (Tenant Admin) Dashboard UI (`apps/web`)

A dashboard for B2B company administrators to monitor seat allocations, track candidate progress, and manage company invites.

### Proposed Changes

#### [NEW] [dashboard/org/page.tsx](file:///Users/rizonkumarrahi/Developer/elevateSDE/apps/web/src/app/dashboard/org/page.tsx)

- **Seat Usage Tracker:** Radial usage gauge showing active vs total purchased seat licenses (e.g., "12 / 20 Seats").
- **Team Performance Analytics:** Bar charts plotting candidate average performance scores in assessments.
- **Seat Invitation Panel:** Invites interface to add members by email with validation.

#### [NEW] [org-dashboard.store.ts](file:///Users/rizonkumarrahi/Developer/elevateSDE/apps/web/src/app/store/org-dashboard.store.ts)

- Store managing company profile, member listings, seat quotas, and outgoing email invitations.

---

## 3. Super-Admin Backoffice Dashboard UI (`apps/admin`)

A system-wide workspace for Super-Admins to evaluate application metrics, manage flags, and track audit trails.

### Proposed Changes

#### [NEW] [page.tsx](file:///Users/rizonkumarrahi/Developer/elevateSDE/apps/admin/src/app/page.tsx)

- **Global KPI Board:** Metrics listing system-wide counts:
  - Total Users, Total Active Tenants, Active Feature Flags, and Payment summaries.
- **System Operations Overview:** Panels highlighting active system tasks, API hit frequencies, and database migration checks.
- **Timeline Feed:** Instant feed loading the latest security audit logs.

---

## Verification Plan

### Manual Verification

- Access candidate dashboard at `http://localhost:3000/dashboard`. Verify stats and action cards load.
- Log in as a Tenant Admin and navigate to `http://localhost:3000/dashboard/org` to verify organization controls.
- Navigate to `http://localhost:3000/admin` to confirm administrative stats load successfully.
