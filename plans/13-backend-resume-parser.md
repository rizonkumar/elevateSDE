# Backend: AWS S3 Upload & LLM Resume ATS Analyzer

> **Status: TODO** — planned, not yet implemented.

A microservice component receiving candidate resume documents, uploading them securely to AWS S3, and parsing the raw text content to evaluate ATS matches via Gemini/OpenAI models.

## Proposed Changes

### NestJS Backend API (`apps/api`)

#### [NEW] [s3.service.ts](file:///Users/rizonkumarrahi/Developer/elevateSDE/apps/api/src/modules/resume/infrastructure/s3.service.ts)

- Handler generating presigned POST/GET links or uploading buffers directly into secure AWS S3 buckets.

#### [NEW] [resume-parser.service.ts](file:///Users/rizonkumarrahi/Developer/elevateSDE/apps/api/src/modules/resume/application/resume-parser.service.ts)

- Integrates PDF text extraction.
- Dispatches LLM parsing payloads evaluating core skills, formatting errors, and matching indicators relative to target job specifications.

---

## Verification Plan

### Automated Tests

- Test S3 connectivity and upload functions:
  ```bash
  pnpm --filter=@elevatesde/api test src/modules/resume
  ```
