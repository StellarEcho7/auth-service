# auth-service

Authentication and access-control service built with NestJS 11 and TypeScript. It owns the identity lifecycle for the wider system: registration, credential verification, JWT access tokens, rotating refresh-token sessions, role-based access, and session revocation.

## Features

- Email/password registration with Argon2 hashing and normalized, case-insensitive unique emails.
- Login with timing-safe credential checks: unknown emails are verified against a dummy hash.
- Short-lived **access JWT** plus **opaque refresh tokens**.
- Refresh-token rotation; only SHA-256 hashes are persisted; reuse of a rotated token revokes the whole token family.
- Logout revokes the presented refresh token.
- Global, secure-by-default authentication: routes opt out with `@Public()`, and the user is re-resolved from storage on every request, so role changes and deletions apply immediately.
- Role-based access (`USER`, `ADMIN`) via `@Roles(...)`.
- Admin user management: list, delete, and update roles, with last-admin and self-deletion protection.
- First admin bootstrapped from environment variables.
- Rate limiting per route and globally.
- Startup configuration validation with Joi: the service fails fast on missing or invalid environment variables.

## Tech stack

| Concern         | Choice                                     |
| --------------- | ------------------------------------------ |
| Runtime         | Node.js 20+                                |
| Framework       | NestJS 11                                  |
| Language        | TypeScript (strict null checks)            |
| Passwords       | Argon2                                     |
| Tokens          | `@nestjs/jwt` (access), `node:crypto`      |
| Validation      | `class-validator` (DTOs), Joi (environment) |
| Rate limiting   | `@nestjs/throttler`                        |
| Persistence     | In-memory repositories (database-ready)    |
| Tests           | Jest + Supertest                           |

## Architecture

The service is split into feature modules:

- `auth` — authentication endpoints, token issuance/rotation, guards, decorators.
- `users` — user domain and persistence (service, repository, DTOs, domain errors, admin bootstrap).
- `admin` — privileged operations on top of the users service.

Inside a module the layering is **Controller → Service → Repository**. Controllers handle transport only, services hold business rules, and repositories are the only code that touches storage.

Global request pipeline:

```text
ValidationPipe
  -> ThrottlerGuard        (rate limits)
  -> JwtAuthGuard          (@Public() opt-out, Bearer access token, user re-resolved from storage)
  -> RolesGuard            (@Roles(...) metadata)
  -> Controller -> Service -> Repository
  -> domain error -> APP_FILTER -> HTTP response
```

## Getting started

### Prerequisites

- Node.js 20 or newer
- npm 10 or newer

### Install

```bash
npm install
```

### Configure the environment

Copy the example file and adjust the values:

```bash
cp .env.example .env          # macOS / Linux
Copy-Item .env.example .env   # Windows PowerShell
```

Generate a strong access-token secret (at least 32 characters):

```bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Environment variables:

| Variable                   | Required                | Default       | Description                                                        |
| -------------------------- | ----------------------- | ------------- | ------------------------------------------------------------------ |
| `NODE_ENV`                 | No                      | `development` | One of `development`, `test`, `production`.                        |
| `PORT`                     | No                      | `3000`        | HTTP port (1–65535).                                               |
| `JWT_ACCESS_SECRET`        | Yes                     | —             | Access-token signing secret. Minimum 32 characters.                |
| `JWT_ACCESS_TTL_SECONDS`   | No                      | `900`         | Access-token lifetime in seconds (minimum 60).                     |
| `REFRESH_TOKEN_TTL_DAYS`   | No                      | `7`           | Refresh-token lifetime in days (minimum 1).                        |
| `BOOTSTRAP_ADMIN_EMAIL`    | With the password below | —             | Email of the first admin.                                          |
| `BOOTSTRAP_ADMIN_PASSWORD` | With the email above    | —             | Password of the first admin (minimum 8 characters).                |

Configuration is validated at startup. Invalid or missing values stop the process with a descriptive error; there is no silent fallback for `JWT_ACCESS_SECRET`.

### Run

```bash
npm run start:dev    # watch mode
npm run build        # compile to dist/
npm run start:prod   # run the compiled build
```

The server listens on `PORT` (default `http://localhost:3000`).

## Admin bootstrap

On startup, if **both** `BOOTSTRAP_ADMIN_EMAIL` and `BOOTSTRAP_ADMIN_PASSWORD` are set and no admin exists:

- an existing user with that email is promoted to `ADMIN`, or
- a new admin account is created with the supplied password.

If at least one admin already exists, bootstrap is a no-op. Omit both variables to disable it. The password is never logged.

## API

All endpoints are JSON. Authenticated endpoints expect:

```http
Authorization: Bearer <accessToken>
```

### Authentication

| Method | Path             | Public | Rate limit | Success |
| ------ | ---------------- | ------ | ---------- | ------- |
| POST   | `/auth/register` | Yes    | 10/min     | `201`   |
| POST   | `/auth/login`    | Yes    | 10/min     | `200`   |
| POST   | `/auth/refresh`  | Yes    | 20/min     | `200`   |
| POST   | `/auth/logout`   | Yes    | 20/min     | `204`   |

#### Register

```http
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "secret123"
}
```

Response `201`:

```json
{
  "id": "6f6c1f0e-7a2b-4c3d-8e9f-0a1b2c3d4e5f",
  "email": "user@example.com",
  "roles": ["USER"]
}
```

#### Login

```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "secret123"
}
```

Response `200`:

```json
{
  "accessToken": "<jwt>",
  "refreshToken": "<opaque-token>",
  "tokenType": "Bearer",
  "expiresIn": 900
}
```

Invalid credentials return `401` with a generic message (unknown email and wrong password are indistinguishable).

#### Refresh

```http
POST /auth/refresh
Content-Type: application/json

{
  "refreshToken": "<opaque-token>"
}
```

Response `200` is a new token pair. The presented refresh token is revoked in the same step. Using a revoked token again returns `401` and revokes its entire family.

#### Logout

```http
POST /auth/logout
Content-Type: application/json

{
  "refreshToken": "<opaque-token>"
}
```

Response `204`. Logout is idempotent: unknown or already-revoked tokens still return `204`.

### Current user

| Method | Path         | Auth        | Success |
| ------ | ------------ | ----------- | ------- |
| GET    | `/users/me`  | Any role    | `200`   |

```http
GET /users/me
Authorization: Bearer <accessToken>
```

```json
{
  "id": "6f6c1f0e-7a2b-4c3d-8e9f-0a1b2c3d4e5f",
  "email": "user@example.com",
  "roles": ["USER"]
}
```

### Admin

All admin routes require an `ADMIN` access token.

| Method | Path                     | Success |
| ------ | ------------------------ | ------- |
| GET    | `/admin/users`           | `200`   |
| DELETE | `/admin/users/:id`       | `204`   |
| PATCH  | `/admin/users/:id/roles` | `200`   |

```http
GET /admin/users
Authorization: Bearer <adminAccessToken>
```

Returns an array of users in the same public shape as `/users/me`.

```http
PATCH /admin/users/:id/roles
Authorization: Bearer <adminAccessToken>
Content-Type: application/json

{
  "roles": ["USER", "ADMIN"]
}
```

Response `200` is the updated user. The body must be a non-empty array of unique values from `USER` / `ADMIN`.

```http
DELETE /admin/users/:id
Authorization: Bearer <adminAccessToken>
```

Response `204`. Deleting an unknown user is also `204` (idempotent). An admin cannot delete their own account (`403`), and the last remaining admin cannot be deleted or demoted (`409`).

### Error responses

Domain errors are mapped by global filters:

| Status | Cause                                                                 |
| ------ | --------------------------------------------------------------------- |
| `400`  | DTO validation failed, malformed UUID, or missing refresh token.      |
| `401`  | Missing/invalid/expired access token, bad credentials, invalid refresh token. |
| `403`  | Authenticated but not allowed (role check or self-deletion).          |
| `404`  | Admin role update for an unknown user.                                |
| `409`  | Duplicate email, or an operation that would remove the last admin.    |
| `429`  | Rate limit exceeded.                                                  |

Domain errors use a minimal shape:

```json
{
  "statusCode": 409,
  "message": "Email already registered"
}
```

Validation errors use the Nest default shape with a `message` array.

Global rate limit is **100 requests/minute** per client.

## Tokens and sessions

- **Access token** — JWT with `{ sub, email, roles, type: "access" }`, signed with `JWT_ACCESS_SECRET`, valid for `JWT_ACCESS_TTL_SECONDS`. Its `type` must be `access`; refresh tokens are not JWTs and cannot be used as access tokens.
- **Refresh token** — 32 random bytes encoded as base64url. Only its SHA-256 hash is stored.
- **Rotation** — every refresh issues a new refresh token in the same family and revokes the old one atomically.
- **Reuse detection** — presenting an already-revoked token revokes the whole family and returns `401`.
- **Deletion** — a deleted user is rejected by the guard on the next request; their refresh attempt is rejected as well.
- **Role changes** — authorization uses freshly loaded user roles, not the claims embedded in the access token.

`/users/me` and every admin route are protected by the global guard; only the auth entry points and the root endpoint opt out with `@Public()`.

## Roles

| Role    | Access                                                        |
| ------- | ------------------------------------------------------------- |
| `USER`  | `/users/me`                                                    |
| `ADMIN` | `/users/me` and all `/admin/*` routes                          |

New registrations always receive `USER`. Roles are managed only through the admin endpoint.

## Project structure

```text
src/
  main.ts                       # bootstrap, global ValidationPipe, PORT
  app.module.ts                 # config, JWT, throttling, guards, filters
  config/
    env.validation.ts           # Joi env schema
  auth/
    auth.controller.ts
    auth.service.ts             # register, login, refresh, logout
    refresh-token.repository.ts # hashed, rotating refresh tokens
    decorators/                 # @Public, @Roles, @CurrentUser
    guards/                     # JwtAuthGuard, RolesGuard
    dto/                        # request/response shapes
    errors/                     # domain errors
  users/
    users.controller.ts         # GET /users/me
    users.service.ts
    users.repository.ts         # the only storage access for users
    bootstrap-admin.service.ts
    dto/                        # CreateUserDto, UserResponseDto, RoleName
    errors/
  admin/
    admin.controller.ts
    admin.service.ts
    dto/
    errors/
  filters/                      # domain error -> HTTP mapping
test/
  app.e2e-spec.ts               # end-to-end flows
  setup-env.ts                  # test environment variables
```

## Testing

```bash
npm test            # unit tests (src/**/*.spec.ts)
npm run test:e2e    # end-to-end tests (test/app.e2e-spec.ts)
npm run test:cov    # unit tests with coverage
```

The unit suite covers services, repositories, guards, and bootstrap logic. The e2e suite exercises the full HTTP flow: registration, login, token rotation and reuse, logout, protected routes, RBAC, admin operations, and the last-admin/self-deletion rules.

Before considering work done, run:

```bash
npm run lint
npm run build
npm test
npm run test:e2e
```

One ESLint warning for the floating bootstrap promise in `src/main.ts` is expected.

## Security notes

- `passwordHash` is never exposed. Responses go through `toUserResponse` (`plainToInstance` + `excludeExtraneousValues`), an allow-list boundary.
- Plaintext passwords exist only at the HTTP boundary; they are hashed with Argon2 before persistence.
- Refresh tokens are never stored in plaintext.
- Authorization re-resolves the user on every request; access-token claims are not trusted for roles.
- Email uniqueness is enforced where the write happens, so concurrent registrations cannot both succeed.
- Rate limits are configured globally and per sensitive route.

## Known limitations

- Both repositories are in-memory: users and sessions are lost on restart.
- Access tokens remain valid until they expire (`JWT_ACCESS_TTL_SECONDS`) even after logout; only refresh tokens are revoked immediately.
- Refresh-token families use a sliding lifetime; there is no absolute maximum family age.
- Expired and revoked refresh-token records are not purged yet.
- Refresh tokens are returned in the JSON body; clients must store them securely (for example, in memory or an `httpOnly` cookie managed by the caller).
- Rate limiting uses the default in-memory store and is per process.

## License

UNLICENSED.
