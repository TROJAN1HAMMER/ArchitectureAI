# ADR-002: Authentication & Session Strategy

## Context & Problem Statement

ArchitectAI requires a production-grade authentication and user identity system to secure its modules, configurations, and future workspace mappings. We need to decide on our password hashing format, access token management, session tracking, token persistence on the client side, and strategies to prevent typical web attacks (XSS, CSRF, brute force).

---

## Decision Drivers

- **Security Boundaries**: Prevent leakage of credentials and tokens via scripts (XSS) or browser actions (CSRF).
- **Control and Auditing**: Ability to audit active sessions, support multiple devices per user, and revoke specific device access upon logout.
- **Standards Compliance**: Follow OWASP secure standards for hashing and validation pipeline structures.
- **Developer Experience (DX)**: Simple integration with NestJS guards and OpenAPI Swagger schemas.

---

## Considered Options

1. **Session-Only Cookie Authentication**:
   - _Pros_: Simple server-side session management.
   - _Cons_: Relies entirely on cookie transport, which increases susceptibility to CSRF without strict CSRF tokens management; hard to scale across independent APIs in future phases.
2. **Access Token + LocalStorage Refresh Token**:
   - _Pros_: Completely stateless, simple client-side persistence.
   - _Cons_: If an XSS vulnerability exists, the refresh token can be extracted from LocalStorage, allowing permanent offline session hijack.
3. **Hybrid In-Memory JWT + HttpOnly Cookie Refresh Token (Chosen)**:
   - _Pros_: Limits token theft vectors (access token is never written to disk/storage) while refresh token is protected by HttpOnly. Offers high security against both XSS and CSRF.

---

## Decision Outcome

We decided on the **Hybrid In-Memory JWT + HttpOnly Session Cookie** strategy:

1. **Argon2id for Passwords**: We will use the `argon2id` profile (OWASP recommendation) to hash user passwords on registration.
2. **In-Memory Access Tokens (JWT)**: Issued on successful login, containing role and user claims. Access tokens are short-lived (15 minutes) and stored in-memory (React State) to prevent XSS storage reads. Passed via standard `Authorization: Bearer <token>` headers.
3. **HttpOnly Refresh Cookies**: Rotated refresh tokens are stored in an `HttpOnly`, `Secure` (production), `SameSite=Lax` cookie. Using `Lax` matches typical single-origin SPA requirements while supporting safe third-party redirects.
4. **Session-Based DB Tracking**: Refresh tokens are linked to a unique `Session` model record in the database tracking device user-agent, IP address, expiration, and revocation.

### Why the Session Model?

- **Multi-Device Support**: A user can log in on different devices, creating distinct database session records.
- **Auditability**: Admin or user audits can inspect active devices, locations, and last-seen activity logs.
- **Granular Revocability**: Logging out of a device simply sets `revokedAt = DateTime.now()` on that specific session.

---

## Alternatives Considered & Rejected

- **Zod for DTO Validation**: Rejected for request inputs validation. Instead, NestJS standard `class-validator` and `class-transformer` decorators are used. This allows the `@nestjs/swagger` compiler plugin to dynamically generate Swagger JSON schemas directly from the DTO classes without manual mapping definitions.

---

## Consequences

- **Database Overhead**: Standard stateless JWT is bypassed for refreshes; every `/auth/refresh` validation will perform a database look-up against the active `Session` record. Given refresh tokens have a 15-minute rotation window, this database load is negligible.
- **SPA State Loss**: Reloading the page wipes the in-memory access token. The frontend must silently call `/auth/refresh` on application load to restore the access token from the HTTP-only cookie.

---

## Future Evolution

As the platform scales, the identity system will evolve along the following paths:

1. **Compromise Detection (Token Reuse Detection)**: Implement checks where, if a rotated refresh token is presented more than once, it signals a potential token interception. In this event, the server will instantly invalidate all active sessions for the target user to safeguard account data.
2. **Redis Invalidation Layer**: To prevent database lookups on every access token validation or to immediately revoke access tokens prior to their 15-minute expiration, a Redis-based token blacklist/whitelist cache will be introduced.
3. **MFA Integration**: Introduce Time-based One-time Passwords (TOTP) or WebAuthn/FIDO2 MFA registration interfaces for enhanced console administration access.
4. **Federated OAuth / OIDC**: Connect third-party developers login credentials through OAuth providers (specifically GitHub OAuth) to streamline repository authorization access.
