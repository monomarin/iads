# SPEC-19: Developer Portal

**Status**: Draft | **Priority**: Medium | **Dependencies**: SPEC-01

## 1. Descripción

Portal para desarrolladores con gestión de API keys, webhooks salientes, logs de uso y documentación interactiva.

## 2. DB Schema

```sql
CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL,
  permissions JSONB DEFAULT '["read"]',
  last_used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  url TEXT NOT NULL,
  events TEXT[] DEFAULT '{}',
  secret TEXT,
  is_active BOOLEAN DEFAULT true,
  last_triggered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## 3. API

| Method | Path | Descripción |
|--------|------|-------------|
| GET | `/api/developer/keys` | Listar API keys |
| POST | `/api/developer/keys` | Crear API key |
| PUT | `/api/developer/keys/:id` | Actualizar key |
| DELETE | `/api/developer/keys/:id` | Revocar key |
| GET | `/api/developer/webhooks` | Listar webhooks |
| POST | `/api/developer/webhooks` | Crear webhook |
| PUT | `/api/developer/webhooks/:id` | Actualizar webhook |
| DELETE | `/api/developer/webhooks/:id` | Eliminar webhook |
| POST | `/api/developer/webhooks/:id/test` | Test webhook |

## 4. Frontend

| Route | Descripción |
|-------|-------------|
| `/developer` | API Keys dashboard |
| `/developer/webhooks` | Webhook management |
