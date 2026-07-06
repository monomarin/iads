# SPEC-01: Auth + Multi-tenant + Onboarding

**Status**: Draft | **Priority**: Critical | **Dependencies**: SPEC-00

## 1. Descripción

Implementar autenticación con Clerk, aislamiento multi-tenant por RLS (Row Level Security),
y flujo de onboarding para nuevos usuarios.

## 2. Stack

| Capa | Tecnología |
|------|-----------|
| Auth Frontend | Clerk + Next.js Middleware |
| Auth Backend | Clerk Webhooks + JWT verification |
| RLS | PostgreSQL Row Level Security + Drizzle |
| Onboarding | React multi-step wizard con Shepherd.js tours |
| Cache | Redis (sesiones tenant activas) |

## 3. Flujo de Usuario

### 3.1 Registro / Login
1. User visita `/sign-in` o `/sign-up`
2. Clerk maneja el formulario (email + Google OAuth habilitado)
3. Post-registro, Clerk webhook (`user.created`) → API crea record en tabla `users`
4. Si es primer usuario del tenant → se asigna rol `super_admin`
5. Redirige a `/onboarding`

### 3.2 Onboarding (4 pasos)
1. **Paso 1 — Crear tienda**: nombre, dirección, zona horaria
2. **Paso 2 — Configurar horario**: sync schedule nocturna (cron selector)
3. **Paso 3 — Subir música inicial**: upload primeros MP3 a R2
4. **Paso 4 — Tour guiado**: Shepherd.js tooltips numerados por el dashboard

### 3.3 Multi-tenant RLS
- Cada query de DB filtra por `tenant_id` automáticamente
- Clerk JWT contiene `tenant_id` + `role` en metadata pública
- Middleware extrae tenant de la sesión y lo inyecta en request
- API valida que el tenant del JWT coincida con recursos solicitados

## 4. Database Schema (adiciones)

```sql
-- Políticas RLS para cada tabla existente
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Nueva tabla: onboarding_progress
CREATE TABLE onboarding_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  step INTEGER NOT NULL DEFAULT 1,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Nueva tabla: tenant_invitations
CREATE TABLE tenant_invitations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'store_admin',
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## 5. API Endpoints

| Method | Path | Descripción |
|--------|------|-------------|
| POST | `/api/webhooks/clerk` | Clerk webhook receiver |
| GET | `/api/tenants/current` | Current tenant info |
| PATCH | `/api/tenants/current` | Update tenant settings |
| GET | `/api/onboarding/progress` | Get onboarding step |
| PUT | `/api/onboarding/progress` | Update onboarding step |
| POST | `/api/stores` | Create store (onboarding step 1) |
| POST | `/api/invitations` | Invite user to tenant |
| POST | `/api/invitations/accept` | Accept invitation |

## 6. Acceptance Criteria

- [ ] Sign-up con Clerk crea usuario en DB via webhook
- [ ] Login redirige a `/onboarding` si no completado
- [ ] Onboarding 4 pasos funcional con persistencia
- [ ] Shepherd.js tour guiado al finalizar onboarding
- [ ] RLS activo: usuario ve solo datos de su tenant
- [ ] Invitación por email funciona (link + token)
- [ ] Roles: `super_admin` puede gestionar usuarios del tenant
- [ ] Demo mode: onboarding simplificado (1 paso)

## 7. Tasks

1. Crear Clerk webhook handler (`/api/webhooks/clerk`)
2. Configurar Clerk JWT template con `tenant_id` + `role`
3. Implementar tenant middleware en Fastify
4. Agregar RLS policies a PostgreSQL
5. Crear `onboarding_progress` + `tenant_invitations` schemas
6. Implementar onboarding wizard (4 pasos)
7. Integrar Shepherd.js tour post-onboarding
8. Crear página de invitación + accept flow
9. Seed data: demo tenant + admin user
10. Tests: webhook, RLS isolation, onboarding flow
