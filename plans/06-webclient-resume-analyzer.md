# Webclient: AI Resume Analyzer & ATS Scorer

> **Status: TODO** — planned, not yet implemented.

An interactive interface for candidates to upload engineering resumes (PDF/DOCX format) to generate ATS optimization feedback, parse skills, and receive targeted improvement suggestions.

## Proposed UI/UX Changes

### Candidate Webclient (`apps/web`)

#### [NEW] [resume/page.tsx](file:///Users/rizonkumarrahi/Developer/elevateSDE/apps/web/src/app/dashboard/resume/page.tsx)

- **Drag-and-Drop Uploader:** Solid border card with uploading status bar and PDF size constraints.
- **ATS Score Gauge:** High-contrast radial gauge demonstrating the calculated ATS score (0-100).
- **Feedback Breakdown Tabs:**
  - _Skills Match:_ Highlights found skills vs recommended industry standards.
  - _Structure/Format:_ Suggestions regarding length, active verbs, and formatting.
  - _Actionable Tips:_ List items suggesting specific wording modifications.

#### [NEW] [resume.store.ts](file:///Users/rizonkumarrahi/Developer/elevateSDE/apps/web/src/app/store/resume.store.ts)

- Zustand client store managing file state, analysis payload, and error notifications.

---

## Verification Plan

### Manual Verification

- Access `http://localhost:3000/dashboard/resume`.
- Upload a sample engineering resume PDF. Verify the loading bar starts.
- Validate that response parses and renders score + parsed skills successfully.
