# Walkthrough — Phase 7: AI Repository Understanding / RAG Foundation

## Objective

Build the grounded Retrieval-Augmented Generation (RAG) layer for ArchitectAI on top of the Phase 4–6 repository intelligence stack (`RepositoryFile`, `KnowledgeGraph`, `SemanticIndex`, `Embedding`).

## Architecture & Workflow

```text
User Query
    ↓
QueryUnderstandingService (Keywords & Intents)
    ↓
ContextRetrieverService
    ├── SemanticSearchService (Vector similarity)
    └── KnowledgeGraphService (Graph relationships)
    ↓
ContextRankerService (Multi-signal weighting: Semantic 60%, Graph 25%, Lexical 15%)
    ↓
ContextBuilderService (Bounded context budget & prompt injection isolation)
    ↓
ILLMProvider (MockLLMProviderService)
    ↓
Grounded Response + SourceReferences
    ↓
Conversation Persistence (PostgreSQL Conversation & ConversationMessage)
```

## Changes Implemented

### 1. Database Schema

- Models added: `Conversation` and `ConversationMessage`.
- Enum added: `MessageRole` (`USER`, `ASSISTANT`).
- Applied migration: `20260824151754_add_ai_rag_foundation`.

### 2. Workspace Version

- Updated `APP_VERSION = "0.1.5-ai-rag-foundation"` in `packages/shared/src/constants/index.ts`.

### 3. Backend AI Module (`backend/src/modules/ai`)

- `llm/llm-provider.interface.ts`: Interface definitions.
- `llm/mock-llm-provider.service.ts`: Offline deterministic provider.
- `llm/llm-provider.factory.ts`: Dynamic provider factory.
- `rag/query-understanding.service.ts`: Heuristic query parser.
- `rag/context-retriever.service.ts`: Combined vector + graph context retriever.
- `rag/context-ranker.service.ts`: Multi-signal context ranker.
- `rag/context-builder.service.ts`: Bounded context builder with untrusted data isolation prompts.
- `conversation/conversation.service.ts`: User & repository isolated conversation history manager.
- `rag/rag.service.ts`: Primary RAG orchestrator with Redis lock protection (`repository:ai-lock:<repo>:<user>`, TTL 60s, `EX 60 NX`).
- `ai.controller.ts`: REST controller for AI chat & conversation CRUD.
- `ai.module.ts`: Module registered in `AppModule`.

### 4. Configuration

- Updated `backend/src/common/config/validation.ts` and `backend/.env.example` with `LLM_PROVIDER=mock`, `LLM_MODEL`, `MAX_CONTEXT_CHARS=8000`.

### 5. Frontend AI Assistant

- Created `frontend/src/components/ai/`:
  - `AIChat.tsx`
  - `AIMessage.tsx`
  - `AISourceList.tsx`
  - `AIChatInput.tsx`
  - `ConversationList.tsx`
- Embedded **"AI Assistant ✨"** tab inside `/repositories/[id]` detail page.

## Verification Results

- `pnpm --filter backend test` — PASS (29 test suites, 82 unit/integration tests)
- `pnpm --filter backend test -- ai-rag.integration.spec.ts` — PASS
- `pnpm typecheck` — PASS (0 errors across 3 workspace packages)
- `pnpm lint` — PASS (0 warnings/errors)
- `pnpm --filter backend build` — PASS
- `pnpm --filter frontend build` — PASS

## Next Recommended Phase

**Phase 8: Architecture Discovery & Auditing** — Automated architectural drift detection, component dependency analysis, and structural design pattern checks.
