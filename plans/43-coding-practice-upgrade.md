# Feature Plan: Coding Practice Upgrade

> **Status: DONE.** Approved with the default answers to the open questions. All five phases are implemented. Branch: `feature/coding-practice-upgrade`.

Five improvements to the problem-solving loop:

1. **Editorials and hints.** Hints unlock one at a time. The editorial unlocks after an accepted submission or when the user gives up.
2. **Company and topic tags.** Normalised tags, filters, and lists such as "Amazon top 50".
3. **Submission insights.** Runtime and memory percentiles, a submissions tab, and a diff between submissions.
4. **Java and Go.** Two new sandbox languages with typed drivers.
5. **AI code review.** An on-demand review of a submission covering complexity, readability and edge cases.

Each phase ships as its own commit series on this branch and works without the later phases. The order is A → B → C → D → E. Phases are self-contained, so the branch can be split into separate PRs if review gets too large.

---

## 0. What exists today

- `Problem` has `tags String[]`, `starterCode Json` (a full `LanguageCodeMap`), `referenceSolution Json` (admin only), and `harness Json` (`paramTypes`, `returnType`, `cpp.signature`).
- `tags` is read by `problem`, `daily-challenge`, `learning-path`, `problem-social` and `forum`.
- `AssessmentLanguage` has three values: `JAVASCRIPT`, `PYTHON`, `CPP`. Images are set in `code-runner/infrastructure/docker-sandbox/images.config.ts`, with one driver per language in `drivers/`.
- `Submission` already stores `totalRuntimeMs` and `peakMemoryKb`. The controller already serves `GET /assessments/submissions?problemId=` and `GET /assessments/submissions/:id`.
- `code-execution.processor.ts` emits `SUBMISSION_ACCEPTED`.
- The mock interview module already has the OpenAI-compatible provider pattern: `MOCK_INTERVIEW_AI_*` env vars, strict response parsing, and a deterministic fallback wrapped in a `Resilient*` decorator.
- The web workspace at `dashboard/assessment/[id]` has a `ProblemPanel` with Description, Discuss and Notes tabs. It uses `@monaco-editor/react`.

---

## Phase A: Editorials and Hints

### Schema
```prisma
enum EditorialUnlockReason { SOLVED GAVE_UP }

model ProblemEditorial {
  id              String   @id @default(uuid())
  problemId       String   @unique
  approach        String
  timeComplexity  String
  spaceComplexity String
  isPublished     Boolean  @default(false)
  updatedAt       DateTime @updatedAt
  problem         Problem  @relation(fields: [problemId], references: [id], onDelete: Cascade)
}

model ProblemHint {
  id        String  @id @default(uuid())
  problemId String
  ordinal   Int
  content   String
  problem   Problem @relation(fields: [problemId], references: [id], onDelete: Cascade)

  @@unique([problemId, ordinal])
}

model ProblemAssistance {
  id                    String                 @id @default(uuid())
  userId                String
  problemId             String
  tenantId              String?
  hintsRevealed         Int                    @default(0)
  editorialUnlockedAt   DateTime?
  editorialUnlockReason EditorialUnlockReason?
  user                  User                   @relation(fields: [userId], references: [id], onDelete: Cascade)
  problem               Problem                @relation(fields: [problemId], references: [id], onDelete: Cascade)

  @@unique([userId, problemId])
  @@index([tenantId])
}
```
The editorial shows the problem's existing `referenceSolution` as its code, so solutions are not stored twice.

### Backend (new DDD module `problem-assistance`)
- This lives in its own module rather than inside `problem`, so the problem module stays focused on authoring. It imports `ProblemModule` for published-problem checks and the reference solutions.
- `code-execution.processor` asks `ProblemAssistanceService.isAssisted` before calling `registerCompletion` and `awardProblemSolved`. Achievements are still evaluated.
- `GET /v1/problems/:id/assistance` returns the hint count, the hints revealed so far (content only up to `hintsRevealed`), and the editorial state (`locked`, `unlocked`, or `unavailable`).
- `POST /v1/problems/:id/hints/reveal` reveals the next hint. Increments are atomic (`updateMany ... where hintsRevealed = n`), so a double click can't skip a hint.
- `POST /v1/problems/:id/editorial/unlock` with body `{ reason: 'GAVE_UP' }`. Unlocks are idempotent.
- `GET /v1/problems/:id/editorial` returns 403 until the editorial is unlocked.
- A `SUBMISSION_ACCEPTED` listener unlocks the editorial with reason `SOLVED`.
- **Contest guard:** hints and the editorial return 403 while the user is in a running contest that contains the problem.
- Admin: `GET /v1/admin/coding-problems/:id/guidance`, `PUT /v1/admin/coding-problems/:id/editorial` and `PUT /v1/admin/coding-problems/:id/hints` (replaces the ordered list, 0–5 hints).

### Frontend
- Web: hints become a collapsible section at the end of Description, with a "Reveal hint 2 of 4" button. A new **Editorial** tab shows the approach (markdown), complexity badges and reference code per language. While locked it shows a "Give up and view editorial" button behind a confirmation.
- Admin: when editing, `ProblemFormModal` has an **Editorial & hints** tab with its own save buttons.
- Seed data: the seeded problems are generated and have no reference solutions, so no demo editorials are seeded.

---

## Phase B: Company and Topic Tags

### Schema
```prisma
model Topic {
  id       String         @id @default(uuid())
  slug     String         @unique
  name     String
  problems ProblemTopic[]
}

model ProblemTopic {
  problemId String
  topicId   String
  problem   Problem @relation(fields: [problemId], references: [id], onDelete: Cascade)
  topic     Topic   @relation(fields: [topicId], references: [id], onDelete: Cascade)

  @@id([problemId, topicId])
  @@index([topicId])
}

model Company {
  id       String           @id @default(uuid())
  slug     String           @unique
  name     String
  problems ProblemCompany[]
}

model ProblemCompany {
  problemId  String
  companyId  String
  frequency  Int
  lastAskedAt DateTime?
  problem    Problem @relation(fields: [problemId], references: [id], onDelete: Cascade)
  company    Company @relation(fields: [companyId], references: [id], onDelete: Cascade)

  @@id([problemId, companyId])
  @@index([companyId, frequency(sort: Desc)])
}
```
- `frequency` is a score from 1 to 100 that admins set. It drives the "top N" ordering.
- Topics and companies are platform-global and managed by admins, so they have no `tenantId`. Problems keep their own tenant scoping.
- **Migration:** backfill `Topic` from the distinct `Problem.tags` values (slugified) and link them through `ProblemTopic`.
- `Problem.tags` stays as a denormalised copy of the topic names. The problem service writes it on every topic change, so `daily-challenge`, `learning-path`, `forum` and `problem-social` keep working unchanged. Dropping the column is a follow-up.

### Backend
- A new `taxonomy` module owns topics and companies: admin CRUD at `/v1/admin/topics` and `/v1/admin/companies`, plus `GET /v1/topics`, `GET /v1/companies` and `GET /v1/companies/:slug` with the viewer's solved count. Renaming or deleting a topic re-syncs `Problem.tags` in the same transaction.
- `ListProblemsQueryDto` gains `topics` (comma-separated slugs, matching any), `company` and `status` (`SOLVED | ATTEMPTED | TODO`). There is no `sort` parameter: a company-filtered list is always ordered by frequency.
- Each list item carries its topics, companies and the viewer's `status`.
- Seed scripts link topics from tags after seeding, since on a fresh database the migration backfill runs before any problems exist.
- Admin: CRUD for topics and companies at `/v1/admin/topics` and `/v1/admin/companies`, plus assigning them to problems with a frequency in the problem form.

### Frontend
- Web: the problem list gets a filter bar (difficulty, topic multi-select, company, status) synced to the URL search params. A new `/dashboard/companies` page shows company cards with progress rings, and `/dashboard/companies/[slug]` shows the company's top problems.
- Admin: a new **Taxonomy** page with Topics and Companies tabs. `TagsInput` in the problem form is replaced by a topic picker and a company picker with frequency inputs.

---

## Phase C: Submission Insights

### Schema
- Add `runtimePercentile Float?` and `memoryPercentile Float?` to `Submission`.
- Add `@@index([problemId, language, status, totalRuntimeMs])`.

### Backend
- When an accepted submission finishes, `code-execution.processor` computes its percentiles *before* saving the result, so the result and its percentiles are written together and the client's poll never sees an accepted submission without them. A failure to compute leaves them `null` rather than failing the job. The comparison set is **each other user's best accepted run** for the same problem and language, so one user resubmitting can't skew the distribution. The result is stored on the submission and never recomputed.
- At least 5 comparable users are required. With fewer, the percentile is `null` and the UI shows "Not enough data yet".
- `GET /v1/assessments/insights?problemId=&language=` returns a 20-bucket runtime histogram and a memory histogram. It is cached for 10 minutes per problem and language behind an `IDistributionCache` interface. The current implementation is in-process memory, which avoids adding `ioredis` as a direct dependency; a Redis-backed implementation can replace it without touching the service.
- `GET /v1/assessments/submissions` now returns `{ items, nextCursor }` with cursor pagination (`cursor`, `limit` ≤ 50). A cursor that is not one of the caller's own submissions for that problem returns an empty page.
- `GET /v1/assessments/submissions/:id` now also returns `sourceCode` and the two percentiles, which the diff view needs.

### Frontend
- A new **Submissions** tab in `ProblemPanel` lists status, language, runtime, memory and time. Clicking a row opens the detail view with the code, per-case results and a recharts histogram that highlights the user's bucket.
- **Diff view:** select two submissions and choose "Compare" to open a modal with Monaco's `DiffEditor` in read-only mode. The shared `Modal` gained an optional `size="wide"` for this.
- The result banner after an accepted submit shows "Faster than 72% · Less memory than 41%".

### Note on noise
Docker runtimes vary between runs. Percentiles are labelled as approximate, and runtime is rounded to whole milliseconds before comparing.

---

## Phase D: Java and Go

### Schema and types
- Add `JAVA` and `GO` to `AssessmentLanguage` (an additive enum migration).
- `ProblemLanguage` becomes `'javascript' | 'python' | 'cpp' | 'java' | 'go'`, and `toPrismaLanguage`/`fromPrismaLanguage` are extended. `@elevatesde/shared-types` gets the same update.
- `starterCode` becomes `Partial<LanguageCodeMap>`. JavaScript, Python and C++ stay available for every problem, as before. Java and Go are available when the problem has authored starter code for them or a typed harness that a stub can be generated from. A reference solution is not required. The API returns `availableLanguages`, the editor's language picker only offers those, and run/submit reject any other language with a 400.

### Sandbox
| Language | Image | Compile | Run |
|---|---|---|---|
| Java | `eclipse-temurin:21-jdk-alpine` | `javac -d /sandbox /sandbox/Main.java` | `java -Xss64m -XX:+UseSerialGC -cp /sandbox Main` |
| Go | `elevatesde/sandbox-go:1.23` (built from `docker/sandbox/go`) | `go build -o /sandbox/main.bin /sandbox/main.go` | `/sandbox/main.bin` |

- Languages get per-language limits, because the current shared limits are too tight for the JVM. Java gets 512 MB memory and +2 s wall time. Go gets +3 s to compile.
- **Drivers** are typed from `harness.paramTypes` and `returnType`, like the C++ driver. The supported types match C++: `int`, `long`, `double`, `bool`, `string`, `int[]`, `string[]`, `int[][]` and `bool[]`.
  - The Go driver uses `encoding/json`.
  - The Java driver includes a small JSON reader, since the JDK has no JSON library. It is ported from the C++ `JParser`.
- **Signature generation:** `harness.cpp.signature` becomes optional, and Java and Go signatures are derived from the harness types. Starter stubs for the two new languages can be generated from the harness, so existing problems only need a reference solution.
- The existing user hardening carries over unchanged: unprivileged user, no network, read-only root, `/tmp` tmpfs.
- The Go image is built locally from `golang:1.23-alpine` with `go build std` run at build time. Measured locally: a cold compile on the stock image took 12 s; with the warmed cache it takes about 0.35 s. `scripts/prepare-sandbox-images.sh` pulls every sandbox image and builds the Go one, and `SANDBOX_GO_IMAGE` overrides the tag.
- Verified against real Docker: the gated integration suite (`RUN_SANDBOX_INTEGRATION=1`) now covers Java and Go solutions, every supported type, exceptions and panics, compile errors, nil Go slices and user imports. All 16 cases pass; Java cases take about 1.1 s and Go about 0.5 s.

### Admin and seed data
- The problem form gets Java and Go tabs for starter code and reference solutions, with a "Generate stub from signature" button.
- Saving runs every provided reference solution against all test cases, as the existing languages already do.
- Seed data: no change needed. The runnable seed problems have typed harnesses, so they get generated Java and Go stubs automatically.

### Frontend
- Monaco already supports `java` and `go` modes, so this only needs the language picker and per-language starter caching in localStorage.

---

## Phase E: AI Code Review

### Schema
```prisma
enum CodeReviewStatus { PENDING COMPLETED FAILED }
enum CodeReviewEngine { LLM DETERMINISTIC }

model SubmissionReview {
  id              String           @id @default(uuid())
  submissionId    String           @unique
  userId          String
  tenantId        String?
  status          CodeReviewStatus @default(PENDING)
  engine          CodeReviewEngine
  timeComplexity  String?
  spaceComplexity String?
  summary         String?
  findings        Json?
  failureReason   String?
  createdAt       DateTime         @default(now())
  completedAt     DateTime?
  submission      Submission       @relation(fields: [submissionId], references: [id], onDelete: Cascade)
  user            User             @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, createdAt(sort: Desc)])
  @@index([tenantId])
}
```
Each finding has the shape `{ category: COMPLEXITY | READABILITY | EDGE_CASE | CORRECTNESS | PERFORMANCE, severity: INFO | SUGGESTION | ISSUE, line: number | null, message, suggestion | null }`, with at most 10 findings.

### Backend (new DDD module `code-review`)
- `POST /v1/submissions/:id/review` is **on demand only**, to control cost. Rules:
  - The submission must belong to the caller.
  - Its status must be `ACCEPTED`, `WRONG_ANSWER` or `TIME_LIMIT_EXCEEDED`.
  - Only one review per submission. Repeat calls return the existing review.
  - The problem must not be in a running contest the user is in.
  - Gated by the `AI_CODE_REVIEW` feature flag. The seed creates it enabled; an existing deployment must create it on the admin Feature Flags page, or reviews stay off.
  - Limited to 10 reviews per user per UTC day. The count comes from `SubmissionReview` rows created since midnight UTC rather than a Redis counter, so it is exact and needs no extra dependency. Asking again for an already-reviewed submission returns the existing review and does not use quota.
  - `RUNTIME_ERROR` submissions are reviewable too, alongside the three statuses above.
- `GET /v1/submissions/:id/review` is polled by the client.
- The review runs on a BullMQ `code-review` queue with 2 attempts and a 45 s timeout.
- **Provider:** `OpenAiCompatibleCodeReviewer` follows the mock-interview pattern.
  - Env vars: `CODE_REVIEW_AI_ENABLED`, `_ENDPOINT`, `_API_KEY`, `_MODEL` and `_TIMEOUT_MS`.
  - The prompt includes the problem statement, constraints, the user's code, the language, the visible test case results and the measured runtime. **Hidden test inputs and the reference solution are never sent.**
  - User code is wrapped as delimited untrusted data.
  - A strict parser checks enums and line bounds and caps message length.
- **Deterministic fallback**, used when AI is disabled or the model fails:
  - Estimates complexity from loop nesting depth.
  - Flags functions longer than 40 lines and single-letter names outside loop indices.
  - Turns failed visible cases into `EDGE_CASE` findings.
  - Turns `TIME_LIMIT_EXCEEDED` into a `PERFORMANCE` finding.
- A `ResilientCodeReviewer` decorator falls back to the deterministic reviewer and records `engine`.
- A `CODE_REVIEW_READY` notification is sent through the existing notification module (a new `NotificationType` value, added to the preference lists).
- `GET /v1/code-reviews/quota` returns `{ limit, used, remaining, enabled }` for the button.

### Frontend
- The submission detail view gets a **Review my code** button, and its quota shows remaining reviews for the day.
- Results show complexity badges, a summary, and findings grouped by category. The submission's code is shown with line numbers; lines with findings are tinted, and a finding's line link scrolls to and focuses that line.
- Reviews from the deterministic engine are labelled "Automated review".

---

## Testing

- **Unit:** hint reveal atomicity and ordering; the editorial unlock rules (contest guard, solved, gave up); tag backfill slugging; the percentile calculation (best run per user, minimum sample size); Java and Go harness signature generation; the code-review response parser; and the deterministic reviewer heuristics.
- **Integration:** run each new driver in Docker against the seed problems for all supported types, the same way the current runner specs work.
- **Authorization:** review, editorial and submissions endpoints must reject other users' IDs, matching the earlier IDOR sweep.
- **Manual check:** solve a problem in each language, reveal hints, give up, compare two submissions, and request a review with the AI both on and off.

---

## Decisions (approved defaults)

1. **Points after giving up:** does a solve after unlocking the editorial still earn leaderboard points and daily streak credit? **Default: it counts as solved but earns no points.** The solve is marked `assisted` on the ledger entry.
2. **Do hints cost anything?** **Default: free, with no point penalty.**
3. **Company frequency data:** an admin enters it by hand for now. **Default: manual entry only**, with no scraping or import.
4. **Can org admins see tenant users' AI reviews in org analytics?** **Default: no, reviews are private to the user.**

---

## Verification

- `pnpm turbo run type-check lint test` passes: 467 API tests (24 skipped as integration-gated) and 15 api-client tests.
- The sandbox integration suite was run against real Docker with `RUN_SANDBOX_INTEGRATION=1`: 16 of 16 pass, including the new Java and Go cases.
- All migrations were applied to a throwaway Postgres 16 container. After seeding 2,888 problems, the tag backfill created 69 topics and 9,102 links with no mismatch between `Problem.tags` and the links. Renaming a topic re-synced the 64 affected problems with none left stale.
- Not verified here: the full app running in a browser, and a live LLM provider for code review. The deterministic reviewer path is covered by unit tests.
