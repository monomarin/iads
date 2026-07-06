# SPEC-20: Integrations Hub

**Status**: Draft | **Priority**: Medium | **Dependencies**: SPEC-19

## 1. Descripción

Hub de integraciones con servicios externos: Slack, Discord, Google Analytics, Resend (email), Stripe y Zapier.

## 2. DB Schema

```sql
CREATE TABLE integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  provider TEXT NOT NULL,
  label TEXT,
  config JSONB DEFAULT '{}',
  is_enabled BOOLEAN DEFAULT false,
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE integration_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID NOT NULL,
  event TEXT NOT NULL,
  status TEXT DEFAULT 'success',
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## 3. API

| Method | Path | Descripción |
|--------|------|-------------|
| GET | `/api/integrations` | Listar integraciones |
| POST | `/api/integrations/:provider/connect` | Conectar proveedor |
| POST | `/api/integrations/:id/disconnect` | Desconectar |
| PUT | `/api/integrations/:id` | Actualizar configuración |
| GET | `/api/integrations/:id/logs` | Historial de actividad |

## 4. Frontend

| Route | Descripción |
|-------|-------------|
| `/integrations` | Hub de integraciones |
