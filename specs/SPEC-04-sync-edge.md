# SPEC-04: Sync Nocturna + Edge Node APK

**Status**: Draft | **Priority**: High | **Dependencies**: SPEC-00, SPEC-01, SPEC-03

## 1. Descripción

Sistema de sincronización nocturna (sync) basado en BullMQ con cola de trabajos programados,
notificaciones push FCM para comandos urgentes, y Edge Node APK para reproducción Bluetooth.

## 2. Stack

| Capa | Tecnología |
|------|-----------|
| Queue | BullMQ + Redis |
| Scheduler | Cron jobs configurables (global + per-store) |
| Push | Firebase Cloud Messaging (FCM) |
| Edge | React Native + Expo (Bluetooth A2DP + LE) |
| Almacén | PostgreSQL (sync_logs, edge_nodes) |

## 3. Database Schema

```sql
CREATE TABLE edge_nodes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  device_token TEXT,                          -- FCM token
  platform TEXT DEFAULT 'android',            -- android / ios
  fcm_token TEXT,                             -- push notification token
  last_seen_at TIMESTAMPTZ,
  firmware_version TEXT,
  settings JSONB DEFAULT '{}',               -- Bluetooth config, volume, etc.
  is_online BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE sync_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending',     -- pending | running | success | failed
  type TEXT NOT NULL DEFAULT 'scheduled',     -- scheduled | manual | urgent
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  items_synced INTEGER DEFAULT 0,
  items_failed INTEGER DEFAULT 0,
  error_log TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE sync_schedule (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  cron_expression TEXT NOT NULL DEFAULT '0 2 * * *',
  timezone TEXT DEFAULT 'UTC',
  is_active BOOLEAN DEFAULT TRUE,
  override_global BOOLEAN DEFAULT FALSE,      -- TRUE = per-store override
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(store_id)
);
```

## 4. API Endpoints

| Method | Path | Descripción |
|--------|------|-------------|
| GET | `/api/sync/status` | Último sync por tienda |
| POST | `/api/sync/trigger` | Forzar sync manual |
| GET | `/api/sync/logs` | Historial de syncs |
| GET | `/api/sync/schedule` | Schedule global + por tienda |
| PUT | `/api/sync/schedule` | Actualizar schedule |
| GET | `/api/edge-nodes` | Listar edge nodes |
| POST | `/api/edge-nodes/register` | Registrar edge node |
| PUT | `/api/edge-nodes/:id` | Actualizar edge node |
| POST | `/api/edge-nodes/:id/push` | Enviar push FCM |

## 5. Sync Flow

1. **Cron global** (ej: `0 2 * * *` = 2 AM) dispara BullMQ job
2. Job itera por tiendas activas con schedule configurado
3. Por cada tienda: descargar audio actualizado de R2 → cache local
4. Log resultado en `sync_logs`
5. Si error → retry 3 veces con backoff exponencial
6. Notificar push FCM si sync falla

## 6. Edge Node APK (Bluetooth)

- Conexión Bluetooth A2DP para streaming de audio
- Bluetooth LE para comandos (play, pause, skip, volume)
- Recepción de push FCM para comandos urgentes
- Heartbeat cada 30s para reportar online status
- Cache local de audio para reproducción offline

## 7. Frontend Routes

| Route | Descripción |
|-------|-------------|
| `/sync` | Dashboard de sync + historial |
| `/sync/schedule` | Configurar schedule global + por tienda |
| `/settings/edge-nodes` | Lista de edge nodes + estado |
| `/settings/edge-nodes/:id` | Detalle de edge node |

## 8. Acceptance Criteria

- [ ] BullMQ worker procesa sync jobs programados
- [ ] Global schedule configurable, per-store override funcional
- [ ] Sync manual desde dashboard
- [ ] Historial de syncs con estado + errores
- [ ] FCM push enviado en sync fallido
- [ ] Edge Node se registra y reporta heartbeat
- [ ] Comando push (play/pause) se envía a edge node
