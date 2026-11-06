# Deferred Admin Work (requires JWT authentication)

The admin module core is implemented (validation, 404/409 handling, idempotent delete, last-admin protection). The tasks below were intentionally postponed until the `Access JWT + refresh` flow exists. They are specifications, not tests.

## 8. Protect admin routes with RBAC

- Register global `JwtAuthGuard` and `RolesGuard` via `APP_GUARD` once access tokens are issued.
- Add `@Roles(RoleName.ADMIN)` at the class level of `AdminController`.
- Mark public auth routes with `@Public()` so the global guard stays secure-by-default.
- Use the authenticated user's roles, not stale JWT claims alone (the guard should resolve the user from `UsersService`).

**Acceptance criteria**

- Anonymous request to `/admin/*` → `401`.
- Authenticated `USER` request to `/admin/*` → `403`.
- Authenticated `ADMIN` request to `/admin/*` → expected `2xx`.

## 9. Prevent an admin from deleting themselves

- Change `AdminService.deleteUser` to accept the acting user id: `deleteUser(actorId, targetId)`.
- Throw `CannotDeleteSelfError` (map to `403 Forbidden` with a global `APP_FILTER`) when `actorId === targetId`.
- The controller supplies `actorId` from `request.user`, which is populated by `JwtAuthGuard`.

**Acceptance criteria**

- Admin deleting their own id → `403`, user remains.
- Admin deleting another user/admin → `204`.
- The existing last-admin rule still returns `409`.

## 10. Invalidate refresh tokens for deleted users

- `POST /auth/refresh` must verify that the user referenced by the refresh-token record still exists (via `UsersService.getById` / repository lookup) before issuing new tokens.
- Optionally revoke the user's refresh-token family when the user is deleted.
- Do not trust the access-token `sub` alone for session continuation after deletion.

**Acceptance criteria**

- After `DELETE /admin/users/:id`, that user's refresh token → `401`.
- No new access token is issued for a deleted user.
- A still-valid access token for a deleted user is rejected by the guard (guard re-resolves the user on every request).

## Notes

- Admin core (items 1–7) is complete: `UpdateUserRolesDto`, `ParseUUIDPipe`, idempotent `DELETE` (`204`), `PATCH` returns `UserResponseDto`, `UserNotFoundError` → `404`, `LastAdminError` → `409`.
- Keep the existing pattern when adding new domain errors: error class in the domain folder plus a global `APP_FILTER` mapping it to HTTP.
