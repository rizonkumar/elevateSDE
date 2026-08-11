# Backend: Resume Text Extraction & ATS Analyzer

> **Status: IN PROGRESS** — `feature/resume-ats-analyzer`.
>
> Revised from the original S3 + Gemini/OpenAI sketch after auditing the repo. Decisions:
>
> - **No object storage.** The uploaded binary is parsed in-request and discarded; only the
>   analysis is persisted. `ResumeDto.fileUrl` stays `null` (already nullable, never rendered).
>   No AWS account, bucket, or IAM policy is needed to run the feature end to end.
> - **No LLM call in v1.** The 285-line heuristic scorer that already ships in
>   `apps/web/src/lib/resume-analyzer.ts` **moves** to the API behind an `IResumeAnalyzer`
>   port. Deterministic, unit-testable, zero key/cost/latency. An LLM adapter implements the
>   same port later without touching the service, repository, controller, or processor.
> - **Extraction moves, not duplicates.** `pdfjs-dist` + `mammoth` move from `apps/web` to
>   `apps/api`; both drop out of the client bundle entirely.

Candidates upload a PDF/DOCX resume; the API extracts text, scores it against an SDE skill
catalog and structural rules, and returns an ATS score with prioritized feedback.

---

## 1. Data Model (`apps/api/prisma/schema.prisma`)

- **[NEW] enum `ResumeStatus`** — `PROCESSING`, `COMPLETED`, `FAILED`. Mirrors the existing
  `ResumeStatus` union already exported from `@elevatesde/shared-types`.
- **[NEW] `Resume`**

  | Column | Type | Notes |
  |---|---|---|
  | `id` | `String @id @default(uuid())` | |
  | `userId` | `String` | FK → `User`, `onDelete: Cascade` |
  | `tenantId` | `String?` | Follows the multi-tenant convention used by `Notification` |
  | `fileName` | `String` | |
  | `status` | `ResumeStatus @default(PROCESSING)` | |
  | `atsScore` | `Int?` | Null until `COMPLETED` |
  | `parsedSkills` | `String[]` | |
  | `missingSkills` | `String[]` | |
  | `structureFeedback` | `Json?` | `ResumeFeedbackItem[]`, same as `Notification.metadata` |
  | `actionableTips` | `String[]` | |
  | `summary` | `String?` | |
  | `failureReason` | `String?` | Surfaced only in logs, not in the DTO |
  | `createdAt` / `updatedAt` | `DateTime` | |

  `@@index([userId, createdAt])` for the history list.

- **[MODIFY] `User`** — add `resumes Resume[]`.
- Migration: `pnpm --filter=@elevatesde/api exec prisma migrate dev --name resume_analysis`.

**Raw resume text is never persisted.** It lives in the request, then in the BullMQ job
payload (dropped on completion via `removeOnComplete: true`) — exactly how
`CodeExecutionJobData` already carries candidate source `code`.

---

## 2. Shared Contract (`packages/shared-types`)

`ResumeDto`, `ResumeStatus`, `ResumeFeedbackItem`, and `ResumeFeedbackSeverity` already exist
and are consumed by the web UI unchanged — **no type changes required**.

- **[NEW]** `MAX_RESUME_SIZE_BYTES` and `ACCEPTED_RESUME_MIME_TYPES` as runtime constants, so
  the dropzone's client-side guard and the server's `MulterOptions` + validation read one
  source of truth instead of two copies of the 5 MB cap.

> Deviation worth noting: this package is currently **types-only** (zero runtime exports).
> These are its first emitted values. Both consumers compile it from source
> (`main: src/index.ts`), so no build-step change is needed.

---

## 3. Queue Wiring (`apps/api/src/modules/queues/`)

`QUEUE_NAMES.RESUME` is already declared but has no producer or consumer. Mirroring
`code-execution` exactly:

- **[NEW]** `domain/interfaces/resume-analysis-queue.interface.ts` — `ResumeAnalysisJobData`
  (`{ resumeId, userId, text }`) + abstract `IResumeAnalysisQueue`.
- **[NEW]** `application/resume-analysis.queue.ts` — `@InjectQueue(QUEUE_NAMES.RESUME)`,
  3 attempts, exponential backoff, `removeOnComplete: true`.
- **[MODIFY]** `queues.module.ts` — register the queue, provide + export the port.

---

## 4. DDD Module (`apps/api/src/modules/resume/`)

Structure mirrors `modules/review/`.

```
domain/
  entities/resume-analysis.ts              markCompleted() / markFailed(), no I/O
  interfaces/resume-repository.interface.ts
  interfaces/resume-analyzer.interface.ts  IResumeAnalyzer — the LLM seam
  interfaces/resume-text-extractor.interface.ts
  scoring/skill-catalog.ts                 SDE_SKILLS, section headings, action verbs
  scoring/resume-scoring.ts                ported pure scorer
  scoring/resume-scoring.spec.ts
application/
  resume.service.ts (+ .spec.ts)
infrastructure/
  analyzers/heuristic-resume.analyzer.ts   implements IResumeAnalyzer
  extractors/resume-text.extractor.ts      pdfjs-dist + mammoth
  mappers/resume.mapper.ts                 Prisma row → entity
  processors/resume-analysis.processor.ts  @Processor(QUEUE_NAMES.RESUME)
  repositories/resume.repository.ts
presentation/
  controllers/resume.controller.ts
  dtos/resume-response.dto.ts
  mappers/resume-presentation.mapper.ts
resume.module.ts
```

### Flow

1. `POST` → `FileInterceptor` (memory storage, size cap) → validate mime/size.
2. `IResumeTextExtractor.extract(buffer, mimeType)` — synchronous, sub-second at ≤5 MB.
3. Reject with `422` if extracted text is under the minimum readable length (the browser
   implementation's existing 40-character guard).
4. Persist `Resume` as `PROCESSING`, enqueue `{ resumeId, userId, text }`, return **202**.
5. Processor: `IResumeAnalyzer.analyze(text)` → `resumeService.applyResult(...)`.
6. `@OnWorkerEvent('failed')` after final attempt → `markFailed`, same shape as
   `CodeExecutionProcessor.onFailed`.

### Endpoints — `@Controller({ path: 'resume', version: '1' })`, `JwtAuthGuard`

| Verb | Path | Result |
|---|---|---|
| `POST` | `/v1/resume` | `202` → `ResumeResponseDto` (`PROCESSING`) |
| `GET` | `/v1/resume` | `200` → `ResumeResponseDto[]`, newest first, capped |
| `GET` | `/v1/resume/:id` | `200` → poll target; `404` if not the caller's |
| `DELETE` | `/v1/resume/:id` | `204` |

Every query is scoped by `userId` from the JWT — an id belonging to another user returns
`404`, never `403`, matching `ProblemNote` in `problem-social`.

---

## 5. Dependencies

| Package | App | Reason |
|---|---|---|
| `pdfjs-dist` | `apps/api` **+**, `apps/web` **−** | PDF text extraction (moved) |
| `mammoth` | `apps/api` **+**, `apps/web` **−** | DOCX text extraction (moved) |
| `@types/multer` | `apps/api` dev | Types for `FileInterceptor` |

Net client bundle change is negative; no new runtime services in `docker-compose.yml`.

---

## 6. Verification

```bash
pnpm --filter=@elevatesde/api test src/modules/resume
pnpm --filter=@elevatesde/api type-check
pnpm --filter=@elevatesde/api lint
```

- `resume-scoring.spec.ts` — port the scorer's behaviour: score bands, skill matching
  (`c++`/`k8s` keyword edge cases), missing-skill selection, structure feedback severities,
  and tip ordering.
- `resume.service.spec.ts` — `PROCESSING` on create, `applyResult` transitions to
  `COMPLETED`, failure path sets `FAILED`, cross-user read throws `NotFoundException`.

### Manual
1. `docker-compose up -d` (Postgres + Redis, both already defined).
2. Upload a PDF and a DOCX at `/dashboard/resume`; confirm the row flips `PROCESSING → COMPLETED`.
3. Upload a 6 MB file and a `.txt` → rejected before any row is written.
4. Stop Redis mid-upload → row stays `PROCESSING`, then `FAILED` after retries drain.
