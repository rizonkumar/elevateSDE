# Webclient: Job Application Tracker

A dashboard interface in the Candidate Web Client enabling candidates to log, monitor, and update the status of their job applications (APPLIED, OA, INTERVIEW, OFFER, REJECTED).

## Proposed UI/UX Changes

### Candidate Webclient (`apps/web`)

#### [NEW] [job-tracker/page.tsx](file:///Users/rizonkumarrahi/Developer/elevateSDE/apps/web/src/app/dashboard/job-tracker/page.tsx)

- **Kanban Board:** A premium drag-and-drop column-based board built with custom Tailwind utilities.
- **Forms:** Modal overlay to add job applications with fields for Company Name, Role, Status, Salary Range, Job Description Link, and Interview Date.
- **Micro-interactions:** Smooth animations using Framer Motion when cards are dragged between stages or edited.

#### [NEW] [job-tracker.store.ts](file:///Users/rizonkumarrahi/Developer/elevateSDE/apps/web/src/app/store/job-tracker.store.ts)

- Zustand store managing active state, modal triggers, and optimistic UI updates during drag-and-drop actions.

---

## Verification Plan

### Manual Verification

- Access `http://localhost:3000/dashboard/job-tracker`.
- Create a new job card; verify it places into the `APPLIED` column.
- Drag the card to `INTERVIEW` and verify the status update hits the backend successfully.
