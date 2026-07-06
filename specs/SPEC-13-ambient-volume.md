# SPEC-13: Ambient Volume Controller

**Status**: Draft | **Priority**: High | **Dependencies**: SPEC-04, SPEC-09

## 1. Descripción

Módulo en el Android APK que ajusta el volumen de salida basado en ruido ambiente captado por el micrófono.

## 2. Mapeo Ruido → Volumen

| Ambiente | dB | Volumen | Contexto |
|----------|----|---------|----------|
| Silencioso | <40 dB | 40% | Tienda vacía |
| Normal | 40–65 dB | 70% | Afluencia normal |
| Lleno | >65 dB | 100% | Tienda concurrida |

Transiciones con fade de 3 segundos. Horario nocturno (23:00–07:00): cap al 50%.

## 3. DB Schema

```sql
ALTER TABLE edge_nodes ADD COLUMN ambient_config JSONB DEFAULT '{}';
-- { enabled: boolean, thresholds: [40,65], night_cap: 50, manual_override_until: timestamp }
```

## 4. API Endpoints

| Method | Path | Descripción |
|--------|------|-------------|
| GET | `/api/edge-nodes/:id/ambient-config` | Obtener config |
| PUT | `/api/edge-nodes/:id/ambient-config` | Actualizar config |
| POST | `/api/edge-nodes/:id/ambient-telemetry` | Reportar telemetría hora |

## 5. Frontend

| Route | Descripción |
|-------|-------------|
| `/settings/edge-nodes/:id/ambient` | Configurar thresholds, night cap, override |

## 6. Mobile Service

- Cada 5s: `AudioRecord` mide amplitud → calcula dB
- Aplica mapeo + fade + night cap + manual override
- Envía telemetría cada hora (avg volume, avg ambient)
