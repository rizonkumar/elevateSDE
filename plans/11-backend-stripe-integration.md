# Backend: Multi-Tenant Stripe Subscriptions & Webhook Router

A payment gateway integration supporting B2B company subscription management, webhooks processing, and multi-tenant seat checking.

## Proposed Changes

### NestJS Backend API (`apps/api`)

#### [NEW] [billing.controller.ts](file:///Users/rizonkumarrahi/Developer/elevateSDE/apps/api/src/modules/billing/presentation/billing.controller.ts)

- Endpoints for creating Stripe checkout sessions (`POST /billing/checkout`) and handling customer portal redirects.
- Public route `/billing/webhook` processing raw buffer payloads from Stripe with signature validation.

#### [NEW] [stripe-webhook.service.ts](file:///Users/rizonkumarrahi/Developer/elevateSDE/apps/api/src/modules/billing/application/stripe-webhook.service.ts)

- Services reacting to Stripe events:
  - `customer.subscription.created` -> Set tenant plan, update active limits.
  - `customer.subscription.deleted` -> Downgrade tenant to free tier.

#### [MODIFY] [schema.prisma](file:///Users/rizonkumarrahi/Developer/elevateSDE/apps/api/prisma/schema.prisma)

- Add Stripe billing attributes (`stripeCustomerId`, `subscriptionId`, `subscriptionStatus`) to `Tenant` model.

---

## Verification Plan

### Automated Tests

- Mock Stripe event payloads and send to local webhook router:
  ```bash
  stripe trigger payment_intent.succeeded
  ```
