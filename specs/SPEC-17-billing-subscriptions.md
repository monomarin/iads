# SPEC-17: Billing & Subscriptions

**Status**: Draft | **Priority**: High | **Dependencies**: SPEC-01

## 1. Descripción

Sistema de facturación con planes, Stripe checkout, métricas de uso, facturas e historial de pagos.

## 2. DB Schema

```sql
CREATE TABLE subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  price NUMERIC NOT NULL,
  max_stores INTEGER DEFAULT 1,
  max_plays INTEGER DEFAULT 10000,
  features JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true
);

CREATE TABLE tenant_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  plan_id UUID REFERENCES subscription_plans,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  status TEXT DEFAULT 'active',
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  stripe_invoice_id TEXT,
  amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'usd',
  status TEXT DEFAULT 'pending',
  paid_at TIMESTAMPTZ,
  pdf_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## 3. API

| Method | Path | Descripción |
|--------|------|-------------|
| GET | `/api/billing/plans` | Listar planes |
| POST | `/api/billing/checkout` | Crear sesión Stripe checkout |
| GET | `/api/billing/current` | Suscripción actual |
| PUT | `/api/billing/cancel` | Cancelar suscripción |
| GET | `/api/billing/invoices` | Historial de facturas |
| POST | `/api/billing/webhook` | Stripe webhook |

## 4. Frontend

| Route | Descripción |
|-------|-------------|
| `/billing` | Página de planes |
| `/billing/subscription` | Detalle suscripción actual |
| `/billing/invoices` | Historial de facturas |
