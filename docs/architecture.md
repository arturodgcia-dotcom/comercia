# Arquitectura COMERCIA by REINPIA

## 1) Vision
COMERCIA es una plataforma SaaS multitenant para productos/servicios con operaciones de cobro centralizadas en Stripe.

Esta iteracion incorpora el flujo de dinero completo para Plan 1 y Plan 2:
- configuracion Stripe por tenant
- checkout
- comision dinamica por item
- webhook
- dashboard de pagos
- base para Stripe Connect

## 2) Flujo de dinero

### PLAN_1 (fixed)
1. Cliente crea carrito en storefront.
2. Backend crea `Order` sin comision.
3. Stripe Checkout procesa pago total.
4. Webhook marca orden como `paid`.

### PLAN_2 (commission)
1. Cliente crea carrito en storefront.
2. Backend calcula comision por item (2.5% o 3%).
3. Guarda `Order`, `OrderItem` y `CommissionDetail`.
4. Crea Checkout con:
   - `application_fee_amount` = comision total
   - `transfer_data[destination]` = `stripe_account_id` del tenant
5. Webhook actualiza estado (`paid`/`failed`) y montos finales.

## 3) Backend pagos

Modelos agregados/extensiones:
- `StripeConfig` (+ `stripe_account_id`)
- `Order`
- `OrderItem`
- `CommissionDetail`
- `Plan` (+ `commission_enabled`)
- `Tenant` (+ `plan_id`)

Servicios:
- `commission_service.py`
- `stripe_service.py`
- `email_service.py` (base)

Endpoints:
- `POST /api/v1/checkout/create-session`
- `POST /api/v1/stripe/webhook`
- `GET /api/v1/payments/dashboard`

## 4) Regla de comision

`compute_order_commission(order_items)` en `commission_service.py`:
- por item, no por total global
- `unit_price <= 2000` => `LOW_2_5`
- `unit_price > 2000` => `HIGH_3`
- retorno:
  - `total_commission`
  - `details` por item

## 5) Frontend pagos

Storefront (`/store/:tenantSlug`):
- seleccion de productos
- carrito base
- boton `Comprar`
- redireccion a Stripe

Admin (`/admin/payments`):
- orders
- total vendido
- comision generada
- neto al comercio

## 6) Persistencia y migraciones

Revisiones Alembic:
- `20260327_01` esquema base
- `20260327_02` auth/storefront
- `20260328_03` pagos base y extensiones Stripe/Plan/Tenant

## 7) Validacion tecnica ejecutada
- backend compila (`python -m compileall app`)
- frontend build ok (`npm run build`)
