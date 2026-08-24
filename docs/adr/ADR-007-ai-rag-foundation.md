# ADR-007: AI Repository Understanding / RAG Foundation

## Status

Accepted

## Context

ArchitectAI requires grounded natural-language repository understanding so engineers can ask architectural questions about codebases and receive answers tied to actual implementation details. To ensure production quality, safety, and offline local development support, the RAG layer needed to compose existing Phase 4–6 abstractions (`RepositoryFile`, `KnowledgeGraph`, `SemanticIndex`, `Embedding`) without introducing heavy external orchestration libraries (such as LangChain or LangGraph) or requiring paid API keys by default.

## Decision

1. **Provider Abstraction (`ILLMProvider`) & Default Mock**:
   - Introduce `ILLMProvider` interface to decouple RAG logic from LLM implementations.
   - Default `LLM_PROVIDER=mock` uses `MockLLMProviderService`, producing offline, deterministic responses for tests and local development without requiring external network calls or API keys.

2. **Combined Grounded Retrieval**:
   - `ContextRetrieverService` composes `SemanticSearchService` (vector similarity) and `KnowledgeGraphService` (relationship graph) to retrieve grounded evidence.
   - `ContextRankerService` weights signals (Semantic: 60%, Graph: 25%, Lexical: 15%) and deduplicates candidates.

3. **Context Budgeting & Untrusted Data Isolation**:
   - `ContextBuilderService` enforces `MAX_CONTEXT_CHARS` (default: 8000) to keep context bounded.
   - System prompts explicitly instruct the LLM that retrieved repository code/documentation is untrusted `DATA` to prevent prompt injection inside source comments or markdown files.

4. **Redis AI Lock & Ownership Security**:
   - Acquire Redis lock `repository:ai-lock:<repositoryId>:<userId>` (TTL 60s, `EX 60 NX`) to prevent rapid duplicate requests.
   - Enforce repository and conversation ownership checks across all endpoints to prevent IDOR leaks.

5. **PostgreSQL Conversation Persistence**:
   - Persist chat history in `Conversation` and `ConversationMessage` tables linked to `User` and `Repository`.

## Consequences

### Positive

- Production-grade grounded RAG architecture working out-of-the-box offline.
- Explicit source citations for every AI claim.
- Bounded context and prompt injection security controls.
- Extensible provider factory allowing seamless addition of OpenAI/Ollama providers in future phases.

### Negative

- Mock provider produces structured template responses; live LLM intelligence requires setting `LLM_PROVIDER=openai` and an API key.
