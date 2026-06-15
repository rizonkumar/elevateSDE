# Webclient: Coding Assessment Sandbox (Monaco Editor)

A structured IDE environment for candidates taking timed DSA assessments. Includes split screen panels for question description, code editor, and execution outputs.

## Proposed UI/UX Changes

### Candidate Webclient (`apps/web`)

#### [NEW] [assessment/[id]/page.tsx](file:///Users/rizonkumarrahi/Developer/elevateSDE/apps/web/src/app/dashboard/assessment/[id]/page.tsx)

- **Monaco Editor Integration:** Embedded code editor loaded asynchronously.
- **Responsive Split Panels:** Layout allowing vertical resize partitions separating:
  - Left Panel: Problem description, constraints, and test case formats.
  - Right-Top Panel: Code editor with language selector dropdown (JavaScript, Python, C++).
  - Right-Bottom Panel: Execution console showing stdout, test status (PASS/FAIL), and runtime/memory stats.

#### [NEW] [assessment.store.ts](file:///Users/rizonkumarrahi/Developer/elevateSDE/apps/web/src/app/store/assessment.store.ts)

- Zustand state saving periodic code backups locally, tracking remaining session limits, and handling submission endpoints.

---

## Verification Plan

### Manual Verification

- Access `http://localhost:3000/dashboard/assessment/demo-id`.
- Write solution, click "Run Code", verify execution feedback in output panel.
