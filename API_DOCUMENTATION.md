# FairGig API Documentation

Last Updated: 2026-04-18
Owner: Backend Team
Audience: Frontend Developers and Integrators

This document is the central API contract for FairGig. Start with Auth Service, then extend the same file with other services.

## Service Index

1. Auth Service (Implemented)
2. Earnings Service (Implemented)
3. Anomaly Service (Implemented)
4. Grievance Service (Implemented)
5. Analytics Service (Implemented)
6. Certificate Service (Implemented)

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

## 2) Earnings Service

Service path prefix: /api/earnings

Direct local base URL:
http://localhost:3001

Gateway base URL:
http://localhost:8080

### 2.1 Access Model

- `worker`: create/read/update/delete own shift logs, upload CSV/screenshots.
- `verifier`: access pending verification queue and submit decisions.
- `advocate`: no direct earnings API access.
- Internal services (analytics, certificate, anomaly): use `X-Service-Api-Key`.

### 2.2 Authentication Headers

JWT endpoints:
- `Authorization: Bearer <access_token>`

Internal endpoints:
- `X-Service-Api-Key: <internal_service_api_key>`

### 2.3 Status Lifecycle

`pending` -> `pending_review` -> (`verified` | `flagged` | `unverifiable`)

Rules:
- Workers can edit/delete only in `pending`.
- After `pending_review`, worker record is locked for update/delete.
- Verification decisions are one-way and terminal.

### 2.4 Error Shape

All business errors return:
{
  "error": "ERROR_CODE",
  "message": "Human-readable explanation",
  "status": 4xx_or_5xx
}

### 2.5 Worker Endpoints

#### POST /api/earnings/shifts

Role: worker

Body:
{
  "platform": "Uber",
  "date": "2026-04-18",
  "hours_worked": 8,
  "gross_earned": 4500,
  "deductions": 900,
  "net_received": 3600,
  "worker_category": "ride_hailing",
  "city_zone": "Lahore-Central"
}

Response: created shift (`verification_status` defaults to `pending`).

#### GET /api/earnings/shifts

Role: worker

Query params:
- `platform`
- `date_from`
- `date_to`
- `verification_status`
- `page` (default 1)
- `limit` (default 20)

Response: paginated list of worker's own shifts.

Internal variant:
- Same endpoint supports `X-Service-Api-Key` with required `worker_id` query param.

#### GET /api/earnings/shifts/:id

Role: worker

Response: full shift detail including screenshot URL and verification note/status.

#### PUT /api/earnings/shifts/:id

Role: worker

Body: same as create.

Rule: only allowed when status is `pending`.

#### DELETE /api/earnings/shifts/:id

Role: worker

Rule:
- only when status is `pending`
- only when screenshot is not attached

Behavior: soft delete (`deleted_at` set).

### 2.6 CSV Endpoints

#### POST /api/earnings/shifts/import

Role: worker

Form-data:
- `file`: `.csv`

Required columns:
- `platform,date,hours_worked,gross_earned,deductions,net_received`

Optional columns:
- `worker_category,city_zone`

Behavior:
- full-file validation first
- all-or-nothing transaction insert

Response:
{
  "summary": {
    "total_rows": 10,
    "imported": 10,
    "failed": 0,
    "failures": []
  }
}

#### GET /api/earnings/shifts/import/template

Role: worker

Response: CSV download template with required headers.

### 2.7 Screenshot Endpoints

#### POST /api/earnings/shifts/:id/screenshot

Role: worker

Form-data:
- `screenshot`: JPG/PNG

Behavior:
- stores file with hashed filename
- updates shift `verification_status` to `pending_review`
- replaces previous screenshot before final verification

#### GET /api/earnings/shifts/:id/screenshot

Role: worker or verifier

Access rules:
- worker: only own shift
- verifier: only `pending_review` shifts

### 2.8 Verification Endpoints

#### GET /api/earnings/verifications/queue

Role: verifier

Returns paginated pending review submissions across workers.

#### GET /api/earnings/verifications/:id

Role: verifier

Returns detailed review payload for one pending shift.

#### POST /api/earnings/verifications/:id/decision

Role: verifier

Body:
{
  "status": "verified",
  "note": "optional note"
}

Allowed `status` values:
- `verified`
- `flagged`
- `unverifiable`

Rule:
- `note` required when status is `flagged`

#### GET /api/earnings/verifications/history

Role: verifier

Query params:
- `status`
- `date_from`
- `date_to`
- `page`
- `limit`

Returns verifier's own decision history.

### 2.9 Internal Endpoints

#### GET /api/earnings/shifts/summary/:workerId

Auth: `X-Service-Api-Key`

Query params:
- `date_from`
- `date_to`

Returns verified-only aggregates:
- `total_gross`
- `total_deductions`
- `total_net`
- `per_platform_breakdown`
- `verified_shifts`

#### GET /api/earnings/shifts/aggregate/median

Auth: `X-Service-Api-Key`

Query params:
- `worker_category` (required)
- `city_zone` (required)
- `date_from` (optional)
- `date_to` (optional)

Behavior:
- computes median over real verified data grouped by worker
- enforces privacy threshold: if cohort < 5, returns `median_net: null`

### 2.10 Notes

- Monetary values are integer PKR values.
- Timestamps are UTC ISO 8601.
- Screenshots are available under `/uploads/screenshots/*`.

## 3) Anomaly Service

Service path prefix: /api/anomaly

Direct local base URL:
http://localhost:8002

Gateway base URL:
http://localhost:8080

### 3.1 Overview

- Stateless FastAPI service with no database.
- Runs in-memory detection using Pandas, NumPy, and SciPy.
- Judge-facing endpoint: `POST /api/anomaly/detect`.

### 3.2 Authentication

Supported auth methods for detect endpoint:
- `Authorization: Bearer <access_token>`
- `X-Service-Api-Key: <internal_service_api_key>`
- Optional open demo mode if service config `ALLOW_OPEN_DETECT=true`

### 3.3 Endpoints

#### GET /api/anomaly/health

Auth: none

Response:
{
  "status": "ok",
  "service": "anomaly-detection",
  "version": "1.0.0"
}

#### POST /api/anomaly/detect

Auth: Bearer token or internal service key (or open mode in demo config)

Request body:
{
  "worker_id": "string or null",
  "shifts": [
    {
      "shift_id": "string",
      "date": "YYYY-MM-DD",
      "platform": "string",
      "hours_worked": 8,
      "gross_earned": 5000,
      "platform_deductions": 900,
      "net_received": 4100
    }
  ]
}

Validation rules:
- `gross_earned > 0`
- `platform_deductions >= 0`
- `hours_worked > 0` and `< 24`
- `date` must be valid ISO date
- `net_received` must match `gross_earned - platform_deductions` with tolerance of +/-5 PKR

Insufficient-data behavior:
- If fewer than 5 shifts are submitted, API returns `200 OK` with zero anomalies and a summary asking for at least 5 shifts.

Response shape:
{
  "worker_id": "string or null",
  "total_shifts_analyzed": 5,
  "anomalies_found": 1,
  "anomalies": [
    {
      "shift_id": "s5",
      "date": "2026-02-20",
      "platform": "Careem",
      "anomaly_type": "unusual_deduction_rate",
      "severity": "high",
      "metric_value": 42.31,
      "expected_value": 18.15,
      "explanation": "Careem deducted 42.3% of your gross on 2026-02-20. Your usual deduction rate is around 18.1%. This is 2.90 standard deviations from your average."
    }
  ],
  "summary": "Detected 1 anomaly flag(s) across deduction rates, income trends, and hourly earnings."
}

#### GET /api/anomaly/schema

Auth: none

Returns JSON schema for the `POST /detect` request payload model.

### 3.4 Detection Logic

Pass 1: per-platform deduction-rate Z-score
- Deduction rate: `platform_deductions / gross_earned * 100`
- Platform-specific baseline
- Flag threshold: absolute Z-score >= 2.0

Pass 2: month-on-month net income drop
- Monthly net aggregation over submitted shifts
- Flags drops greater than 20% versus previous month

Pass 3: hourly-rate outlier detection (IQR)
- Hourly rate: `net_received / hours_worked`
- Flags low outliers as possible risk, high outliers as informational low severity

## 4) Grievance Service

Service path prefix: /api/grievances

Direct local base URL:
http://localhost:3002

Gateway base URL:
http://localhost:8080

### 4.1 Roles and Access

- worker: create, read, and delete own eligible complaints
- verifier: read-only complaints
- advocate: read, moderate, cluster, and analytics access

### 4.2 Auth

All endpoints except health require:
- `Authorization: Bearer <access_token>`

Token must include role and user identity (`sub` or equivalent).

### 4.3 Health

#### GET /api/grievances/health

Auth: none

Response:
{
  "status": "ok",
  "service": "grievance-service",
  "db": "connected"
}

### 4.4 Complaint APIs

#### POST /api/grievances/

Role: worker

Body:
{
  "platform": "Bykea",
  "category": "commission_hike",
  "description": "Bykea suddenly increased commission this week without prior notice."
}

Rules:
- tags/cluster/status are server-controlled defaults
- post rate limit: 5 complaints per hour per worker

#### GET /api/grievances/

Roles: worker, verifier, advocate

Query:
- `platform`
- `category`
- `escalation_status`
- `cluster_id`
- `tag`
- `page`
- `limit`

Default sorting: newest first.

#### GET /api/grievances/:id

Roles: worker, verifier, advocate

Returns one complaint detail.

#### DELETE /api/grievances/:id

Role: worker

Allowed only if:
- complaint belongs to requester
- `escalation_status` is `open`
- complaint is not assigned to a cluster

### 4.5 Moderation APIs

#### PUT /api/grievances/:id/tags

Role: advocate

Body:
{
  "tags": ["commission_hike", "Bykea", "no_notice"]
}

#### PUT /api/grievances/:id/status

Role: advocate

Body:
{
  "escalation_status": "escalated",
  "moderation_note": "Grouped with similar complaints and escalated for follow-up."
}

Valid transitions:
- `open -> escalated`
- `open -> resolved`
- `escalated -> resolved`
- `resolved -> open`

#### PUT /api/grievances/:id/cluster

Role: advocate

Body:
{
  "cluster_id": "cluster_bykea_commission_jan2026",
  "cluster_label": "Bykea Commission Hike - January 2026"
}

### 4.6 Cluster APIs

#### GET /api/grievances/clusters

Roles: worker, advocate

Returns cluster summaries including complaint count, platforms, top category, and escalation breakdown.

#### GET /api/grievances/clusters/:cluster_id

Roles: worker, advocate

Returns paginated complaints for a single cluster.

#### POST /api/grievances/suggest-clusters

Role: advocate

Body:
{
  "complaint_ids": ["id1", "id2", "id3"]
}

Returns suggested textual groupings using TF-IDF similarity (advisory only; no auto-assign).

### 4.7 Analytics APIs

#### GET /api/grievances/analytics/top-categories

Role: advocate

Returns top complaint categories for current week.

#### GET /api/grievances/analytics/by-platform

Role: advocate

Query:
- `date_from` (optional)
- `date_to` (optional)

Returns complaint volume grouped by platform over time.

#### GET /api/grievances/analytics/escalation-ratio

Role: advocate

Returns open/escalated/resolved totals.

### 4.8 Anonymity Contract

- Worker identity is stored internally for ownership checks.
- Public responses never expose `worker_id`.
- All returned complaints include `posted_by: "Anonymous Worker"`.

## 5) Analytics Service

Base URL: `http://localhost:8003`

Auth:
- All analytics endpoints require `Authorization: Bearer <access_token>`.
- Worker token role: `worker`
- Advocate token role: `advocate`

### 5.1 GET /api/analytics/health

Role: public (no JWT required)

Response:
```json
{
  "status": "ok",
  "service": "analytics-service",
  "db": "connected"
}
```

### 5.2 GET /api/analytics/platforms

Role: worker, advocate

Response:
```json
{
  "platforms": ["uber", "careem", "foodpanda"]
}
```

### 5.3 GET /api/analytics/worker/median

Role: worker

Query:
- `category` (required)
- `city_zone` (required)
- `month` (optional, `YYYY-MM`)

Response:
```json
{
  "category": "ride_hailing",
  "city_zone": "lahore-east",
  "month": "2026-04",
  "median_net_earned_pkr": 43250.0,
  "cohort_size": 19,
  "suppressed": false,
  "message": null
}
```

Suppressed example:
```json
{
  "category": "ride_hailing",
  "city_zone": "small-zone",
  "month": "2026-04",
  "median_net_earned_pkr": null,
  "cohort_size": 3,
  "suppressed": true,
  "message": "Not enough data in this zone to compute a median without risking individual identification."
}
```

### 5.4 GET /api/analytics/advocate/commission-trends

Role: advocate

Query:
- `period` (optional: `weekly` or `monthly`, default `monthly`)
- `platform` (optional)
- `date_from` (optional, `YYYY-MM-DD`)
- `date_to` (optional, `YYYY-MM-DD`)

Response:
```json
{
  "period": "monthly",
  "data": [
    {
      "platform": "uber",
      "periods": [
        {
          "label": "2026-03",
          "avg_commission_rate": 20.36,
          "sample_count": 154
        }
      ]
    }
  ]
}
```

### 5.5 GET /api/analytics/advocate/income-distribution

Role: advocate

Query:
- `month` (optional, `YYYY-MM`)
- `category` (optional)

Response:
```json
{
  "month": "2026-04",
  "zones": [
    {
      "city_zone": "lahore-east",
      "cohort_size": 25,
      "suppressed": false,
      "median_net_pkr": 40125.0,
      "p25_net_pkr": 31250.0,
      "p75_net_pkr": 49700.0,
      "message": null
    }
  ]
}
```

### 5.6 GET /api/analytics/advocate/vulnerability-flags

Role: advocate

Query:
- `month` (optional, `YYYY-MM`)
- `min_drop_percent` (optional, default `20`)
- `category` (optional)
- `city_zone` (optional)
- `page` (optional, default `1`)
- `limit` (optional, default `20`, max `100`)

Response:
```json
{
  "month": "2026-04",
  "threshold_percent": 20,
  "total_flagged": 42,
  "workers": [
    {
      "worker_ref": "WRK-8D0A3D1D0C",
      "category": "ride_hailing",
      "city_zone": "karachi-south",
      "platform": "uber",
      "prev_month_net_pkr": 50320.0,
      "current_month_net_pkr": 26780.0,
      "drop_percent": 46.78,
      "severity": "high"
    }
  ]
}
```

### 5.7 GET /api/analytics/advocate/platform-summary

Role: advocate

Query:
- `date_from` (optional, `YYYY-MM-DD`)
- `date_to` (optional, `YYYY-MM-DD`)

Response:
```json
{
  "platforms": [
    {
      "platform": "careem",
      "total_workers": 340,
      "avg_net_earned_pkr": 1820.4,
      "avg_commission_rate": 22.1,
      "total_shifts": 5142
    }
  ]
}
```

### 5.8 GET /api/analytics/advocate/overview-kpis

Role: advocate

Response:
```json
{
  "total_active_workers": 1287,
  "total_verified_earnings_this_month_pkr": 19450233.25,
  "total_grievances_this_week": 88,
  "total_vulnerability_flags_this_month": 103,
  "most_complained_platform": "uber"
}
```

Notes:
- `total_grievances_this_week` and `most_complained_platform` are enriched via Grievance Service analytics APIs.
- If Grievance Service is unavailable, these values gracefully fall back to zero/null.

## 6) Certificate Service

Base URL: `http://localhost:8004`

Auth:
- Render endpoints require `Authorization: Bearer <access_token>`.
- Allowed role: `worker` only.

### 6.1 GET /api/certificate/health

Role: public (no JWT required)

Response:
```json
{
  "status": "ok",
  "service": "certificate-renderer-service",
  "mode": "stateless"
}
```

### 6.2 GET /api/certificate/render

Role: worker

Query:
- `date_from` (optional, `YYYY-MM-DD`)
- `date_to` (optional, `YYYY-MM-DD`)

Behavior:
- Uses worker identity from JWT (`sub`) only.
- Fetches verified earning summary from Earnings service using internal API key.
- Returns rendered print-friendly HTML certificate.

Response type:
- `text/html`

### 6.3 POST /api/certificate/render/direct

Role: worker

Request body:
```json
{
  "worker_id": "worker-uuid",
  "worker_name": "Ali Raza",
  "worker_email": "ali@example.com",
  "date_from": "2026-01-01",
  "date_to": "2026-03-31",
  "totals": {
    "total_gross": 120000,
    "total_deductions": 18000,
    "total_net": 102000
  },
  "per_platform_breakdown": [
    {
      "platform": "careem",
      "total_gross": 70000,
      "total_deductions": 10000,
      "total_net": 60000,
      "shifts_count": 28
    }
  ],
  "verified_shifts": [
    {
      "id": "shift_123",
      "platform": "careem",
      "date": "2026-02-10",
      "hours_worked": 8,
      "gross_earned": 4200,
      "deductions": 600,
      "net_received": 3600,
      "verification_status": "verified"
    }
  ]
}
```

Security rule:
- `worker_id` in payload must match JWT subject.

Response type:
- `text/html`

### 6.4 Print Contract

- Certificate output is designed for browser print and save-as-PDF.
- Template uses print-specific CSS (`@media print`, A4 layout, no navigation/sidebar).
