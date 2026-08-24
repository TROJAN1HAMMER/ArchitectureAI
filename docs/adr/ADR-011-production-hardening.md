# ADR-011: Production Hardening & Multi-Tenant Deployment Readiness

## Status

Accepted

## Context

ArchitectAI requires production-ready resilience, rate-limiting, request correlation tracing, credential sanitization, OpenTelemetry observability, multi-tenant IDOR isolation, and deployment manifests to operate safely in multi-tenant cloud environments.

## Decision

1. **Config Validation**:
   - `backend/src/common/config/validation.ts` enforces strict Zod validation for production environment variables and prohibits wildcard CORS origins in production mode.

2. **API Rate Limiting**:
   - `@nestjs/throttler` with `ThrottlerGuard` protects all endpoints globally, while `@Throttle(...)` decorators enforce strict limits on expensive background jobs. Returns HTTP 429 (`RATE_LIMIT_EXCEEDED`).

3. **Request Correlation & Exception Envelope**:
   - Every HTTP request receives or generates an `X-Request-ID` header. `AllExceptionsFilter` formats error responses with standardized status codes and top-level `requestId`.

4. **Credential & Log Sanitization**:
   - `LoggerService` automatically redacts sensitive keywords (JWTs, secrets, passwords, bearer tokens) before writing output.

5. **Readiness Probes & Reusable Redis Locks**:
   - `/health/ready` verifies PostgreSQL, Redis, and `pgvector` availability. `RedisLockService` encapsulates `SET key token EX ttl NX` locking with safe token matching.

6. **OpenTelemetry Observability**:
   - `TelemetryService` instruments operational spans when `OTEL_ENABLED=true` without leaking private repository code.

7. **Production Deployment Manifest**:
   - `docker-compose.prod.yml` defines container healthchecks, persistent volumes, and restart policies.

## Consequences

### Positive

- Prevents resource exhaustion via strict rate limiting and request body bounds.
- Full request correlation tracing from client request headers to server logs and error responses.
- Guarantees multi-tenant IDOR protection across all endpoints.
- Ready for production deployment via Docker Compose.

### Negative

- Rate limits may need tuning for high-throughput automated CI/CD pipeline triggers.
