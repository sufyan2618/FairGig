# FairGig API Documentation

Last Updated: 2026-04-18
Owner: Backend Team
Audience: Frontend Developers and Integrators

This document is the central API contract for FairGig. Start with Auth Service, then extend the same file with other services.

## Service Index

1. Auth Service (Implemented)
2. Earnings Service (Pending)
3. Anomaly Service (Pending)
4. Grievance Service (Pending)
5. Analytics Service (Pending)
6. Certificate Service (Pending)

## 1) Auth Service

Service path prefix: /api/auth

Direct local base URL:
http://localhost:8000

Gateway base URL:
http://localhost:8080

### 1.1 Roles

Supported role values:
- worker
- verifier
- advocate

### 1.2 Token Model

- Access token: JWT, short-lived, used for authorized APIs.
- Refresh token: JWT, long-lived, used only for token renewal.
- Default access token expiry: 30 minutes.
- Default refresh token expiry: 14 days.

Frontend rule:
- Send access token in Authorization header as Bearer token.
- Do not send refresh token to business endpoints.
- Use refresh endpoint when access token expires.

### 1.3 Common Error Format

All API errors return JSON in this shape:
{
  "detail": "error message"
}

### 1.4 Rate Limits

Current limits (from auth service configuration):
- Global API limit: 120 requests per 60 seconds (per IP plus path).
- Login limit: 10 attempts per 5 minutes (per IP and per email).
- OTP email send limit: 5 sends per 1 hour (per email and purpose).
- OTP verification invalid attempts: max 5 attempts per OTP record.

429 responses include Retry-After header where applicable.

### 1.5 Endpoint Summary

| Method | Endpoint | Auth Required | Purpose |
|---|---|---|---|
| POST | /api/auth/register | No | Register user and send email verification OTP |
| POST | /api/auth/verify-email-otp | No | Verify registration OTP |
| POST | /api/auth/resend-email-otp | No | Resend email verification OTP |
| POST | /api/auth/login | No | Authenticate user and issue tokens |
| POST | /api/auth/refresh | No | Rotate refresh token and issue new token pair |
| POST | /api/auth/logout | No | Revoke a refresh token |
| POST | /api/auth/forgot-password | No | Send password reset OTP |
| POST | /api/auth/reset-password | No | Reset password using OTP |
| GET | /api/auth/me | Yes | Return current authenticated user profile |
| GET | /api/auth/introspect | Yes | Validate token and return gateway user context |
| GET | /api/health | No | Health check |

### 1.6 Detailed API Contracts

#### 1) Register

Method: POST
Endpoint: /api/auth/register
Auth: Not required

Request body:
{
  "full_name": "Sufyan Liaqat",
  "email": "sufyan@example.com",
  "password": "StrongPass123",
  "role": "worker"
}

Validation:
- full_name: min 2, max 120
- email: valid email
- password: min 8, max 128
- role: worker, verifier, advocate

Success response (201):
{
  "message": "Registration successful. Please verify your email with the OTP sent.",
  "user": {
    "id": "uuid",
    "email": "sufyan@example.com",
    "full_name": "Sufyan Liaqat",
    "role": "worker",
    "is_email_verified": false,
    "is_active": true,
    "created_at": "2026-04-18T12:00:00Z",
    "last_login_at": null
  }
}

Possible errors:
- 409: An account with this email already exists.
- 429: Rate limit exceeded.
- 500: Brevo API key is not configured.
- 502: Unable to send OTP email via Brevo.

#### 2) Verify Email OTP

Method: POST
Endpoint: /api/auth/verify-email-otp
Auth: Not required

Request body:
{
  "email": "sufyan@example.com",
  "otp_code": "123456"
}

Success response (200):
{
  "message": "Email verified successfully."
}

Possible errors:
- 400: Invalid request, OTP invalid, or OTP expired.
- 429: Too many invalid OTP attempts.

#### 3) Resend Email OTP

Method: POST
Endpoint: /api/auth/resend-email-otp
Auth: Not required

Request body:
{
  "email": "sufyan@example.com"
}

Success response (200):
{
  "message": "OTP sent successfully."
}

Possible errors:
- 400: Invalid request or Email is already verified.
- 429: OTP send rate limit exceeded.
- 502: Unable to send OTP email via Brevo.

#### 4) Login

Method: POST
Endpoint: /api/auth/login
Auth: Not required

Request body:
{
  "email": "sufyan@example.com",
  "password": "StrongPass123"
}

Success response (200):
{
  "tokens": {
    "access_token": "jwt-access-token",
    "refresh_token": "jwt-refresh-token",
    "token_type": "bearer",
    "expires_in": 1800
  },
  "user": {
    "id": "uuid",
    "email": "sufyan@example.com",
    "full_name": "Sufyan Liaqat",
    "role": "worker",
    "is_email_verified": true,
    "is_active": true,
    "created_at": "2026-04-18T12:00:00Z",
    "last_login_at": "2026-04-18T12:45:00Z"
  }
}

Possible errors:
- 401: Invalid email or password.
- 403: Account disabled or Email not verified.
- 429: Login rate limit exceeded.

#### 5) Refresh Tokens

Method: POST
Endpoint: /api/auth/refresh
Auth: Not required

Request body:
{
  "refresh_token": "jwt-refresh-token"
}

Success response (200):
{
  "tokens": {
    "access_token": "new-jwt-access-token",
    "refresh_token": "new-jwt-refresh-token",
    "token_type": "bearer",
    "expires_in": 1800
  },
  "user": {
    "id": "uuid",
    "email": "sufyan@example.com",
    "full_name": "Sufyan Liaqat",
    "role": "worker",
    "is_email_verified": true,
    "is_active": true,
    "created_at": "2026-04-18T12:00:00Z",
    "last_login_at": "2026-04-18T12:45:00Z"
  }
}

Possible errors:
- 401: Invalid, expired, revoked, or mismatched refresh token.

#### 6) Logout

Method: POST
Endpoint: /api/auth/logout
Auth: Not required

Request body:
{
  "refresh_token": "jwt-refresh-token"
}

Success response (200):
{
  "message": "Logged out successfully."
}

Possible errors:
- 401: Invalid refresh token.

#### 7) Forgot Password

Method: POST
Endpoint: /api/auth/forgot-password
Auth: Not required

Request body:
{
  "email": "sufyan@example.com"
}

Success response (200):
{
  "message": "If the account exists, a reset OTP has been sent."
}

Notes:
- This endpoint is intentionally non-enumerating.
- It returns success message even when user does not exist or is not eligible.

Possible errors:
- 429: OTP send rate limit exceeded.
- 502: Unable to send OTP email via Brevo.

#### 8) Reset Password

Method: POST
Endpoint: /api/auth/reset-password
Auth: Not required

Request body:
{
  "email": "sufyan@example.com",
  "otp_code": "123456",
  "new_password": "NewStrongPass123"
}

Success response (200):
{
  "message": "Password reset successfully."
}

Possible errors:
- 400: Invalid request, invalid OTP, or expired OTP.
- 403: Account disabled.
- 429: Too many invalid OTP attempts.

#### 9) Get Current User

Method: GET
Endpoint: /api/auth/me
Auth: Required

Required header:
Authorization: Bearer access-token

Success response (200):
{
  "id": "uuid",
  "email": "sufyan@example.com",
  "full_name": "Sufyan Liaqat",
  "role": "worker",
  "is_email_verified": true,
  "is_active": true,
  "created_at": "2026-04-18T12:00:00Z",
  "last_login_at": "2026-04-18T12:45:00Z"
}

Possible errors:
- 401: Missing, invalid, or expired access token.

#### 10) Introspect Token (Gateway Contract)

Method: GET
Endpoint: /api/auth/introspect
Auth: Required

Required header:
Authorization: Bearer access-token

Success response (200):
{
  "user_id": "uuid",
  "full_name": "Sufyan Liaqat",
  "email": "sufyan@example.com",
  "role": "worker"
}

Response headers for API Gateway forwarding:
- X-User-Id
- X-User-Name
- X-User-Email
- X-User-Role

Possible errors:
- 401: Missing, invalid, or expired access token.

#### 11) Health Check

Method: GET
Endpoint: /api/health
Auth: Not required

Success response (200):
{
  "status": "healthy",
  "service": "auth-service"
}

### 1.7 Frontend Integration Flow (Recommended)

1. Register user with full_name, email, password, role.
2. Show OTP entry screen and call verify-email-otp.
3. Call login and store tokens.
4. For authorized pages, call me using access token.
5. On 401 due to expired access token, call refresh once and retry original request.
6. If refresh fails, clear session and redirect to login.
7. Call logout on explicit sign out and clear local session.

### 1.8 Gateway Context for Downstream Services

When API Gateway validates token through introspect, downstream protected services should receive:
- X-User-Id
- X-User-Name
- X-User-Email
- X-User-Role

This allows each microservice to implement role and ownership checks without decoding JWT directly.

## 2) Earnings Service (Pending)

Add endpoint contracts here after implementation.

## 3) Anomaly Service (Pending)

Add endpoint contracts here after implementation.

## 4) Grievance Service (Pending)

Add endpoint contracts here after implementation.

## 5) Analytics Service (Pending)

Add endpoint contracts here after implementation.

## 6) Certificate Service (Pending)

Add endpoint contracts here after implementation.
