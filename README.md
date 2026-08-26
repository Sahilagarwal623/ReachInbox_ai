# ReachInbox.ai — Email Outreach Job Scheduler

> Production-grade, full-stack email job scheduler built with **BullMQ delayed queues**, **Redis** atomic rate limiting, **PostgreSQL** persistence, and **Ethereal SMTP** delivery — featuring a sleek Next.js dashboard.

---

## 🏗 Architecture Overview

```
 ┌────────────────────┐      HTTP API       ┌──────────────────────────────────┐
 │   Next.js Frontend │ ──────────────────► │  Express.js Backend (TypeScript) │
 │   (React + TailCSS)│                     └──────────────┬───────────────────┘
 └────────────────────┘                                    │
                                                           │ Save Records
                                                           ▼
                                            ┌──────────────────────────────────┐
                                            │  PostgreSQL (Prisma ORM)         │
                                            │  Users + EmailSchedule tables    │
                                            └──────────────────────────────────┘
                                                           ▲
                                                           │ Job State & Locks
                                                           ▼
                                            ┌──────────────────────────────────┐
                                            │  BullMQ Queue + Redis Storage    │
                                            │  Delayed jobs, backoff retries   │
                                            └──────────────┬───────────────────┘
                                                           │
                                                           │ Worker Processes
                                                           ▼
                                            ┌──────────────────────────────────┐
                                            │  BullMQ Worker (Concurrency: 5)  │
                                            │  + Redis Atomic Rate Limiter     │
                                            └──────────────┬───────────────────┘
                                                           │
                                                           │ Sends via SMTP
                                                           ▼
                                            ┌──────────────────────────────────┐
                                            │  Ethereal Email (Fake SMTP)      │
                                            │  Preview links for verification  │
                                            └──────────────────────────────────┘
```

---

## ✨ Key Features

### Backend
- **BullMQ Delayed Queue** — No cron jobs. Each email is enqueued as a delayed BullMQ job with a calculated delay from now
- **Configurable Worker Concurrency** — Process multiple emails concurrently (default: 5 workers)
- **Atomic Redis Rate Limiting** — Lua script-based hourly counter per sender email with automatic re-queue to next hour window
- **Staggered Send Delays** — Inter-email delay to prevent burst sending (configurable per campaign)
- **Boot Recovery** — On server restart, scans PostgreSQL for pending `SCHEDULED`/`RATE_LIMITED` jobs missing from Redis and re-enqueues them
- **Idempotency Guard** — Worker skips already-sent or cancelled emails to prevent duplicates
- **Ethereal SMTP** — Uses Nodemailer with Ethereal fake SMTP for testable email delivery with preview URLs
- **Graceful Shutdown** — SIGTERM/SIGINT handlers close HTTP server, BullMQ worker, and database connections cleanly

### Frontend
- **Professional Dark Dashboard** — Built with Next.js 14 + Tailwind CSS with glassmorphism, ambient gradients, and micro-animations
- **Google OAuth Login** — Demo accounts with one-click sign in, plus custom email entry
- **Stats Overview** — Real-time cards showing Scheduled, Rate-Limited, Sent, and Failed counts
- **Scheduled Queue Table** — Search, status badges (Scheduled/Rate-Limited/Processing), cancel action
- **Sent Emails Table** — Delivery timestamps, status badges, clickable Ethereal preview links
- **Compose Modal** — Subject, body, CSV file upload with auto-detection, start time picker, delay & hourly limit controls
- **Auto-Refresh** — Dashboard polls every 4 seconds for live worker tracking

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Backend Runtime | Node.js + TypeScript |
| Web Framework | Express.js |
| Database | PostgreSQL 16 + Prisma ORM |
| Job Queue | BullMQ (Redis-backed delayed queues) |
| Rate Limiter | Redis + Lua atomic script |
| Email Service | Nodemailer + Ethereal Email (fake SMTP) |
| Frontend | Next.js 14 + React 18 |
| Styling | Tailwind CSS 3 |
| Containerization | Docker + Docker Compose |

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** v18+
- **Docker** & **Docker Compose** (for PostgreSQL + Redis)
- **npm** package manager

### Option 1: Quick Start with Docker Compose (Recommended)

```bash
# Clone the repo
git clone <repo-url>
cd ReachInbox_ai

# Start all services (PostgreSQL, Redis, Backend, Frontend)
docker compose up --build

# Access:
# Frontend:  http://localhost:3000
# Backend:   http://localhost:4000
# Health:    http://localhost:4000/health
```

### Option 2: Local Development

#### 1. Start Infrastructure (PostgreSQL + Redis)

```bash
docker compose up postgres redis -d
```

#### 2. Setup Backend

```bash
cd backend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Push database schema
npx prisma db push

# Generate Prisma client
npx prisma generate

# Start development server
npm run dev
```

The backend starts at `http://localhost:4000`.

#### 3. Setup Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend starts at `http://localhost:3000`.

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Health check with service status |
| `POST` | `/api/auth/google` | Login / sync Google user |
| `GET` | `/api/auth/me` | Get current user profile |
| `POST` | `/api/emails/schedule` | Schedule a batch of emails (multipart/form-data) |
| `GET` | `/api/emails/scheduled` | Get all scheduled/pending emails |
| `GET` | `/api/emails/sent` | Get all sent/failed emails |
| `POST` | `/api/emails/cancel/:id` | Cancel a scheduled email |
| `POST` | `/api/emails/parse-csv` | Parse CSV file for email addresses |
| `GET` | `/api/emails/stats` | Get email status statistics |

### Schedule Batch Request Body (FormData)

| Field | Type | Required | Description |
|---|---|---|---|
| `userId` | string | ✅ | User ID |
| `senderEmail` | string | ❌ | Sender email (defaults to Ethereal) |
| `subject` | string | ✅ | Email subject line |
| `body` | string | ✅ | Email body content |
| `recipients` | JSON string | ✅ | Array of recipient emails |
| `startTime` | ISO string | ❌ | Schedule start time (default: now) |
| `delayMs` | number | ❌ | Delay between emails in ms (default: 2000) |
| `hourlyLimit` | number | ❌ | Max emails per hour (default: 200) |
| `file` | File | ❌ | CSV/TXT file with email addresses |

---

## ⚙️ Rate Limiting & Concurrency Strategy

### How Rate Limiting Works

1. Each sender email has an **atomic Redis counter** keyed by `ratelimit:{email}:{YYYY-MM-DD_HH}`
2. When the BullMQ worker picks up a job, it runs a **Lua script** that atomically checks and increments the counter
3. If `count >= hourlyLimit`:
   - Job status updated to `RATE_LIMITED` in PostgreSQL
   - Job is **re-enqueued** with a delay calculated to the start of the next hour
   - No emails are dropped — they are rescheduled automatically
4. If `count < hourlyLimit`:
   - Counter increments and email is sent via Ethereal SMTP
   - Status updated to `SENT` with Ethereal preview URL

### Concurrency

- BullMQ Worker runs with configurable concurrency (default: `5` via `WORKER_CONCURRENCY`)
- Multiple jobs are processed in parallel while respecting per-sender rate limits
- Exponential backoff retry: 3 attempts with 5s base delay

---

## 🔄 Server Restart & Persistence

### How It Survives Restarts

1. **Redis Persistence** — BullMQ delayed jobs are stored in Redis (RDB/AOF). On reconnect, all delayed jobs resume automatically
2. **Boot Recovery Check** — On startup, the server scans PostgreSQL for any `SCHEDULED` or `RATE_LIMITED` records that are missing from the BullMQ queue and re-enqueues them
3. **Idempotency** — If a job has already been marked `SENT` or `CANCELLED` in PostgreSQL, the worker skips it to prevent duplicate sends

### Test Scenario

1. Schedule an email 60 seconds in the future
2. Kill the backend server (`Ctrl+C`)
3. Wait 30 seconds, then restart the server
4. The boot recovery handler detects the missing job and re-queues it
5. Email sends at the correct scheduled time without duplicates

---

## 📁 Project Structure

```
ReachInbox_ai/
├── docker-compose.yml          # PostgreSQL, Redis, Backend, Frontend
├── README.md
│
├── backend/
│   ├── Dockerfile
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env.example
│   ├── prisma/
│   │   └── schema.prisma       # User + EmailSchedule models
│   └── src/
│       ├── index.ts            # Bootstrap: DB, SMTP, Worker, Recovery, Express
│       ├── config/
│       │   └── env.ts          # Environment variable config
│       ├── db/
│       │   └── client.ts       # Prisma client singleton
│       ├── queue/
│       │   ├── emailQueue.ts   # BullMQ queue setup + add/remove helpers
│       │   ├── emailWorker.ts  # Worker: rate limit check → send → update DB
│       │   └── rateLimiter.ts  # Redis client + Lua atomic rate limiter
│       ├── services/
│       │   ├── email.service.ts    # Business logic: batch scheduling, queries
│       │   └── ethereal.service.ts # Ethereal SMTP transporter (pooled)
│       ├── controllers/
│       │   ├── email.controller.ts # Request handlers for email endpoints
│       │   └── auth.controller.ts  # Google OAuth sync + profile
│       └── routes/
│           ├── email.routes.ts     # Email API routes
│           └── auth.routes.ts      # Auth API routes
│
└── frontend/
    ├── Dockerfile
    ├── package.json
    ├── tailwind.config.js
    ├── next.config.js
    └── src/
        ├── app/
        │   ├── page.tsx        # Main dashboard page
        │   ├── layout.tsx      # Root layout with Inter font + Toaster
        │   └── globals.css     # Tailwind directives + custom animations
        ├── components/
        │   ├── Header.tsx      # Navigation + Google OAuth login modal
        │   ├── ComposeModal.tsx # Campaign composer (CSV, scheduling controls)
        │   ├── ScheduledTable.tsx  # Pending emails table with cancel action
        │   ├── SentTable.tsx       # Delivered emails with Ethereal links
        │   └── StatsOverview.tsx   # Telemetry stat cards
        ├── lib/
        │   └── api.ts          # Axios API client
        └── types/
            └── index.ts        # TypeScript interfaces
```

---

## 🧪 Environment Variables

### Backend (`backend/.env`)

| Variable | Default | Description |
|---|---|---|
| `PORT` | `4000` | HTTP server port |
| `NODE_ENV` | `development` | Environment mode |
| `DATABASE_URL` | (see .env.example) | PostgreSQL connection string |
| `REDIS_HOST` | `127.0.0.1` | Redis host |
| `REDIS_PORT` | `6379` | Redis port |
| `WORKER_CONCURRENCY` | `5` | BullMQ worker parallelism |
| `DEFAULT_MIN_DELAY_MS` | `2000` | Default inter-email delay |
| `DEFAULT_HOURLY_LIMIT` | `200` | Default max emails per hour |
| `ETHEREAL_USER` | (auto-generated) | Ethereal SMTP user |
| `ETHEREAL_PASS` | (auto-generated) | Ethereal SMTP password |
| `JWT_SECRET` | (see .env.example) | JWT signing secret |

### Frontend (`frontend/.env.local`)

| Variable | Default | Description |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:4000/api` | Backend API base URL |

---

## ✅ Feature Checklist

- [x] Express.js + TypeScript backend
- [x] PostgreSQL database with Prisma ORM
- [x] BullMQ delayed queue (no cron jobs)
- [x] Configurable worker concurrency
- [x] Ethereal Email SMTP via Nodemailer
- [x] Atomic Redis hourly rate limiting (Lua script)
- [x] Rate-limited jobs auto-rescheduled to next hour
- [x] Boot recovery (resync DB → BullMQ on restart)
- [x] Idempotency guard (skip duplicates)
- [x] CSV file upload + email parsing
- [x] RESTful API (schedule, list, cancel, stats)
- [x] Google OAuth authentication flow
- [x] Next.js 14 frontend dashboard
- [x] Real-time stats overview cards
- [x] Scheduled + Sent email tables with search
- [x] Compose modal with scheduling controls
- [x] Auto-refresh (4s polling)
- [x] Docker Compose deployment
- [x] Graceful shutdown handling

---

## 📄 License

Built for the **ReachInbox.ai Full-stack Hiring Assignment**.
