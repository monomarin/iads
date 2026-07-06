# SPEC-05: Reportes

**Status**: Draft | **Priority**: High | **Dependencies**: SPEC-00, SPEC-01, SPEC-02, SPEC-03, SPEC-04

## 1. Descripción

Sistema de reportes con 4 plantillas predefinidas (CEO, Técnico, StoreAdmin, Anunciante)
editables por el usuario. Generación on-demand + programada con exportación PDF/CSV.

## 2. Plantillas Predefinidas

| Plantilla | Audiencia | Widgets |
|-----------|-----------|---------|
| **CEO** | Directivos | Total plays, campañas activas, revenue, stores online, gráfico tendencia semanal |
| **Técnico** | IT/Soporte | Sync status, uptime edge nodes, errores últimos 7d, almacenamiento usado |
| **StoreAdmin** | Gerentes tienda | Plays por hora, compliance playlist, schedule adherence, top tracks |
| **Anunciante** | Clientes anunciantes | Impresiones campaña, reach, resultados A/B,ROI estimado |

## 3. Database Schema

```sql
CREATE TABLE report_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'custom',   -- ceo | technical | store_admin | advertiser | custom
  config JSONB NOT NULL DEFAULT '{}',         -- { sections: [{ title, type, metric, chart, period }] }
  is_builtin BOOLEAN DEFAULT FALSE,           -- builtin templates cannot be deleted
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE report_instances (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES report_templates(id) ON DELETE CASCADE,
  store_id UUID REFERENCES stores(id) ON DELETE SET NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  data JSONB NOT NULL DEFAULT '{}',           -- cached report data
  status TEXT DEFAULT 'generating',           -- generating | ready | failed
  format TEXT DEFAULT 'json',                 -- json | pdf | csv
  generated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## 4. API Endpoints

| Method | Path | Descripción |
|--------|------|-------------|
| GET | `/api/reports/templates` | Listar plantillas |
| POST | `/api/reports/templates` | Crear plantilla |
| GET | `/api/reports/templates/:id` | Obtener plantilla |
| PUT | `/api/reports/templates/:id` | Editar plantilla |
| DELETE | `/api/reports/templates/:id` | Eliminar plantilla (solo custom) |
| POST | `/api/reports/generate` | Generar reporte desde plantilla |
| GET | `/api/reports/instances` | Listar reportes generados |
| GET | `/api/reports/instances/:id` | Obtener reporte con datos |
| GET | `/api/reports/instances/:id/export` | Exportar reporte (pdf/csv) |

## 5. Tipos de Widget / Chart

```typescript
type WidgetType = "number" | "bar" | "line" | "pie" | "table";
type MetricType = "total_plays" | "active_campaigns" | "revenue" | "stores_online"
  | "sync_success_rate" | "edge_uptime" | "error_count" | "storage_used"
  | "plays_per_hour" | "compliance_rate" | "top_tracks" | "impressions"
  | "ab_test_results" | "roi";
```

## 6. Frontend Routes

| Route | Descripción |
|-------|-------------|
| `/reports` | Dashboard de reportes |
| `/reports/templates` | Lista de plantillas |
| `/reports/templates/:id/edit` | Editor de plantilla |
| `/reports/instances/:id` | Ver reporte generado |

## 7. Acceptance Criteria

- [ ] 4 plantillas builtin precargadas al crear tenant
- [ ] Usuario puede editar secciones y widgets de cualquier plantilla
- [ ] Generación de reporte on-demand con datos reales
- [ ] Vista de reporte con charts (bar, line, pie, number)
- [ ] Exportación a PDF y CSV
- [ ] Lista de reportes generados con filtro por tipo/fecha
