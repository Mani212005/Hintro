# Taskflow Real-Time Collaboration Platform

Monorepo structure:
- `apps/backend`: TypeScript + Express + Socket.io + Prisma backend
- `apps/frontend`: React + TypeScript + Redux Toolkit frontend
- `packages/shared-types`: Shared DTO/event contracts

## Quick start (network-enabled environment)

1. Install dependencies
```bash
corepack enable
pnpm install
```

2. Configure backend env
```bash
cp apps/backend/.env.example apps/backend/.env
```

3. Generate Prisma client and run migrations
```bash
pnpm --filter @taskflow/backend prisma:generate
pnpm --filter @taskflow/backend prisma:migrate
```

4. Seed demo data
```bash
pnpm --filter @taskflow/backend seed
```

5. Start backend
```bash
pnpm --filter @taskflow/backend dev
```

6. Configure and start frontend
```bash
cp apps/frontend/.env.example apps/frontend/.env
pnpm --filter @taskflow/frontend dev
```

## Test commands
```bash
pnpm --filter @taskflow/backend test:unit
ENABLE_DB_TESTS=true pnpm --filter @taskflow/backend test:integration
ENABLE_DB_TESTS=true pnpm --filter @taskflow/backend test:ws
pnpm --filter @taskflow/frontend test
```
