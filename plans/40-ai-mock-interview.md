# Feature Plan: Real AI Mock Interviews

> **Status: DONE** — implemented on `feature/ai-mock-interview`. The live model is enabled later by setting the `MOCK_INTERVIEW_AI_*` env vars.

Moves the mock interview from an in-browser simulation (`apps/web/src/lib/interview-engine.ts`) to a persisted backend module. An LLM asks questions, follows up, and scores answers against a rubric. Completed sessions count as `MOCK_INTERVIEW` readiness evidence.

The model provider is configured through env vars that will be added later. Until they're set, the same flow runs on a deterministic interviewer, which is the current engine moved server-side. The feature works end to end without a model.

---

## 1. Objectives

- Persist every session, question, answer, and score per user, scoped to the tenant.
- Generate questions and follow-ups that reflect the topic, role level, company style, and what the candidate actually said.
- Score each answer against a topic-specific rubric and give feedback per answer.
- Produce a final report. The server computes the numbers; the model only writes the narrative.
- Feed completed sessions into interview-readiness snapshots as `MOCK_INTERVIEW` evidence.
- Enforce the time limit, question cap, and cost limits on the server.

### Out of scope
- Server-side speech-to-text or text-to-speech. The browser's Web Speech API stays the voice layer.
- WebSockets. Turn-based request/response is enough because each turn is one model call.
- pgvector or RAG over ideal answers. The `plans/14` idea is deferred.
- Leaderboard points and badges for mock interviews.

---

## 2. Database Schema (Prisma)

New enums:
- `MockInterviewTopic { SYSTEM_DESIGN BEHAVIORAL CODING DSA }`
- `MockInterviewRoleLevel { JUNIOR MID SENIOR STAFF }`
- `MockInterviewCompanyStyle { GENERIC FAANG STARTUP ENTERPRISE }`
- `MockInterviewStatus { ACTIVE SCORING COMPLETED FAILED ABANDONED }`
- `MockInterviewEngine { LLM DETERMINISTIC }`

`model MockInterviewSession`:
- `id`, `userId`, `tenantId?`, `topic`, `roleLevel`, `companyStyle`, `durationMinutes`
- `status` (default `ACTIVE`), `engine`
- `preparationTaskId?`: set when the session is started from a `RUN_MOCK_INTERVIEW` plan task
- `startedAt`, `deadlineAt`, `endedAt?`
- `overallScore Int?`, `competencies Json?`, `strengths String[]`, `improvements String[]`, `summary String?`, `failureReason?`
- `version Int @default(0)` for optimistic concurrency
- Relations: `user` (cascade), `turns`. `tenantId` is a plain scoped column, as on `Resume`
- Indexes: `@@index([userId, startedAt(sort: Desc)])`, `@@index([userId, status])`, `@@index([status, deadlineAt])` for the abandonment sweep, `@@index([tenantId])`

`model MockInterviewTurn`:
- `id`, `sessionId`, `ordinal`, `question`, `askedAt`
- `answer String?`, `answeredAt?`
- `scores Json?`: rubric dimension to 1–4 score
- `score Int?`: the answer's score normalized to 0–100
- `feedback String?`
- `@@unique([sessionId, ordinal])`, cascade on session delete

Migration: `<timestamp>_mock_interview_sessions`. It's additive, so no backfill is needed.

---

## 3. Backend: `apps/api/src/modules/mock-interview`

This follows the DDD layout in `architecture.md`.

### Domain
- `entities/mock-interview-session.ts`: an aggregate with a private constructor and the factories `start`, `recordAnswer`, `askNext`, `beginScoring`, `complete`, `fail`, `abandon`. It enforces these invariants:
  - Answers are only accepted while `ACTIVE` and before `deadlineAt` plus a 30-second grace period.
  - Only the latest unanswered turn can be answered.
  - At most `MAX_TURNS = 12` turns.
  - Answers are capped at 4,000 characters.
- `rubrics/mock-interview-rubrics.ts`: dimensions per topic, each with anchored 1–4 descriptors that are shown to the model and used by the fallback.
  - Coding / DSA: Problem Solving, Technical Depth, Complexity Analysis, Communication
  - System Design: Requirements, Architecture, Trade-offs, Scalability & Reliability
  - Behavioral: Structure (STAR), Ownership, Impact, Communication
- `scoring/mock-interview-scoring.ts`: pure functions.
  - A turn's score is the mean of its dimension scores, mapped from 1–4 onto 0–100.
  - Each competency is the mean of that dimension across answered turns.
  - The overall score is the mean of the competencies.
  - Severity bands stay as they are today: `good` at 75 or above, `warning` at 50 or above, `critical` below that.
  - Numbers never come from free model text.
- `interfaces/mock-interviewer.interface.ts` defines `IMockInterviewer`:
  - `openingQuestion(context)` returns `{ question }`.
  - `evaluateAndFollowUp(context, history, answer)` returns `{ scores, feedback, nextQuestion }`.
  - `summarize(context, turns, computedScores)` returns `{ summary, strengths, improvements }`.
- `interfaces/mock-interview-repository.interface.ts`.

### Infrastructure
- `interviewers/openai-compatible-mock-interviewer.ts`:
  - Uses the same `fetch` and JSON-mode pattern as `OpenAiCompatibleReadinessProvider`.
  - Every response goes through a strict parser. Rubric keys must match exactly, and scores must be integers from 1 to 4.
  - Candidate answers are sent as delimited data, and the system prompt tells the model to treat them as untrusted content.
  - Timeouts: 15 seconds per turn and 30 seconds for the summary.
- `interviewers/deterministic-mock-interviewer.ts`: the current openers, follow-up banks, and keyword heuristics, moved over from `interview-engine.ts` and mapped onto the rubric dimensions.
- `interviewers/resilient-mock-interviewer.ts`: the `IMockInterviewer` that Nest injects.
  - It uses the LLM when `MOCK_INTERVIEW_AI_ENABLED=true` and the endpoint, key, and model are all set.
  - If an LLM call fails or returns an invalid response, that turn falls back to the deterministic interviewer.
  - The session's `engine` records `LLM` only if every scored turn came from the LLM.
- `repositories/mock-interview.repository.ts`: Prisma implementation. Writes use a `version` check (`updateMany … where version`) so a double-submitted answer can't be recorded twice.
- `processors/mock-interview-scoring.processor.ts`: a BullMQ job that runs `summarize`, persists the final report, and moves the session to `COMPLETED`.
  - 3 attempts with exponential backoff.
  - When retries are exhausted, it falls back to a deterministic summary rather than leaving the session in `FAILED`. Scores already exist at that point.
- A scheduler job, `mock-interview-abandonment-sweep`, runs every 10 minutes through the existing `scheduler` module.
  - `ACTIVE` sessions more than 15 minutes past `deadlineAt` are ended and scored if they have at least one answer.
  - Sessions with no answers are marked `ABANDONED`.

### Application: `mock-interview.service.ts`
- `start(userId, tenantId, config, preparationTaskId?)`:
  - Rejects with 409 if the user already has an `ACTIVE` session (the response includes its id so the UI can resume it).
  - Enforces a daily cap, `MOCK_INTERVIEW_DAILY_LIMIT` (default 10).
  - Validates task ownership.
  - Creates the session and the opening turn.
- `answer(userId, sessionId, turnId, answer, version)`:
  - Evaluates the answer and stores its scores and feedback.
  - Asks the next question unless the deadline has passed or the turn cap is reached. In that case it begins scoring.
- `end(userId, sessionId)`: begins scoring, or marks the session `ABANDONED` if nothing was answered.
- `get(userId, sessionId)` and `list(userId, cursor)` (paginated history, 20 per page).
- On `COMPLETED` it emits a `mock-interview.completed` event (`@nestjs/event-emitter`).

### Presentation: `/api/v1/mock-interviews`
| Method | Path | Purpose |
|---|---|---|
| `POST` | `/` | Start a session. Returns the session and the first question |
| `GET` | `/` | Session history (summary rows) |
| `GET` | `/active` | The session in progress, if any (used to resume after a reload) |
| `GET` | `/:id` | Full session with turns and the final report |
| `POST` | `/:id/turns/:turnId/answer` | Submit an answer. Returns the scored turn and the next question, or the `SCORING` status |
| `POST` | `/:id/end` | End early |

DTOs use `class-validator`. Every query is scoped to the authenticated user, and requests for another user's session return 404.

### Env (documented in `apps/api/.env.example`)
`MOCK_INTERVIEW_AI_ENABLED`, `MOCK_INTERVIEW_AI_ENDPOINT`, `MOCK_INTERVIEW_AI_API_KEY`, `MOCK_INTERVIEW_AI_MODEL`, `MOCK_INTERVIEW_DAILY_LIMIT`

---

## 4. Readiness Integration (`interview-preparation`)

- `InterviewPreparationEvidence` gains `mockInterview: Record<InterviewRoundType, { score; observedAt }>`.
  - Each score is the mean `overallScore` of the user's 3 most recent `COMPLETED` sessions whose topic matches the round type.
  - `observedAt` is the latest `endedAt`.
- Topic to round type:
  - `CODING`, `DSA` → `CODING`
  - `SYSTEM_DESIGN` → `SYSTEM_DESIGN`
  - `BEHAVIORAL` → `BEHAVIORAL` and `RESUME_ROLE_FIT`
  - `CUSTOM` → any topic
- `evidenceSourcesFor` adds `MOCK_INTERVIEW` to every round type, and `metricForSource` reads the round-specific metric.
- This changes how readiness is calculated, so `InterviewReadinessFormulaVersion` moves from `'v1'` to `'v2'`. Old snapshots keep their `v1` label.
- A listener on `mock-interview.completed`:
  - increments `readinessRevision` on the user's `ACTIVE` plans, so the UI shows the snapshot as out of date;
  - completes the linked `RUN_MOCK_INTERVIEW` task if `preparationTaskId` is set.

---

## 5. Shared Types (`packages/shared-types`)

- `InterviewSessionStatus` becomes `'IDLE' | 'ACTIVE' | 'SCORING' | 'COMPLETED' | 'FAILED' | 'ABANDONED'`.
- `TranscriptEntry` stays as it is for the live view.
- New types:
  - `MockInterviewTurnDto` (question, answer, score, dimension scores, feedback)
  - `MockInterviewSessionDto`
  - `MockInterviewSummaryDto` for history
  - `StartMockInterviewDto`, `SubmitMockInterviewAnswerDto`, `MockInterviewAnswerResultDto`
  - `MockInterviewEngine`
- `MOCK_INTERVIEW_RUBRICS` holds the dimension labels so the web report renders the same names.

---

## 6. Web (`apps/web`)

- `lib/mock-interview-api.ts`: typed client calls, matching `resume-api.ts`.
- `lib/mock-interview-options.ts`: the select options and labels kept from `interview-engine.ts`. The engine file itself is deleted.
- `store/mock-interview.store.ts`:
  - Calls the API instead of the local engine.
  - Adds an "interviewer is thinking" state while an answer is evaluated.
  - The timer counts down to the server `deadlineAt`.
  - On reload it resumes an `ACTIVE` session.
  - It polls `GET /:id` while the status is `SCORING`.
  - Speech handling in `lib/speech.ts` is unchanged.
- `_components`:
  - `InterviewConsole` shows the thinking state and disables input while a request is in flight.
  - `FeedbackReport` adds a per-question breakdown: question, answer, score, and feedback.
  - It also shows a small "practice scoring" note when `engine` is `DETERMINISTIC`.
- New `/dashboard/mock-interview/history` (list) and `/dashboard/mock-interview/[id]` (report view) pages. Both are responsive and use existing `@elevatesde/ui` components.
- Readiness tasks deep-link to `/dashboard/mock-interview?taskId=…&topic=…`, which pre-fills the setup form.

---

## 7. Testing

- API unit tests:
  - session entity invariants (deadline, turn cap, stale version, answering an old turn)
  - scoring aggregation
  - the strict LLM response parser, including malformed and prompt-injected JSON
  - resilient fallback
  - the service using a fake interviewer
  - the readiness evidence mapping and revision bump
- Processor test: retries are exhausted, and the session still completes with a deterministic summary.
- Playwright: a full typed-answer session on the deterministic engine, from setup through the report and history.

---

## 8. Tasks

- [x] Prisma enums, models, and migration
- [x] Shared types and rubrics
- [x] Domain: entity, rubrics, scoring, interfaces, with tests
- [x] Interviewers: deterministic, OpenAI-compatible, resilient, with tests
- [x] Repository, service, controller, DTOs, module registration
- [x] Scoring processor and abandonment sweep job
- [x] Readiness integration (evidence, formula v2, completion listener)
- [x] Web API client, store rewrite, console and report updates
- [x] History and session detail pages
- [x] `.env.example`, `architecture.md` update, Playwright e2e
