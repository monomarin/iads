# SPEC-16: Dashboard Avanzado con Analytics

**Status**: Draft | **Priority**: High | **Dependencies**: SPEC-02, SPEC-03, SPEC-05

## 1. Descripción

Dashboard central con KPIs globales, analytics por tienda, tendencias temporales, mapas de calor y exportación.

## 2. DB Schema

```sql
CREATE TABLE analytics_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  store_id UUID,
  date DATE NOT NULL,
  total_plays INTEGER DEFAULT 0,
  unique_listeners INTEGER DEFAULT 0,
  avg_listen_duration_sec INTEGER DEFAULT 0,
  campaign_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## 3. API

| Method | Path | Descripción |
|--------|------|-------------|
| GET | `/api/analytics/overview` | KPIs globales (plays, stores, engagement, revenue) |
| GET | `/api/analytics/daily` | Datos diarios con filtro fechas |
| GET | `/api/analytics/stores` | Ranking de tiendas |
| GET | `/api/analytics/heatmap` | Mapa de calor por hora/día |
| GET | `/api/analytics/campaigns` | Performance por campaña |
| GET | `/api/analytics/export` | Export CSV |

## 4. Frontend

| Route | Descripción |
|-------|-------------|
| `/dashboard` | Dashboard principal con KPIs |
| `/dashboard/analytics` | Analytics detallado con gráficos |
| `/dashboard/stores` | Performance por tienda |
