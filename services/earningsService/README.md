# FairGig Earnings Service

Node.js (Express) + Drizzle + PostgreSQL microservice for worker earnings logs, screenshot verification workflow, CSV import, and internal earnings aggregation APIs.

## Run

```bash
bun install
bun run generate:migrations
bun run apply:migrations
bun run dev
```

Service base URL:

http://localhost:3001/api/earnings

## Required Environment For Screenshot Uploads

- `AWS_REGION`
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_S3_BUCKET_NAME`
- `S3_PUBLIC_BASE_URL` (optional; use when serving via CloudFront/custom domain)
- `S3_SIGNED_URL_TTL_SECONDS` (optional; defaults to 900)
- `SCREENSHOT_OPTIMIZE_MAX_WIDTH` (optional; defaults to 1600)
- `SCREENSHOT_OPTIMIZE_MAX_HEIGHT` (optional; defaults to 1600)
- `SCREENSHOT_OPTIMIZE_WEBP_QUALITY` (optional; defaults to 72)

Screenshot responses are returned as time-limited signed URLs when an S3 object key is available.
Screenshots are optimized to WebP on upload to reduce payload size and improve verifier load speed.

## Auth Model

- Worker and verifier endpoints require Bearer access token.
- Internal aggregation endpoints require `X-Service-Api-Key`.
- Worker access is ownership-scoped.

## Key Endpoints

- Worker
	- POST /shifts
	- GET /shifts
	- GET /shifts/:id
	- PUT /shifts/:id
	- DELETE /shifts/:id
	- POST /shifts/import
	- GET /shifts/import/template
	- POST /shifts/:id/screenshot
	- GET /shifts/:id/screenshot
- Verifier
	- GET /verifications/queue
	- GET /verifications/:id
	- POST /verifications/:id/decision
	- GET /verifications/history
- Internal
	- GET /shifts/summary/:workerId
	- GET /shifts/aggregate/median

## Central API Document

Refer to shared contract in repository root:

- ../../API_DOCUMENTATION.md
