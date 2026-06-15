# ElevateSDE

ElevateSDE is an enterprise-grade AI-driven interview preparation platform built as a SaaS product. It supports candidates preparing for interviews through timed assessments, real-time AI-driven mock interviews, and personalized learning plans.

## Documentation

- **Architecture:** Detailed technical stack, monorepo structure, DDD pattern, database schemas, and advanced systems are documented in [architecture.md](file:///Users/rizonkumarrahi/Developer/elevateSDE/architecture.md).
- **Developer Guidelines:** Guidelines for development, coding standards (no comments), git branching strategy, and UI rules for AI assistants are documented in [gemini.md](file:///Users/rizonkumarrahi/Developer/elevateSDE/gemini.md).

## System Architecture Diagram

```mermaid
graph TD
    subgraph Clients["Frontend Clients (Next.js 16)"]
        Web["Candidate Web Client (Port 3001)"]
        Admin["Admin Backoffice Client (Port 3002)"]
    end

    subgraph API["Backend API (NestJS - Port 3000)"]
        Gateway["API Gateway / App Routing"]

        subgraph Domains["DDD Modules"]
            AuthModule["Auth Module"]
            UsersModule["Users Module"]
            AuditModule["Audit Log Module"]
            FlagModule["Feature Flag Module"]
        end

        subgraph Layers["Clean Architecture Layers"]
            Pres["Presentation Layer (Controllers, DTOs, Mappers)"]
            App["Application Layer (Services)"]
            Dom["Domain Layer (Entities, Interfaces)"]
            Infra["Infrastructure Layer (Repositories, Prisma Mappers)"]
        end
    end

    subgraph Storage["Data Store Layer"]
        DB[(PostgreSQL - Prisma)]
        Cache[(Redis - Caching & BullMQ)]
    end

    Web --> Gateway
    Admin --> Gateway
    Gateway --> Pres
    Pres --> App
    App --> Dom
    Dom --> Infra
    Infra --> DB
    App --> Cache

    %% Audit Logging Hook
    App -.->|Trigger Audit Logs| AuditModule
    AuditModule --> Infra
```

## System Audit Logging & Compliance

Audit Logs are implemented to track administrative actions, mutations, and authentication occurrences across the system. We require audit logging for:

1. **Security Compliance:** Fulfilling standards such as SOC 2 and ISO 27001 by maintaining an immutable trail of administrative actions.
2. **Accountability:** Tracking details on critical mutations (such as user role adjustments, tenant upgrades, or subscription modifications).
3. **Troubleshooting & Debugging:** Enabling developers and B2B managers to reconstruct chronological sequences of events when debugging system states.

## Monorepo Workspace Structure

````text
├── elevatesde/
│   ├── apps/
│   │   ├── web/                 (Next.js 16.2.9 Frontend - Candidate Portal)
│   │   ├── api/                 (NestJS Backend - Core API)
│   │   └── admin/               (Next.js 16.2.9 Frontend - Admin Backoffice)
│   ├── packages/
│   │   ├── shared-types/        (TypeScript Interfaces used across apps)
│   │   ├── ui/                  (Shared Tailwind components)
│   │   ├── eslint-config/       (Standardized linting)
│   │   ├── ts-config/           (Standardized TypeScript rules)
│   │   └── logger/              (Custom Winston + OpenTelemetry wrapper)

## Getting Started

To run the applications in development, use the following commands from any directory in the workspace:

* **Run all applications** (API + Web Client + Admin Backoffice):
  ```bash
  pnpm -w run dev:all
````

- **Run only the client frontends** (Web Client + Admin Backoffice):
  ```bash
  pnpm -w run dev:clients
  ```
- **Run type checks**:
  ```bash
  pnpm -w run type-check
  ```
- **Run linter**:
  ```bash
  pnpm -w run lint
  ```
- **Run build**:
  ```bash
  pnpm -w run build
  ```

```

```
