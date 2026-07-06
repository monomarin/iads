# SPEC-18: Notifications & Alerts

**Status**: Draft | **Priority**: High | **Dependencies**: SPEC-01

## 1. Descripción

Sistema de notificaciones in-app, email y push con preferencias configurables y centro de notificaciones.

## 2. DB Schema

```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  user_id UUID,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  is_read BOOLEAN DEFAULT false,
  channel TEXT DEFAULT 'in_app',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  channel TEXT NOT NULL,
  enabled BOOLEAN DEFAULT true,
  types TEXT[] DEFAULT '{}'
);
```

## 3. API

| Method | Path | Descripción |
|--------|------|-------------|
| GET | `/api/notifications` | Listar notificaciones |
| PUT | `/api/notifications/:id/read` | Marcar como leída |
| PUT | `/api/notifications/read-all` | Marcar todas leídas |
| GET | `/api/notifications/unread-count` | Contador no leídas |
| GET | `/api/notifications/preferences` | Preferencias |
| PUT | `/api/notifications/preferences` | Actualizar preferencias |

## 4. Frontend

| Route | Descripción |
|-------|-------------|
| `/notifications` | Centro de notificaciones |
