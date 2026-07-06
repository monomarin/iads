# SPEC-07: De-provisioning

**Status**: Draft | **Priority**: Medium | **Dependencies**: SPEC-00, SPEC-01

## 1. Descripción

Sistema de desaprovisionamiento progresivo: al solicitar baja, el tenant pasa por
3 fases con notificaciones antes de la eliminación total.

## 2. Timeline

| Día | Evento | Acción |
|-----|--------|--------|
| **Day 1** | Suspend | `is_active = false`, desactiva syncs + reproducción |
| **Day 7** | Grace notice | Email recordatorio: "7 días para reactivar" |
| **Day 30** | Warning | Email: "7 días para eliminación total" |
| **Day 37** | Delete | Eliminar tenant, stores, users, campaigns, audio, etc. |

## 3. Database Changes

```sql
-- Add to tenants table
ALTER TABLE tenants ADD COLUMN suspended_at TIMESTAMPTZ;
ALTER TABLE tenants ADD COLUMN deletion_scheduled_at TIMESTAMPTZ;
ALTER TABLE tenants ADD COLUMN deprovision_step TEXT DEFAULT 'active';
  -- active | suspended | grace | warning | deleting | deleted
ALTER TABLE tenants ADD COLUMN deprovision_notified_at TIMESTAMPTZ;
```

## 4. API Endpoints

| Method | Path | Descripción |
|--------|------|-------------|
| POST | `/api/tenants/suspend` | Iniciar desaprovisionamiento |
| POST | `/api/tenants/reactivate` | Reactivar tenant suspendido |
| GET | `/api/tenants/deprovision-status` | Estado del proceso |
| GET | `/api/admin/deprovision-queue` | Lista tenants en proceso |

## 5. Cron Worker (BullMQ)

- Corre diariamente (cron: `0 8 * * *`)
- Busca tenants con `deprovision_step != 'active'`
- Evalúa días transcurridos desde `suspended_at`
- Avanza al siguiente step si corresponde
- Envía emails en cada transición

## 6. Frontend Routes

| Route | Descripción |
|-------|-------------|
| `/settings/deprovision` | Estado + botón de suspender/reactivar |
| `/admin/deprovision-queue` | Lista de tenants en proceso (admin) |

## 7. Acceptance Criteria

- [ ] Suspend desactiva tenant inmediatamente
- [ ] Reactivar dentro de grace period restaura todo
- [ ] Eliminación total a los 37 días
- [ ] Notificaciones email en cada hito
- [ ] Admin puede ver cola de desaprovisionamiento
