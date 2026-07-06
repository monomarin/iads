# SPEC-14: Brand Safety Automático

**Status**: Draft | **Priority**: High | **Dependencies**: SPEC-02, SPEC-03

## 1. Descripción

Pipeline de verificación de 5 capas que corre sobre cada audio generado antes de marcarlo como PENDING_REVIEW.

## 2. Capas de Verificación

| Capa | Herramienta | Qué verifica |
|------|------------|--------------|
| 1 | Whisper | Transcripción coincide con guion aprobado |
| 2 | Blacklist | Palabras prohibidas + variantes |
| 3 | Clasificador | Tono en contexto del Soul.md (score 0–100) |
| 4 | Bias | Sesgo de género, etnia, edad, clase |
| 5 | Legal | Reglas por país (COFEPRIS, FTC, etc.) |

## 3. DB Schema

```sql
CREATE TABLE brand_safety_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  variant_id UUID NOT NULL REFERENCES audio_variants(id),
  status TEXT DEFAULT 'pending',
  score INTEGER,
  layers JSONB DEFAULT '[]',
  summary TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE brand_safety_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  country TEXT NOT NULL,
  rules JSONB DEFAULT '[]'
);
```

## 4. API

| Method | Path | Descripción |
|--------|------|-------------|
| POST | `/api/brand-safety/check` | Ejecutar auditoría completa |
| GET | `/api/brand-safety/logs` | Historial de auditorías |
| GET | `/api/brand-safety/rules` | Reglas por país |
| PUT | `/api/brand-safety/rules` | Actualizar reglas |

## 5. Frontend

| Route | Descripción |
|-------|-------------|
| `/brand-safety` | Dashboard con logs y resultados |
