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
