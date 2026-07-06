# SPEC-06: Human-in-the-Loop (Bandeja de Aprobación)

**Status**: Draft | **Priority**: High | **Dependencies**: SPEC-00, SPEC-01, SPEC-02, SPEC-03, SPEC-04

## 1. Descripción

Sistema de aprobación HITL donde acciones críticas requieren revisión humana antes de ejecutarse.
Usuarios con rol `super_admin` o `approver` pueden aprobar/rechazar desde una bandeja central.

## 2. Acciones que Requieren Aprobación

| Acción | Recurso | Gatillador |
|--------|---------|------------|
| Activar campaña | Campaign | POST /campaigns/:id/status → active |
| Publicar playlist | Playlist | PUT /playlists/:id (is_active → true) |
| Forzar sync | Sync | POST /sync/trigger |
| Subir audio | Audio | POST /audio/upload |
| Cambiar schedule | Sync Schedule | PUT /sync/schedule |
| Enviar comando edge | Edge Node | POST /edge-nodes/:id/push |

## 3. Database Schema

```sql
CREATE TABLE approval_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  requested_by UUID NOT NULL REFERENCES users(id),
  action TEXT NOT NULL,                      -- activate_campaign | publish_playlist | force_sync | upload_audio | change_schedule | edge_command
  target_type TEXT NOT NULL,                 -- campaign | playlist | sync | audio | schedule | edge_node
  target_id TEXT NOT NULL,                   -- UUID of the target resource
  payload JSONB DEFAULT '{}',                -- snapshot of what was requested
  status TEXT DEFAULT 'pending',             -- pending | approved | rejected
  reviewed_by UUID REFERENCES users(id),
  review_comment TEXT,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE approval_audit (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  approval_id UUID NOT NULL REFERENCES approval_requests(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  performed_by UUID NOT NULL REFERENCES users(id),
  previous_status TEXT,
  new_status TEXT,
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## 4. API Endpoints

| Method | Path | Descripción |
|--------|------|-------------|
| GET | `/api/approvals` | Listar solicitudes (filtro por status) |
| GET | `/api/approvals/:id` | Detalle de solicitud |
| POST | `/api/approvals` | Crear solicitud de aprobación |
| POST | `/api/approvals/:id/approve` | Aprobar solicitud |
| POST | `/api/approvals/:id/reject` | Rechazar solicitud |
| GET | `/api/approvals/stats` | Estadísticas (pending/approved/rejected) |

## 5. Frontend Routes

| Route | Descripción |
|-------|-------------|
| `/approvals` | Bandeja de aprobación con filtros |
| `/approvals/:id` | Detalle de solicitud |

## 6. Flujo

1. Usuario realiza acción que requiere aprobación → no se ejecuta directo
2. Sistema crea `approval_request` con status `pending`
3. Usuario ve mensaje "Esta acción requiere aprobación"
4. Approver ve solicitud en `/approvals`
5. Approver revisa detalle (payload snapshot) y aprueba/rechaza
6. Si aprueba → se ejecuta la acción real + audit log
7. Si rechaza → se registra rechazo + audit log
8. Usuario original recibe notificación del resultado

## 7. Acceptance Criteria

- [ ] Solicitudes de aprobación se crean para acciones configurables
- [ ] Bandeja muestra pending/approved/rejected con filtros
- [ ] Approver puede ver payload snapshot antes de decidir
- [ ] Al aprobar, la acción real se ejecuta automáticamente
- [ ] Audit trail de todas las decisiones
- [ ] Solo usuarios con rol super_admin/approver pueden aprobar/rechazar
- [ ] Notificación al solicitante del resultado
