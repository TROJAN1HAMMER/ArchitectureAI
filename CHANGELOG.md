# Changelog

All notable changes to this project will be documented in this file.

## [0.2.5] - 2026-08-24

### Added

- Request context correlation tracking (`X-Request-ID` response headers via `AsyncLocalStorage`)
- Structured logging interceptor printing request method, path, durations, and request IDs
- Redis infrastructure connection module using `ioredis` with connection listeners and retry strategy
- Central ErrorCode enum and error mapping configurations in exceptions filter
- Secure HTTP headers (Helmet)
- Strict origins CORS settings validation
- Uptime liveness probes and database/Redis ready probes health checks

### Changed

- Refactored `LoggerService` to dynamically format with active request ID
- Configured comma-separated origin strings validation for credentialed requests
- Upgraded Swagger OpenAPI description and health endpoint documentation

## [0.2.0] - 2026-08-23

### Added

- OWASP-aligned `argon2id` passwords hashing utility
- In-memory short-lived JWT access tokens and 7-day rotated `HttpOnly` refresh cookie lifecycles
- Database sessions audit logging and session revocation on logouts
- Role-Based Access Control decorators and guards mappings
- Client-side React `AuthProvider` memory tokens manager
- Axios concurrent API refresh interceptor queues

### Changed

- Configured Next.js protected routing layout groups

## [0.1.0] - 2026-07-16

### Added

- PNPM Workspace
- Next.js Frontend
- NestJS Backend
- Shared Package
- Docker Compose
- PostgreSQL
- Redis
- Prisma
- Logger Abstraction
- Health Module
- Swagger
- Global Config Validation
- CI/CD
- Husky
- Commitlint
- Lint Staged
- Makefile
- ADR-001
