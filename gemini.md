# ElevateSDE Development Guidelines (gemini.md)

This file contains critical guidelines that MUST be read and followed by any AI agent (specifically Gemini/Antigravity) working on this repository. Always adhere to these instructions.

---

## 1. Branching & Feature Planning Strategy
* **Branch per Feature:** Before starting any new feature implementation, ALWAYS create a new Git branch. Never work directly on `main` or merge branches without verification.
* **Feature Plans:** For every feature implementation, first create a dedicated Markdown plan (`.md` file) outlining the steps, design decisions, and database schemas. Obtain user approval before writing code.
* **Tracking Progress:** Maintain the tasks list (`task.md` or equivalent) as a source of truth for the active feature branch.

---

## 2. Code Quality & Standards
* **NO Comments in Code:** Do NOT write any comments (single-line `//` or block `/* */`) in the code. Code must be self-documenting through clean naming, clear structure, and expressive code flow. Preserve existing comments/docstrings only if they are part of a file you are modifying and are unrelated to your changes.
* **Strict TypeScript:**
  * Avoid the `any` type completely. Use exact interfaces, types, or generics.
  * Implement strict type check compliance.
  * Use proper type safety for React Server Components (RSC) and Client Components.
* **Framework Constraints:** Next.js version is **16.2.9** with App Router. Ensure all app router APIs match this version.

---

## 3. UI/UX Design System
* **General Aesthetics:** Keep the interface clean, neat, premium, and highly professional. Avoid generic colors.
* **Responsive Layouts:** The UI must be fully responsive and work seamlessly across mobile, tablet, and desktop screens.
* **NO Gradients or Glassmorphism:**
  * Do NOT use complex, loud, or unwanted background gradients.
  * Do NOT use glassmorphism effects (no translucent card backdrops with heavy blur filters).
  * Use solid, elegant dark/light mode surface colors (e.g., slate, zinc, neutral, HSL tailored palettes).
* **Tailwind CSS:** Use Tailwind utility classes for styling. Do not use ad-hoc inline styles.
* **Custom UI Components:** We do NOT use Shadcn UI. Design custom, reusable UI components using Tailwind CSS to maintain complete control over the markup and styling.
* **Typography:** Use modern, premium typography (e.g., Google Fonts like Inter or Outfit) with clear hierarchical font sizes and line heights.

---

## 4. Backend & Database Standards
* **Domain-Driven Design (DDD):** Align backend additions (NestJS) with the DDD modules structure defined in `architecture.md`.
* **Prisma Schema:** Ensure proper foreign key constraints, indexing, and multi-tenant scoping (`tenantId`).
