# SPEC-02: Campaigns + A/B Testing

**Status**: Draft | **Priority**: High | **Dependencies**: SPEC-01

## 1. Descripción

CRUD de campañas publicitarias de audio con soporte para A/B testing (hasta 5 variantes),
programación por fechas, y editor de scripts con asistencia de IA.

## 2. Stack

| Capa | Tecnología |
|------|-----------|
| Frontend | Next.js App Router + shadcn/ui |
| Backend | Fastify + Drizzle ORM |
| DB | PostgreSQL (tablas campaigns, audio_variants) |
| AI | Anthropic Claude API (cuando disponible) |

## 3. Database Schema

```sql
CREATE TABLE campaigns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft', -- draft | active | paused | completed | cancelled
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  goal TEXT, -- awareness | conversion | retention
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE audio_variants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  role TEXT NOT NULL, -- control | variant_a | variant_b | variant_c | variant_d
  audio_url TEXT,
  script TEXT NOT NULL DEFAULT '',
  weight INTEGER NOT NULL DEFAULT 20, -- 0-100 distribution
  is_generated BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## 4. API Endpoints

| Method | Path | Descripción |
|--------|------|-------------|
| GET | `/api/campaigns` | List campaigns (tenant-scoped) |
| POST | `/api/campaigns` | Create campaign |
| GET | `/api/campaigns/:id` | Get campaign with variants |
| PUT | `/api/campaigns/:id` | Update campaign |
| DELETE | `/api/campaigns/:id` | Delete campaign (draft only) |
| PATCH | `/api/campaigns/:id/status` | Change status (activate/pause/complete) |
| POST | `/api/campaigns/:id/variants` | Add variant |
| PUT | `/api/campaigns/:id/variants/:vid` | Update variant (script, weight, audio) |
| DELETE | `/api/campaigns/:id/variants/:vid` | Remove variant |
| POST | `/api/campaigns/:id/generate` | AI generate variant scripts (Claude) |

## 5. Frontend Routes

| Route | Descripción |
|-------|-------------|
| `/campaigns` | Lista de campañas con filtros |
| `/campaigns/new` | Crear campaña + variantes |
| `/campaigns/:id` | Detalle + A/B testing editor |
| `/campaigns/:id/edit` | Editar campaña |

## 6. A/B Testing Logic

- Máximo 5 variantes por campaña (control + 4 variants)
- Weight distribution: suma debe ser 100
- Editor visual tipo ChatGPT para escribir ideas → IA genera scripts
- Vista previa de distribución en gráfico de torta

## 7. Acceptance Criteria

- [ ] CRUD campañas completo con validación de fechas
- [ ] Hasta 5 variantes por campaña con weight distribution
- [ ] Cambio de estado: draft → active → paused → completed
- [ ] Editor de scripts con textarea + AI generate placeholder
- [ ] Vista calendario con campañas activas
- [ ] Filtros por estado, tienda, fecha
- [ ] No permitir activar campaña sin al menos 1 variante con audio
