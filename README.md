# ElevateSDE

ElevateSDE is an enterprise-grade AI-driven interview preparation platform built as a SaaS product. It supports candidates preparing for interviews through timed assessments, real-time AI-driven mock interviews, and personalized learning plans.

## Documentation

* **Architecture:** Detailed technical stack, monorepo structure, DDD pattern, database schemas, and advanced systems are documented in [architecture.md](file:///Users/rizonkumarrahi/Developer/elevateSDE/architecture.md).
* **Developer Guidelines:** Guidelines for development, coding standards (no comments), git branching strategy, and UI rules for AI assistants are documented in [gemini.md](file:///Users/rizonkumarrahi/Developer/elevateSDE/gemini.md).

## Monorepo Workspace Structure

```text
elevatesde/
├── apps/
│   ├── web/                 (Next.js 16.2.9 Frontend)
│   ├── api/                 (NestJS Backend)
│   └── admin/               (Internal Super-Admin Dashboard)
├── packages/
│   ├── shared-types/        (TypeScript Interfaces used across apps)
│   ├── ui/                  (Shared Tailwind components)
│   ├── eslint-config/       (Standardized linting)
│   ├── ts-config/           (Standardized TypeScript rules)
│   └── logger/              (Custom Winston + OpenTelemetry wrapper)
```
