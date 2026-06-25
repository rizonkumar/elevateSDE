# Backend: WebSockets Voice Stream & RAG Similarity Interviewer

> **Status: TODO** — planned, not yet implemented.

A real-time socket server that receives transcription chunks from the user, computes vector embeddings, matches them against ideal answers using `pgvector`, and responds with dynamic follow-up questions.

## Database & pgvector Schema

- **Ideal Solutions Store:** Add `Question` database entity including a `pgvector` embedding field.
- **Vector Index:** Create cosine distance indexes for fast similarity checks.

## Proposed Changes

### NestJS Backend API (`apps/api`)

#### [NEW] [interview.gateway.ts](file:///Users/rizonkumarrahi/Developer/elevateSDE/apps/api/src/modules/interview/presentation/interview.gateway.ts)

- Socket.io server handling realtime connections (`on('audio-chunk')`, `on('text-message')`).

#### [NEW] [rag-similarity.service.ts](file:///Users/rizonkumarrahi/Developer/elevateSDE/apps/api/src/modules/interview/application/rag-similarity.service.ts)

- Conversational LLM system executing RAG:
  1. Generate text embedding.
  2. Perform cosine similarity check against database solutions.
  3. Formulate conversational follow-ups based on candidate's exact responses.

---

## Verification Plan

### Automated Tests

- Validate vector search results:
  ```bash
  pnpm --filter=@elevatesde/api test src/modules/interview
  ```
