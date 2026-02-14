@User
A user represents an authenticated individual in the system.
Users have a unique ID (UUID), email (must be unique and valid), username (3-30 characters, alphanumeric and underscores), password hash (bcrypt), and account status.
Account status can be: active, suspended, or pending_verification.
Users have a created_at timestamp and last_login timestamp.
Email verification is required before users can access protected resources.

@Role
Roles define sets of permissions that can be assigned to users.
Each role has a unique name (e.g., "admin", "moderator", "user"), description, and a list of permissions.
Built-in roles: admin (full access), moderator (content management), user (basic access).
Roles can be created, updated, and deleted by administrators.
Users can have multiple roles.

@Permission
Permissions are granular access controls.
Each permission has a unique name (e.g., "posts:create", "users:delete") and description.
Permissions follow the pattern: "resource:action" (e.g., "posts:read", "comments:edit").
Permissions are assigned to roles, not directly to users.

@Session
Sessions track authenticated user activity.
Each session has a unique ID, user reference, access token (JWT), refresh token (secure random), creation timestamp, expiration timestamp, and device info (user agent, IP address).
Access tokens expire after 15 minutes.
Refresh tokens expire after 30 days or when explicitly revoked.
Multiple concurrent sessions per user are allowed (web, mobile, etc.).
Track last activity timestamp for each session.

@PasswordReset
Password reset requests enable users to recover their accounts.
Each request has a unique token (secure random), user reference, creation timestamp, expiration (valid for 1 hour), and used status.
Tokens can only be used once.
Old tokens are automatically invalidated when a new one is generated.

@EmailVerification
Email verification tokens confirm user email addresses.
Each token has a unique code, user reference, creation timestamp, expiration (valid for 24 hours), and verified status.
Tokens expire after use or after 24 hours.
Users cannot access protected resources until verified.

@AuditLog
Track all authentication and authorization events for security.
Each log entry records: timestamp, user ID, action type (login, logout, permission_check, role_change, etc.), IP address, user agent, success/failure status, and optional metadata.
Audit logs are immutable and retained for 90 days.

@RateLimiter
Implement rate limiting to prevent abuse.
Login attempts: max 5 failed attempts per email per 15 minutes.
Password reset requests: max 3 requests per email per hour.
Email verification resends: max 5 requests per user per hour.
API calls: 100 requests per minute for unauthenticated, 1000 for authenticated users.

@API
Expose a REST API with the following endpoints:

POST /auth/register — register new user (email, username, password)
POST /auth/login — authenticate and receive tokens (email/username, password)
POST /auth/logout — invalidate current session (requires authentication)
POST /auth/logout-all — invalidate all user sessions (requires authentication)
POST /auth/refresh — exchange refresh token for new access token
POST /auth/verify-email — verify email with token code
POST /auth/resend-verification — send new verification email (requires authentication)

POST /auth/forgot-password — request password reset (email)
POST /auth/reset-password — reset password with token
POST /auth/change-password — change password (requires authentication, current password)

GET /auth/me — get current user info and permissions (requires authentication)
GET /auth/sessions — list all active sessions for current user (requires authentication)
DELETE /auth/sessions/:id — revoke specific session (requires authentication)

GET /users — list all users with pagination (requires permission: users:read)
GET /users/:id — get user details (requires permission: users:read)
PUT /users/:id — update user (requires permission: users:update or self)
DELETE /users/:id — delete user (requires permission: users:delete)
PATCH /users/:id/suspend — suspend user account (requires permission: users:manage)
PATCH /users/:id/activate — activate suspended account (requires permission: users:manage)

GET /users/:id/roles — get user's roles (requires permission: roles:read)
POST /users/:id/roles — assign role to user (requires permission: roles:assign)
DELETE /users/:id/roles/:roleId — remove role from user (requires permission: roles:assign)

GET /roles — list all roles (requires permission: roles:read)
GET /roles/:id — get role details including permissions (requires permission: roles:read)
POST /roles — create new role (requires permission: roles:create)
PUT /roles/:id — update role (requires permission: roles:update)
DELETE /roles/:id — delete role (requires permission: roles:delete)

GET /roles/:id/permissions — list role permissions (requires permission: roles:read)
POST /roles/:id/permissions — add permission to role (requires permission: roles:update)
DELETE /roles/:id/permissions/:permissionId — remove permission from role (requires permission: roles:update)

GET /permissions — list all available permissions (requires permission: permissions:read)

GET /audit-logs — list audit logs with filters (timestamp range, user, action type) (requires permission: audit:read)

All endpoints return JSON.
Use appropriate HTTP status codes (200, 201, 400, 401, 403, 404, 429, 500).
Include detailed error messages for validation failures.

@Authentication
Use JWT (JSON Web Tokens) for access tokens.
Include user ID, roles, and permissions in JWT payload.
Sign tokens with RS256 (asymmetric encryption).
Implement token refresh flow with secure refresh tokens stored in database.
Support API key authentication for service-to-service communication.

@Authorization
Check permissions on every protected endpoint.
Implement hierarchical permission checking (admin role has all permissions).
Users can access their own resources (own profile, sessions) without explicit permissions.
Cache user permissions for 5 minutes to reduce database queries.
Deny by default - explicit permissions required for all operations.

@Validation
Validate all input rigorously:
- Email: valid format, max 255 characters
- Password: min 8 characters, must contain uppercase, lowercase, number, and special character
- Username: 3-30 characters, alphanumeric and underscores only
- Role names: lowercase, alphanumeric with hyphens, 2-50 characters
- Permission names: "resource:action" format, lowercase

Return clear, actionable validation error messages.
Sanitize all inputs to prevent injection attacks.

@Security
Hash passwords with bcrypt (cost factor 12).
Store refresh tokens hashed in database.
Use HTTPS only in production.
Implement CSRF protection for web clients.
Set secure, httpOnly cookies for refresh tokens in browser contexts.
Expire sessions after 30 days of inactivity.
Lock accounts after 10 failed login attempts within 1 hour.
Send email notifications for security events (password change, new login from new device).

@Storage
Use PostgreSQL with proper indexing:
- Index on user email and username for fast lookups
- Index on session tokens and expiration for cleanup
- Index on audit log timestamp and user ID for queries
Use database transactions for role/permission assignments.
Implement automatic cleanup of expired sessions and tokens (daily cron job).
