# AGENTS.md

## What this service is

A NestJS 11 (TypeScript) authentication service: the component that owns identity and access for the wider system. Its domain is the auth lifecycle — registration, credential verification, token-based sessions, protected routes, role-based access, and session revocation.

HTTP surface:

- Authentication: `POST /auth/register`, `/auth/login`, `/auth/refresh`, `/auth/logout`
- Authenticated user: `GET /users/me`
- Admin (role-gated): `GET /admin/users`, `DELETE /admin/users/:id`, `PATCH /admin/users/:id/roles`

## Domain model

- **User** — `id` (UUID), `email` (unique, normalized), `passwordHash` (Argon2), `roles`.
- **Roles** — `RoleName.USER` (default) and `RoleName.ADMIN`; role checks separate user endpoints from admin ones.
- **Sessions** — a short-lived access JWT plus an opaque refresh token. Only the SHA-256 hash of the refresh token is stored; refresh rotates it, logout revokes it, and reuse revokes the whole token family.
- Plaintext passwords exist only at the HTTP boundary. They are hashed before persistence and never leave the service.

## Architecture

Feature modules:

- `auth` — authentication entry points; delegates to the users domain.
- `users` — user domain and persistence: service, repository, DTOs, domain errors.
- `admin` — privileged operations on top of the users service.

Inside a module the layering is **Controller → Service → Repository**: controllers handle transport only, services hold business rules, repositories are the only code that touches storage.

Global wiring lives in `main.ts` / `app.module.ts`:

- `ValidationPipe` with `whitelist` + `transform` (drops unknown fields, converts payloads).
- Global `ConfigModule` (`isGlobal`) and `JwtModule` (access secret/TTL from env).
- Domain-error filters registered via `APP_FILTER` (duplicate email, invalid credentials, invalid refresh token, user not found, last admin, self-delete).
- Guards registered via `APP_GUARD`, in order: `ThrottlerGuard` → `JwtAuthGuard` → `RolesGuard`.
- `JwtAuthGuard` is global and secure-by-default: routes opt out with `@Public()`, the access token must have `type: 'access'`, and the user is re-resolved from `UsersService` on every request so role changes and deletions apply immediately.
- `RolesGuard` enforces `@Roles(...)` metadata from the freshly resolved user.

`UsersModule` exports `UsersService` and `UsersRepository`; other modules import it. There must be exactly one repository instance — never provide `UsersRepository` elsewhere. It also owns the startup bootstrap that promotes/creates the first admin from `BOOTSTRAP_ADMIN_EMAIL` / `BOOTSTRAP_ADMIN_PASSWORD` when no admin exists.

## How a request flows

Registration is the reference path; new features should follow the same shape:

1. The controller receives a DTO that the global pipe has already validated.
2. The service applies business rules: an early email lookup to fail fast, Argon2 hashing, assigning the default `USER` role.
3. The repository normalizes the email (`trim().toLowerCase()`), checks uniqueness and writes in one uninterrupted synchronous step (no `await` between check and insert, so concurrent requests cannot both pass), and generates the `id`.
4. Domain failures are raised as typed errors (e.g. `DuplicateEmailError`) and turned into HTTP responses by global filters — never caught in controllers.
5. Outbound data is reshaped by an allow-list mapper (`toUserResponse`) before it leaves the service.

## Design intent

- Storage sits behind `UsersRepository` so swapping the in-memory store for a real database stays a local change. Keep repository methods `async`.
- Response mapping is allow-list based (`plainToInstance` + `excludeExtraneousValues`): new fields stay hidden unless explicitly exposed. This is a security boundary, not formatting.
- Uniqueness is enforced where the write happens, so it remains correct under concurrency regardless of service-level checks.
- Domain errors plus global filters keep controllers thin and HTTP responses consistent.

## Invariants

- **Never expose `passwordHash`.** Return `UserResponseDto` via `toUserResponse`; add response fields to that DTO and mark them `@Expose()`.
- **Uniqueness belongs to the repository.** `UsersRepository.create` is the authority; the service pre-check only avoids wasted hashing and must not replace it.
- **`id` is generated in the repository.**
- **The default `USER` role is assigned in `UsersService.create`.**
- **Access tokens are JWTs; refresh tokens are opaque.** Never store a plaintext refresh token — hash it. Never trust access-token claims for authorization without re-resolving the user.
- **Validation lives in DTOs** via `class-validator`; do not validate in controllers.
- **Throw domain errors**, map them to HTTP in `APP_FILTER` providers; do not use `try/catch` in controllers.
- **All persistence goes through `UsersRepository`.**
- **Rate limits stay on**: 100 req/min globally; 10 req/min for registration and login; 20 req/min for refresh and logout.

## Code conventions

- Prettier (single quotes, semicolons) is enforced by ESLint, not optional.
- eslint uses typescript-eslint type-checked rules; `any` is allowed but avoid it in new code.
- TypeScript: `strictNullChecks` is on; `noImplicitAny` is off.
- Follow the existing layering, naming, and DTO patterns rather than introducing new ones.

## Commands and verification

- Install: `npm install`
- Dev: `npm run start:dev`
- Build: `npm run build`
- Lint (auto-fix): `npm run lint`
- Unit tests: `npm test` (`src/**/*.spec.ts`, Jest `rootDir` is `src`)
- E2E tests: `npm run test:e2e` (`test/app.e2e-spec.ts`)
- Format: `npm run format`

Run `npm run lint` and `npm run build` before considering work done, and add unit tests when changing service or repository behavior. One lint warning for the bootstrap promise in `src/main.ts` is expected; leave it.

## Git

- Do not commit, push, or create branches unless explicitly asked.
- Commit messages are short, lowercase descriptions (e.g. `added AdminModule`, `fixed registration: ...`).
- Inspect `git status` and `git diff` before committing; never commit secrets.
