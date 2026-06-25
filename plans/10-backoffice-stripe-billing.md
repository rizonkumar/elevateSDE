# Backoffice: Multi-Tenant Subscription & Stripe Dashboard

> **Status: ON HOLD** — payment work deferred.

An administrative portal in the Super-Admin Backoffice Workspace to manage B2B tenants, view billing metrics, control plans, and review Stripe payment logs.

## Proposed UI/UX Changes

### Admin Console (`apps/admin`)

#### [NEW] [billing/page.tsx](file:///Users/rizonkumarrahi/Developer/elevateSDE/apps/admin/src/app/billing/page.tsx)

- **Revenue Dashboard:** Core metrics demonstrating Monthly Recurring Revenue (MRR), Total ARR, Active Subscriptions count, and Churn rate.
- **Tenant Plan Manager:** Actionable table displaying B2B companies, current Stripe tier, user seat allocation, and renewal date.
- **Manual Override Modal:** Options to manually upgrade plans, adjust user seat counts, or issue credits directly.

#### [NEW] [billing.store.ts](file:///Users/rizonkumarrahi/Developer/elevateSDE/apps/admin/src/app/store/billing.store.ts)

- Zustand administrative store to fetch tenant plans and request webhook test events.

---

## Verification Plan

### Manual Verification

- Access `http://localhost:3000/admin/billing`.
- Verify payment stats load correctly from backend administrative API.
- Attempt manual seat override; verify action triggers audit logs audit trails.
