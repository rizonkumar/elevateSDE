# Webclient: AI Resume Analyzer & ATS Scorer

> **Status: IN PROGRESS** — `feature/resume-ats-analyzer`.
>
> The UI for this plan was already built (June) but runs entirely on **client-side mock
> logic**: `resume.store.ts` never calls the API — it parses the file in the browser and
> scores it with local heuristics. This revision keeps the existing presentation layer
> essentially intact and swaps the data layer onto the real `resume` API (Plan 13).

An interface for candidates to upload engineering resumes (PDF/DOCX) to generate ATS
optimization feedback, parse skills, and receive targeted improvement suggestions.

---

## 1. What already exists and stays

`apps/web/src/app/dashboard/resume/` — `page.tsx` plus `ResumeDropzone`, `AtsScoreGauge`,
`AnalysisOverview`, `FeedbackTabs`, `UpcomingFeatures`. The page **already renders
`PROCESSING`, `FAILED`, and `COMPLETED`** branches off `ResumeDto.status`, so the async
server flow needs no new UI states — only a real source of truth behind them.

---

## 2. Proposed Changes (`apps/web`)

#### [NEW] `src/lib/resume-api.ts`

Thin typed wrapper mirroring `lib/review-api.ts`:

```
uploadResume(file: File): Promise<ResumeDto>   // multipart/form-data
getResumes(): Promise<ResumeDto[]>
getResume(id: string): Promise<ResumeDto>
deleteResume(id: string): Promise<void>
```

Uses the shared `api` axios instance (bearer token + refresh interceptor come free).

#### [MODIFY] `src/store/resume.store.ts`

Replace the local-analysis internals; the **public store surface stays the same** so no
component prop changes are needed.

- `analyze(file)` — validate → `uploadResume` → insert the returned `PROCESSING` row → poll.
- **[NEW]** `fetchHistory()` — hydrate past analyses on mount (previously the list died on
  refresh, since nothing was persisted anywhere).
- Polling: `getResume(id)` on an interval until `COMPLETED`/`FAILED`, with a timeout guard,
  following `notifications.store.ts`'s module-level timer + explicit `stopPolling()`.
- `remove(id)` — now issues `DELETE` before pruning local state.
- Errors surface through `useToastStore`, unchanged.

#### [NEW] `src/lib/score-band.ts`

`scoreBand()` / `ScoreBand` move here **unchanged**. They are pure presentation (label +
badge variant for a score) and are imported by three components — including
`mock-interview/_components/FeedbackReport.tsx`, which is outside this feature. Extracting
them is what allows the scoring engine itself to be deleted without breaking mock interviews.

- **[MODIFY]** import updates in `AtsScoreGauge.tsx`, `AnalysisOverview.tsx`,
  `FeedbackReport.tsx`.

#### [DELETE] `src/lib/resume-analyzer.ts`

The 285-line heuristic engine moves to `apps/api` (Plan 13 §4). Deleting rather than leaving
it dormant is the point — two copies of the scoring rules would drift.

#### [MODIFY] `src/lib/resume-parser.ts`

Keeps `validateResumeFile` and `ACCEPTED_RESUME_TYPES` (pre-upload UX guard, now sourcing the
size cap and MIME list from `@elevatesde/shared-types`). Drops `extractResumeText` and with it
the `mammoth` / `pdfjs-dist` client dependencies.

#### [MODIFY] `src/app/dashboard/resume/page.tsx`

- Call `fetchHistory()` on mount, and `stopPolling()` on unmount.
- Step copy currently reads _"Parsed in your browser."_ — no longer true; update to reflect
  server-side analysis.

---

## 3. Verification

```bash
pnpm --filter=@elevatesde/web type-check
pnpm --filter=@elevatesde/web lint
pnpm --filter=@elevatesde/web build
```

### Manual

1. Upload a PDF → spinner appears immediately, resolves to a score without a page refresh.
2. **Reload the page** → history persists and the active analysis is still selectable
   (impossible before this change).
3. Remove an analysis → gone after reload too.
4. Upload an unsupported/oversized file → rejected client-side, no request fired.
5. Confirm responsive layout at mobile/tablet/desktop is unaffected.
