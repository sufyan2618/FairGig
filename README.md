# FairGig

FairGig is a platform built to bring transparency and accountability to gig economy earnings. It enables gig workers to track verified income across platforms, detect unusual deductions using AI, file formal grievances, and generate verifiable income certificates. The system is designed as a distributed microservices architecture, deployed to production on Kubernetes (K3s) with automated CI/CD.

**Live:** [https://fairgig.sufyanliaqat.me](https://fairgig.sufyanliaqat.me)

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Services](#services)
- [Tech Stack](#tech-stack)
- [Infrastructure](#infrastructure)
- [Kubernetes Setup](#kubernetes-setup)
- [CI/CD Pipeline](#cicd-pipeline)
- [Observability](#observability)
- [Secrets Management](#secrets-management)
- [Running Locally](#running-locally)
- [Project Structure](#project-structure)

---

## Overview

FairGig addresses real problems faced by gig economy workers:

- **Earnings Tracking** — Workers upload payslips, screenshots, and CSV exports from gig platforms. The system normalizes, stores, and visualizes earnings history.
- **Anomaly Detection** — An AI-powered service analyzes earnings data to flag unusual patterns such as unexplained deductions, rate drops, or missing payments.
- **Grievance Filing** — Workers can file structured complaints against platforms. Advocates moderate and escalate these grievances.
- **Analytics** — Cross-platform income analytics with caching, cohort comparisons, and platform-level breakdowns.
- **Income Certificates** — Generates verifiable PDF certificates of a worker's earnings history, useful for loan applications or rental agreements.
- **Role-Based Access** — Three user roles: Worker, Advocate, and Verifier, each with distinct dashboards and permissions.

---

## Architecture

The system follows a microservices architecture with a centralized API gateway. All inter-service communication happens over HTTP within the Kubernetes cluster network. The frontend is a static SPA served by Nginx.

```
                         Internet
                            |
                     [NGINX Ingress]
                       /         \
                      /           \
               /api/*              /*
                 |                  |
           [API Gateway]      [Frontend]
           (port 8080)        (Nginx, port 80)
                 |
    ┌────────────┼────────────────────────────────┐
    |            |            |          |         |
 [Auth]    [Earnings]   [Analytics] [Anomaly] [Certificate]
 :8000      :8001         :8003      :8002      :8004
    |            |            |
    |       [Grievance]       |
    |         :3002           |
    |            |            |
 [Redis]    [MongoDB]    [PostgreSQL]
 :6379      :27017         :5432
                        ┌────┼────┐
                   fairgig_auth  fairgig_earnings  fairgig_analytics
```

---

## Services

| Service | Language / Runtime | Port | Database | Description |
|---|---|---|---|---|
| **auth-service** | Python 3.12 / FastAPI | 8000 | PostgreSQL + Redis | Registration, login, JWT access/refresh tokens, OTP verification, password reset. Uses Alembic for migrations. |
| **earnings-service** | TypeScript / Bun + Express | 8001 | PostgreSQL | Shift logging, CSV and screenshot uploads to AWS S3, earnings history. Uses Drizzle ORM with migrations. |
| **analytics-service** | Python 3.12 / FastAPI | 8003 | PostgreSQL (read-only from earnings + analytics DBs) | Cross-platform income analytics, cohort comparison, platform breakdowns. Caches responses with configurable TTLs. |
| **anomaly-service** | Python 3.12 / FastAPI | 8002 | None (stateless) | AI-powered anomaly detection using OpenAI. Analyzes earnings patterns and flags deductions. |
| **certificate-service** | Python 3.12 / FastAPI | 8004 | None (calls earnings-service) | Generates verifiable income certificates. Uses Jinja2 templates. |
| **grievance-service** | Node.js 20 / Express | 3002 | MongoDB | Complaint filing, moderation queue, NLP-based categorization using `natural`. |
| **api-gateway** | Node.js 20 (zero-dependency) | 8080 | None | Central entry point. Routes requests to backend services. Performs JWT introspection via auth-service before forwarding to protected routes. |
| **frontend** | React 19 + TypeScript + Vite | 80 (Nginx) | None | SPA with Tailwind CSS v4, Zustand for state, role-based dashboards. Built as static files, served by Nginx. |

---

## Tech Stack

**Backend:**
- Python 3.12, FastAPI, Uvicorn, SQLAlchemy, Alembic, asyncpg, Pydantic
- Node.js 20, Express 5, Mongoose, Drizzle ORM
- Bun runtime (earnings-service)
- OpenAI API (anomaly detection)

**Frontend:**
- React 19, TypeScript, Vite 8, Tailwind CSS v4
- Zustand (state management), React Router v6, Axios
- Lottie animations

**Databases:**
- PostgreSQL 15 (3 databases: `fairgig_auth`, `fairgig_earnings`, `fairgig_analytics`)
- MongoDB 7 (`fairgig_grievance`)
- Redis 7 (session caching for auth)

**Infrastructure:**
- K3s (lightweight Kubernetes) on a DigitalOcean Droplet
- Docker + Docker Hub (container registry)
- NGINX Ingress Controller
- cert-manager with Let's Encrypt (automatic TLS)
- GitHub Actions (CI/CD)

---

## Infrastructure

### Cluster

- **Runtime:** K3s on a single DigitalOcean Droplet (Ubuntu)
- **Namespace:** All application resources run in the `app` namespace
- **Ingress:** NGINX Ingress Controller with host-based routing and automatic HTTPS via cert-manager

### Databases

All databases run as single-replica Deployments with PersistentVolumeClaims for durable storage:

| Database | Image | PVC | Purpose |
|---|---|---|---|
| PostgreSQL | `postgres:15-alpine` | `postgres-pvc` | Auth, earnings, and analytics data. Initialized via ConfigMap (`postgres-init-sql`) that creates all three databases on first boot. |
| MongoDB | `mongo:7` | `mongo-pvc` | Grievance documents |
| Redis | `redis:7-alpine` | `redis-pvc` | Session cache for auth tokens. Runs with AOF persistence enabled. Configured with readiness/liveness probes and resource limits. |

---

## Kubernetes Setup

All manifests live in the `k8s/` directory.

### Namespace and ConfigMap

```yaml
# k8s/namespaces.yml — creates the 'app' namespace
# k8s/configmap.yml  — contains init.sql that creates the three PostgreSQL databases
```

The ConfigMap is mounted into the PostgreSQL container at `/docker-entrypoint-initdb.d`, so databases are created automatically on first startup.

### Ingress

The Ingress (`k8s/ingress.yml`) uses NGINX Ingress Controller with the following configuration:

- **Host:** `fairgig.sufyanliaqat.me`
- **TLS:** Automatic certificate provisioning via cert-manager and Let's Encrypt
- **Routing:** `/api` prefix routes to the API Gateway; `/` routes to the frontend
- **Annotations:** Force HTTPS redirect, proxy timeouts (120s read/send, 30s connect), 10MB body size limit

### TLS / cert-manager

A `ClusterIssuer` (`k8s/cluster-issuer-prod.yml`) is configured for Let's Encrypt production using HTTP-01 challenges through the NGINX ingress class. The Ingress references it via the `cert-manager.io/cluster-issuer` annotation, and cert-manager automatically provisions and renews the TLS certificate.

### Deployments

Each microservice runs as a Kubernetes Deployment with:

- 2 replicas for all application services (high availability)
- 1 replica for infrastructure (PostgreSQL, MongoDB, Redis)
- Environment variables injected from Kubernetes Secrets via `secretKeyRef`
- Readiness probes on health endpoints for zero-downtime rolling updates
- Resource limits on Redis (64Mi-256Mi memory, 50m-200m CPU)

### Service Port Map

| Service | ClusterIP Port |
|---|---|
| auth-service | 8000 |
| earnings-service | 8001 |
| analytics-service | 8003 |
| anomaly-service | 8002 |
| certificate-service | 8004 |
| grievance-service | 3002 |
| api-gateway-service | 8080 |
| frontend-service | 80 |
| postgres-service | 5432 |
| mongodb-service | 27017 |
| redis-service | 6379 |

---

## CI/CD Pipeline

The CI/CD pipeline is implemented with GitHub Actions and consists of two workflow files:

### `deploy.yml` — Orchestrator

Triggers on every push to the `master` branch. Uses `concurrency` with `cancel-in-progress` to ensure only the latest commit is deployed.

1. **Detect Changes** — Uses `dorny/paths-filter` to determine which service directories were modified.
2. **Apply k8s Manifests** — If any file in `k8s/` changed, copies manifests to the VPS via SCP and runs `kubectl apply` for namespaces, configmaps, ingress, PVCs, infrastructure deployments, and service objects.
3. **Build and Deploy Services** — For each changed service, triggers the reusable workflow. All changed services build in parallel.

### `_service.yml` — Reusable Build/Push/Deploy

A reusable workflow (`workflow_call`) that any service job can invoke:

1. **Build** — Uses Docker Buildx with GitHub Actions cache (`type=gha`, scoped per image).
2. **Tag** — Each image is tagged with the short git SHA (e.g., `auth-service:a1b2c3d4`) for traceability, plus `:latest`.
3. **Push** — Pushes to Docker Hub.
4. **Deploy** — SSHs into the VPS, runs `kubectl set image` to update the deployment, then `kubectl rollout status` to wait for the rollout to complete (180s timeout).

### Key Properties

- Only changed services are built and deployed. Editing `authService/` does not rebuild the other 7 images.
- Image tags use the commit SHA so every deployment is traceable and rollback is trivial.
- `kubectl set image` performs a rolling update with zero downtime (readiness probes gate traffic).

### Required GitHub Secrets

| Secret | Description |
|---|---|
| `DOCKERHUB_USERNAME` | Docker Hub username |
| `DOCKERHUB_TOKEN` | Docker Hub personal access token |
| `VPS_HOST` | Droplet IP address |
| `VPS_USER` | SSH user (e.g., `root`) |
| `VPS_SSH_KEY` | Private SSH key for VPS access |

### Required GitHub Variables

| Variable | Description |
|---|---|
| `VITE_API_BASE_URL` | Public API base URL (e.g., `https://fairgig.sufyanliaqat.me`) |

### Rollback

```bash
kubectl rollout undo deployment/<service-name> -n app
```

---

## Observability

### OpenTelemetry Tracing

All services are instrumented with OpenTelemetry for distributed tracing:

- **Python services** (auth, analytics, anomaly, certificate) use `opentelemetry-instrumentation-fastapi`, `opentelemetry-instrumentation-sqlalchemy`, and `opentelemetry-instrumentation-logging`. Traces are exported via OTLP/gRPC.
- **Node.js services** (earnings, grievance) use `@opentelemetry/auto-instrumentations-node` with `@opentelemetry/exporter-trace-otlp-grpc`.

This provides end-to-end request tracing across all services, including database queries and HTTP calls.

### Prometheus Metrics

- Python services expose metrics via `prometheus-fastapi-instrumentator` (request latency, status codes, in-flight requests).
- Node.js services expose metrics via `prom-client`.

### Health Checks

Every service exposes a health endpoint used by Kubernetes readiness probes:

| Service | Health Endpoint |
|---|---|
| auth-service | `/api/health` |
| earnings-service | `/api/health` |
| analytics-service | `/api/analytics/health` |
| anomaly-service | `/api/health` |
| certificate-service | `/api/certificate/health` |
| grievance-service | `/api/grievances/health` |
| api-gateway | `/health` |
| redis | `redis-cli ping` (exec probe) |

---

## Secrets Management

No secrets are committed to the repository. The approach:

1. **Example files** are checked into `k8s/secrets/` (e.g., `auth-secrets-example.yml`) showing which keys each service expects, with placeholder values.
2. **Actual secrets** are created directly on the server using `kubectl create secret generic`:

```bash
kubectl create secret generic auth-secrets \
  --namespace=app \
  --from-literal=ACCESS_TOKEN_SECRET=<real-value> \
  --from-literal=DATABASE_URL=<real-value> \
  ...
```

3. Deployments reference secrets via `secretKeyRef`, so environment variables are injected at pod startup.
4. There are 7 secrets total: `postgres-secrets`, `auth-secrets`, `earnings-secrets`, `analytics-secrets`, `anamoly-secrets`, `certificate-secrets`, `grievance-secrets`.

---

## Running Locally

### Prerequisites

- Docker and Docker Compose
- (Optional) Node.js 20, Python 3.12, Bun — only if running services outside Docker

### Using Docker Compose

The `docker-compose.yml` at the project root starts all services, databases, and the frontend:

```bash
docker compose up --build
```

This starts:

- PostgreSQL on `localhost:5432` (with 3 databases auto-created)
- MongoDB on `localhost:27017`
- Redis on `localhost:6379`
- Auth service on `localhost:8000`
- Earnings service on `localhost:3001`
- Anomaly service on `localhost:8002`
- Grievance service on `localhost:3002`
- Analytics service on `localhost:8003`
- Certificate service on `localhost:8004`
- API Gateway on `localhost:8080`
- Frontend on `localhost:5173`

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Running Individual Services

**Auth Service (Python/FastAPI):**
```bash
cd services/authService
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env.development
# Edit .env.development with your local database URLs
alembic upgrade head
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

**Earnings Service (Bun/Express):**
```bash
cd services/earningsService
bun install
cp .env.example .env
# Edit .env with local database URL
bun run apply:migrations
bun run dev
```

**Grievance Service (Node.js/Express):**
```bash
cd services/grievanceService
npm install
cp .env.example .env
# Edit .env with local MongoDB URI
npm run dev
```

**Frontend (React/Vite):**
```bash
cd frontend
pnpm install
echo "VITE_API_BASE_URL=http://localhost:8080" > .env
pnpm run dev
```

---

## Project Structure

```
FairGig/
├── .github/
│   └── workflows/
│       ├── deploy.yml              # CI/CD orchestrator
│       └── _service.yml            # Reusable build/push/deploy workflow
├── ApiGateway/
│   ├── dev-gateway.mjs             # Node.js reverse proxy with auth introspection
│   ├── nginx.conf                  # Production Nginx config
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── api/                    # API client layer (Axios)
│   │   ├── components/             # Reusable UI components
│   │   ├── hooks/api/              # React hooks wrapping API calls
│   │   ├── pages/                  # Route-level page components
│   │   ├── store/                  # Zustand stores
│   │   ├── types/                  # TypeScript type definitions
│   │   └── utils/                  # Helpers and formatters
│   ├── nginx.conf                  # Nginx config for serving the SPA
│   └── Dockerfile
├── services/
│   ├── authService/                # FastAPI + Alembic + Redis
│   ├── earningsService/            # Bun + Express + Drizzle + S3
│   ├── analyticsService/           # FastAPI + SQLAlchemy (read-only)
│   ├── anamolyService/             # FastAPI + OpenAI
│   ├── certificateService/         # FastAPI + Jinja2
│   └── grievanceService/           # Express + Mongoose
├── k8s/
│   ├── namespaces.yml
│   ├── configmap.yml               # PostgreSQL init SQL
│   ├── ingress.yml                 # NGINX Ingress with TLS
│   ├── cluster-issuer-prod.yml     # Let's Encrypt ClusterIssuer
│   ├── secrets/                    # Example secret files (no real values)
│   ├── postgres/                   # PVC + Deployment + Service
│   ├── mongodb/                    # PVC + Deployment + Service
│   ├── redis/                      # PVC + Deployment + Service
│   ├── auth-service/               # Deployment + Service
│   ├── earnings-service/           # Deployment + Service
│   ├── analytics-service/          # Deployment + Service
│   ├── anamoly-service/            # Deployment + Service
│   ├── certificate-service/        # Deployment + Service
│   ├── grievance-service/          # Deployment + Service
│   ├── api-gateway/                # Deployment + Service
│   └── frontend/                   # Deployment + Service
├── infra/
│   └── postgres/
│       └── init-multiple-dbs.sh    # Docker Compose DB init script
├── docker-compose.yml              # Local development (all services)
└── API_DOCUMENTATION.md            # Full API reference
```

---

## License

This project is proprietary. All rights reserved.
