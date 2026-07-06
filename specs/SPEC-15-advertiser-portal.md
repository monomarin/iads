# SPEC-15: Portal de Anunciantes Self-Service

**Status**: Draft | **Priority**: High | **Dependencies**: SPEC-02, SPEC-06, SPEC-14

## 1. Descripción

Portal separado para marcas anunciantes con flujo completo: registro → creatividad → targeting → presupuesto → aprobación → dashboard.

## 2. Flujo de 7 Pasos

1. Registro de marca
2. Generación de creatividad (subir mp3 o texto-a-voz)
3. Targeting de tiendas en mapa interactivo
4. Configuración (fechas, dayparting, frequency cap, presupuesto, CPM)
5. Estimación de alcance
6. Aprobación de tienda (HITL multi-nivel)
7. Dashboard en vivo

## 3. DB Schema

```sql
CREATE TABLE ad_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  advertiser_id UUID NOT NULL,
  name TEXT NOT NULL,
  status TEXT DEFAULT 'draft',
  audio_url TEXT,
  script TEXT,
  target_segments JSONB DEFAULT '[]',
  schedule JSONB DEFAULT '{}',
  budget NUMERIC DEFAULT 0,
  cpm NUMERIC DEFAULT 10,
  spent NUMERIC DEFAULT 0,
  plays_total INTEGER DEFAULT 0,
  dayparting JSONB DEFAULT '{}',
  frequency_cap INTEGER DEFAULT 2,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## 4. API

| Method | Path | Descripción |
|--------|------|-------------|
| POST | `/api/advertisers/register` | Registrar marca |
| POST | `/api/advertisers/campaigns` | Crear campaña |
| GET | `/api/advertisers/campaigns` | Listar campañas |
| GET | `/api/advertisers/campaigns/:id` | Detalle |
| GET | `/api/advertisers/campaigns/:id/estimate` | Proyección alcance/costo |
| GET | `/api/advertisers/campaigns/:id/live` | Métricas en vivo |
| GET | `/api/advertisers/campaigns/:id/proof-of-play` | PDF firmado |
| PUT | `/api/advertisers/campaigns/:id` | Actualizar campaña |

## 5. Frontend

| Route | Descripción |
|-------|-------------|
| `/advertiser/register` | Registro de marca |
| `/advertiser/campaigns` | Lista de campañas |
| `/advertiser/campaigns/new` | Create (7-step wizard) |
| `/advertiser/campaigns/:id` | Dashboard en vivo |
