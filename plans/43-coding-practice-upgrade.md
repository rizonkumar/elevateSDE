# Feature Plan: Coding Practice Upgrade

> **Status: IN PROGRESS.** Approved with the default answers to the open questions. Phase A is done. Branch: `feature/coding-practice-upgrade`.

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
- `ListProblemsQueryDto` gains `topic`, `company`, `status` (`SOLVED | ATTEMPTED | TODO`, computed from the viewer's submissions) and `sort` (`DEFAULT | DIFFICULTY | FREQUENCY`). `FREQUENCY` requires `company`.
- `GET /v1/topics` and `GET /v1/companies` return lists with problem counts.
- `GET /v1/companies/:slug/problems?limit=50` returns the company's problems ordered by frequency, with the viewer's solved state and the solved count out of total.
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
- When an accepted submission finishes, `code-execution.processor` computes its percentiles. The comparison set is **each other user's best accepted run** for the same problem and language, so one user resubmitting can't skew the distribution. The result is stored on the submission and never recomputed.
- At least 5 comparable users are required. With fewer, the percentile is `null` and the UI shows "Not enough data yet".
- `GET /v1/assessments/insights?problemId=&language=` returns a 20-bucket runtime histogram and a memory histogram. It is cached in Redis for 10 minutes per problem and language.
- `GET /v1/assessments/submissions` gains cursor pagination (`cursor`, `limit` ≤ 50) and returns language, runtime, memory and percentiles.

### Frontend
- A new **Submissions** tab in `ProblemPanel` lists status, language, runtime, memory and time. Clicking a row opens the detail view with the code, per-case results and a recharts histogram that highlights the user's bucket.
- **Diff view:** select two submissions and choose "Compare" to open a modal with Monaco's `DiffEditor` in read-only mode.
- The result banner after an accepted submit shows "Faster than 72% · Less memory than 41%".

### Note on noise
Docker runtimes vary between runs. Percentiles are labelled as approximate, and runtime is rounded to whole milliseconds before comparing.

---

## Phase D: Java and Go

### Schema and types
- Add `JAVA` and `GO` to `AssessmentLanguage` (an additive enum migration).
- `ProblemLanguage` becomes `'javascript' | 'python' | 'cpp' | 'java' | 'go'`, and `toPrismaLanguage`/`fromPrismaLanguage` are extended. `@elevatesde/shared-types` gets the same update.
- `starterCode` becomes `Partial<LanguageCodeMap>`. A language is **available** for a problem only when it has both starter code and a reference solution. The API returns `availableLanguages`, and the editor's language picker only offers those.

### Sandbox
| Language | Image | Compile | Run |
|---|---|---|---|
| Java | `eclipse-temurin:21-jdk-alpine` | `javac -d /sandbox /sandbox/Main.java` | `java -Xss64m -XX:+UseSerialGC -cp /sandbox Main` |
| Go | `golang:1.23-alpine` | `go build -o /sandbox/main.bin /sandbox/main.go` with `GOCACHE=/tmp/gocache`, `GOFLAGS=-mod=mod`, `CGO_ENABLED=0` | `/sandbox/main.bin` |

- Languages get per-language limits, because the current shared limits are too tight for the JVM. Java gets 512 MB memory and +2 s wall time. Go gets +3 s to compile.
- **Drivers** are typed from `harness.paramTypes` and `returnType`, like the C++ driver. The supported types match C++: `int`, `long`, `double`, `bool`, `string`, `int[]`, `string[]`, `int[][]` and `bool[]`.
  - The Go driver uses `encoding/json`.
  - The Java driver includes a small JSON reader, since the JDK has no JSON library. It is ported from the C++ `JParser`.
- **Signature generation:** `harness.cpp.signature` becomes optional, and Java and Go signatures are derived from the harness types. Starter stubs for the two new languages can be generated from the harness, so existing problems only need a reference solution.
- The existing user hardening carries over unchanged: unprivileged user, no network, read-only root, `/tmp` tmpfs.
- `scripts/` and `docs/deployment-self-hosted.md` add `docker pull` for both images so the first submission doesn't wait on a pull.

### Admin and seed data
- The problem form gets Java and Go tabs for starter code and reference solutions, with a "Generate stub from signature" button.
- Saving runs every provided reference solution against all test cases, as the existing languages already do.
- Seed data: add Java and Go reference solutions to the runnable seed problems.

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
  - Gated by the `ai-code-review` feature flag.
  - Limited to 10 reviews per user per day (a Redis counter, keyed by the verified user as in `rate-limits.ts`).
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
- A `CODE_REVIEW_COMPLETED` notification is sent through the existing notification module.

### Frontend
- The submission detail view gets a **Review my code** button, and its quota shows remaining reviews for the day.
- Results show complexity badges, a summary, and findings grouped by category. Each line number jumps the Monaco editor to that line and adds a line decoration.
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
