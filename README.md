# Taskflow: Real-Time Task Collaboration Platform

A Trello-like board application with real-time collaboration, drag-and-drop task ordering, activity feed, assignment flow, authentication, and search.

## Table of Contents

- Overview
- Tech Stack
- Repository Layout
- Prerequisites
- Quick Start
- Environment Variables
- How to Use the App
- Available Scripts
- Testing
- API Notes
- Troubleshooting
- Deployment Notes

## Overview

Taskflow is a full-stack monorepo with:
- A TypeScript backend using Express, Prisma, PostgreSQL, and Socket.io.
- A TypeScript frontend using React, Redux Toolkit, Vite, and dnd-kit.
- Shared TypeScript contracts package for common DTO/event types.

Core implemented flows:
- User signup/login/logout/refresh/me.
- Board, list, and task CRUD.
- Drag-and-drop task movement with optimistic UI rollback.
- Task self-assignment/unassignment.
- Realtime board updates over WebSocket.
- Activity feed and board-scoped search.

## Tech Stack

Backend:
- Node.js + Express
- TypeScript
- Prisma ORM + PostgreSQL
- JWT auth (access + refresh token rotation)
- Socket.io
- Jest + Supertest

Frontend:
- React + TypeScript
- Redux Toolkit
- React Router
- dnd-kit
- Axios
- Socket.io client
- Vitest + Testing Library

Tooling:
- pnpm workspaces
- ESLint + TypeScript strict mode
- GitHub Actions CI

## Repository Layout

```text
.
├── apps/
│   ├── backend/         # API, Prisma schema/migrations, WebSocket server, tests
│   └── frontend/        # React app (Phase 2 implemented)
├── packages/
│   └── shared-types/    # Shared TypeScript contracts
├── .github/workflows/   # CI pipeline
└── pnpm-workspace.yaml
```

## Prerequisites

- Node.js 20+ recommended (Node 22 also works)
- pnpm 9 (managed via Corepack)
- PostgreSQL 15+

## Quick Start

### 1. Install dependencies

```bash
corepack enable
pnpm install
```

### 2. Configure environment files

```bash
cp apps/backend/.env.example apps/backend/.env
cp apps/frontend/.env.example apps/frontend/.env
```

### 3. Start PostgreSQL and apply migrations

```bash
pnpm --filter @taskflow/backend prisma:generate
pnpm --filter @taskflow/backend prisma:deploy
```

For local development when creating new migrations:

```bash
pnpm --filter @taskflow/backend prisma:migrate
```

### 4. Seed demo data (optional but recommended)

```bash
pnpm --filter @taskflow/backend seed
```

This creates:
- `demo@taskflow.com`
- Password: `Demo123!`
- Sample board/lists/task

### 5. Run backend and frontend

Terminal 1:
```bash
pnpm --filter @taskflow/backend dev
```

Terminal 2:
```bash
pnpm --filter @taskflow/frontend dev
```

Open:
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:5000`

## Environment Variables

### Backend (`apps/backend/.env`)

- `NODE_ENV` default `development`
- `PORT` default `5000`
- `DATABASE_URL` PostgreSQL connection URL
- `JWT_SECRET` secret key for signing JWT
- `JWT_EXPIRES_IN` default `15m`
- `REFRESH_TOKEN_EXPIRES_IN` default `7d`
- `FRONTEND_URL` default `http://localhost:3000`
- `REDIS_URL` optional (reserved for socket scaling)
- `ENABLE_DB_TESTS` set `true` when running DB integration tests

### Frontend (`apps/frontend/.env`)

- `VITE_API_URL` default `http://localhost:5000/api/v1`
- `VITE_WS_URL` default `http://localhost:5000`

## How to Use the App

### Login / Signup

1. Open `http://localhost:3000`.
2. If you do not have a user, switch to **Signup** and create one.
3. Or login with seeded user:
   - Email: `demo@taskflow.com`
   - Password: `Demo123!`

### Create and Manage Boards

1. On the boards screen, create a board with title/description.
2. Click a board card to open board detail.

### Lists and Tasks

1. Add lists from “Add a new list”.
2. Add tasks in each list.
3. Edit/delete tasks inline.
4. Assign/unassign yourself from task cards.

### Drag and Drop

1. Drag by the “Drag” handle on each task.
2. Drop within same list or another list.
3. UI updates optimistically and rolls back on API failure.

### Search and Activity

1. Use “Search this board” for board/list/task text search.
2. Activity panel shows audit history in reverse chronological order.
3. Realtime events update the board and activity views.

## Available Scripts

Root:

```bash
pnpm dev              # backend dev server
pnpm dev:backend      # backend dev server
pnpm dev:frontend     # frontend dev server
pnpm build            # build all workspace packages
pnpm lint             # lint all packages
pnpm typecheck        # typecheck all packages
pnpm test             # run tests across workspaces
```

Backend:

```bash
pnpm --filter @taskflow/backend dev
pnpm --filter @taskflow/backend build
pnpm --filter @taskflow/backend start
pnpm --filter @taskflow/backend prisma:generate
pnpm --filter @taskflow/backend prisma:deploy
pnpm --filter @taskflow/backend seed
```

Frontend:

```bash
pnpm --filter @taskflow/frontend dev
pnpm --filter @taskflow/frontend build
pnpm --filter @taskflow/frontend preview
```

## Testing

Backend unit tests:

```bash
pnpm --filter @taskflow/backend test:unit
```

Backend integration + websocket tests (requires DB and env var):

```bash
ENABLE_DB_TESTS=true pnpm --filter @taskflow/backend test:integration
ENABLE_DB_TESTS=true pnpm --filter @taskflow/backend test:ws
```

Run all backend tests:

```bash
ENABLE_DB_TESTS=true pnpm --filter @taskflow/backend test
```

Frontend tests:

```bash
pnpm --filter @taskflow/frontend test
```

## API Notes

Base path:
- `http://localhost:5000/api/v1`

Health endpoints:
- `GET /health`
- `GET /ready`

Auth endpoints:
- `POST /auth/signup`
- `POST /auth/login`
- `GET /auth/me`
- `POST /auth/refresh`
- `POST /auth/logout`

All API responses follow:
- Success: `{ "success": true, "data": ... }`
- Error: `{ "success": false, "error": { "code", "message", "details" } }`

## Troubleshooting

### Login fails

1. Confirm backend is running on port `5000`.
2. Confirm frontend env:
   - `VITE_API_URL=http://localhost:5000/api/v1`
3. If using demo user, run seed:
   - `pnpm --filter @taskflow/backend seed`
4. Clear stale local session:
   - Open browser devtools console and run:
   - `localStorage.removeItem('taskflow.session')`
5. Validate login directly against API:

```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@taskflow.com","password":"Demo123!"}'
```

### CORS error

- Ensure backend `FRONTEND_URL` exactly matches frontend origin, usually `http://localhost:3000`.

### WebSocket not connecting

- Confirm `VITE_WS_URL` points to backend host/port (default `http://localhost:5000`).
- Check browser network tab for socket handshake 401 (usually invalid/expired token).

### DB integration tests are skipped

- Set `ENABLE_DB_TESTS=true`.
- Ensure PostgreSQL is available and `DATABASE_URL` points to a valid DB.

## Deployment Notes

Backend:
- Build with `pnpm --filter @taskflow/backend build`
- Start with `pnpm --filter @taskflow/backend start`
- Provide production env vars (`DATABASE_URL`, `JWT_SECRET`, `FRONTEND_URL`, etc.)

Frontend:
- Build with `pnpm --filter @taskflow/frontend build`
- Deploy `dist` from frontend package
- Set `VITE_API_URL` and `VITE_WS_URL` to production backend URLs
