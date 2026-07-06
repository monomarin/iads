# SPEC-00: Project Base — Retail Audio Engine

**Status**: Draft | **Priority**: Critical | **Dependencies**: None

## 1. Descripción

Crear la estructura base del proyecto Retail Audio Engine como monorepo,
con todo configurado para desarrollo local y deploy en Vercel + Cloudflare R2.

## 2. Stack Tecnológico

| Capa | Tecnología | Versión |
|------|-----------|---------|
| Frontend | Next.js | 14+ (App Router) |
| Backend | Fastify | 5.x |
| Mobile | React Native + Expo | 51+ |
| ORM | Drizzle | Latest |
| DB | PostgreSQL | 16 (Neon/Vercel Postgres) |
| Colas | BullMQ + Redis | Latest |
| Auth | Clerk | Latest |
| Storage | Cloudflare R2 | — |
| UI | shadcn/ui + Tailwind CSS | Latest |
| E2E | Playwright | Latest |
| Unit | Vitest | Latest |
| Load | k6 | Latest |

## 3. Estructura del Monorepo

```
raemonorepo/
├── apps/
│   ├── web/                  # Next.js 14 dashboard
│   │   ├── app/              # App Router pages
│   │   ├── components/       # shadcn/ui + custom
│   │   ├── lib/              # utilities
│   │   └── public/           # static assets
│   ├── api/                  # Fastify backend
│   │   ├── src/
│   │   │   ├── routes/       # API endpoints
│   │   │   ├── plugins/      # Fastify plugins
│   │   │   ├── services/     # Business logic
│   │   │   └── middleware/   # Auth, tenant, rate limit
│   │   └── test/
│   └── mobile/               # React Native Expo
│       └── src/
├── packages/
│   ├── db/                   # Drizzle ORM + esquemas
│   │   ├── src/
│   │   │   ├── schema/       # Table definitions
│   │   │   ├── migrations/   # SQL migrations
│   │   │   └── seed/         # Seed data
│   │   └── test/
│   ├── ui/                   # shadcn/ui componentes
│   │   └── src/
│   │       └── components/   # Button, Card, etc.
│   ├── shared/               # Tipos TypeScript compartidos
│   │   └── src/
│   │       └── types/        # Campaign, Tenant, etc.
│   └── audio/                # Utilidades TTS + waveform
│       └── src/
├── specs/                    # SDD specifications
│   └── SPEC-00-project-base.md
├── tooling/
│   └── github/
│       └── workflows/        # CI/CD
├── .env.example
├── docker-compose.yml
├── package.json              # pnpm workspaces
├── turbo.json                # Turborepo
└── README.md
```

## 4. Design System (Tokens)

```css
Modo oscuro (default para dashboard)
--color-bg-base: #0F172A      Navy profundo
--color-bg-surface: #1E293B   Tarjetas
--color-bg-elevated: #334155  Hover
--color-primary: #6366F1      Indigo
--color-success: #10B981      Emerald
--color-warning: #F59E0B      Amber
--color-danger: #F43F5E       Rose
--color-text: #F8FAFC
--color-text-secondary: #94A3B8
--font-sans: 'Inter Variable'
--font-mono: 'JetBrains Mono'
```

## 5. Acceptance Criteria

- [ ] `pnpm install` instala todas las dependencias del monorepo
- [ ] `pnpm dev` levanta Next.js (3000) + Fastify (4000) + PostgreSQL + Redis
- [ ] `pnpm build` compila todos los paquetes sin errores
- [ ] `pnpm lint` pasa ESLint sin warnings
- [ ] `pnpm test` corre unit tests con Vitest
- [ ] `pnpm test:e2e` corre Playwright en el frontend
- [ ] Docker Compose levanta Postgres + Redis local
- [ ] CI/CD en GitHub Actions: lint → typecheck → test → build
- [ ] Deploy automático a Vercel desde main branch
- [ ] Componentes shadcn/ui funcionan con el design system oscuro
- [ ] Skeleton screens en lugar de spinners en componentes clave
- [ ] WCAG baseline: ARIA labels, contraste mínimo, focus visible

## 6. Tasks

1. Inicializar monorepo con pnpm workspaces + turborepo
2. Configurar Next.js 14 con App Router + Tailwind + shadcn/ui
3. Configurar Fastify con TypeScript + plugins
4. Configurar Expo React Native project (esqueleto)
5. Configurar Drizzle ORM + esquemas base + migraciones
6. Configurar Docker Compose (Postgres + Redis)
7. Configurar Playwright + Vitest + k6
8. Configurar GitHub Actions (CI/CD)
9. Configurar Clerk auth + middleware + tenant RLS
10. Configurar Cloudflare R2 cliente
11. Crear design system tokens + tema oscuro + skeletons
12. Crear .env.example con todas las variables
13. Configurar deploy Vercel (web + api)
14. Verificar WCAG baseline

## 7. Definition of Done

- Todo el código compila sin errores
- Tests pasan (unit + e2e + load)
- CI/CD verde
- Deploy a Vercel funciona
- Dashboard base se ve con tema oscuro y skeletons
- Auth Clerk funcional (login/registro)
- .env.example documentado
