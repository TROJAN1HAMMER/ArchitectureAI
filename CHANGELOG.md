# Changelog

All notable changes to this project will be documented in this file.

## [1.0.0] - 2026-07-16

### Added

- Monorepo workspace setup with `pnpm`.
- NestJS v10 backend with Modular configuration, Prisma service dependency injection, Custom Winston Logger wrapper, Health check module, Global Validation Pipes, and Exception Filters.
- Next.js v15 frontend using App Router, clean folders structure (components, providers, services), central Axios instance, and TanStack Query provider.
- Shared package `packages/shared` for domain types, constants, schemas, and utils.
- Named network and named volume docker-compose setup for PostgreSQL and Redis.
- Developer Experience upgrades (Makefile commands, Commitlint, Husky, lint-staged, shared `tsconfig.base.json`).
- GitHub Actions CI workflow to validate prisma schema, lint, typecheck, and build workspace packages.
