# Retail Audio Engine

Intelligent in-store audio advertising platform.

## Stack

- **Frontend**: Next.js 14 + Tailwind + shadcn/ui
- **Backend**: Fastify + TypeScript
- **Mobile**: React Native + Expo
- **Database**: PostgreSQL + Drizzle ORM
- **Queue**: BullMQ + Redis
- **Auth**: Clerk
- **Storage**: Cloudflare R2
- **Orchestration**: n8n + LangGraph

## Development

```bash
# Install dependencies
pnpm install

# Start database
docker compose up -d

# Start dev servers
pnpm dev
```

## Structure

```
apps/
  web/        Next.js dashboard
  api/        Fastify API server
  mobile/     React Native app
packages/
  db/         Database schema & migrations
  ui/         Component library
  shared/     Shared types
  audio/      Audio utilities & R2 client
specs/        SDD specifications
```
