# auth-service

register
   ↓
login
   ↓
access + refresh tokens
   ↓
GET /users/me
   ↓
JWT authentication
   ↓
GET /admin/users
   ↓
RBAC
   ↓
user → 403
admin → 200
   ↓
logout
   ↓
refresh token revoked
