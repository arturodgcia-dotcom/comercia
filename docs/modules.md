# Modulos COMERCIA - Estado Inicial

| Modulo | Estado | Base en esta ejecucion |
|---|---|---|
| Tenants / Marcas | Inicial | Modelo `Tenant`, endpoint `/api/v1/tenants` |
| Branding por tenant | Inicial | Modelo `TenantBranding` |
| Landing Generator | Base de arquitectura | Referenciado en dashboard y docs |
| Ecommerce multitenant | Inicial | Modelos `Category` y `Product`, endpoints API |
| Stripe por tenant | Inicial | Modelo `StripeConfig`, endpoint `/api/v1/stripe-config` |
| Planes comerciales | Inicial | Modelo `Plan`, semilla `PLAN_1` y `PLAN_2` |
| Suscripciones | Inicial | Modelo `Subscription` |
| Clientes publicos | Inicial | Modelo `Customer` |
| Distribuidores | Inicial | Modelo `Distributor` |
| Servicios / Agenda | Inicial | Modelo `Appointment` |
| Fidelizacion | Inicial | Modelo `LoyaltyRule` |
| Logistica | Base de arquitectura | Preparado para implementacion iterativa |
| Bots / Agentes | Base de arquitectura | Preparado para integracion iterativa |
| Dashboard central REINPIA | Inicial | Pantalla `Dashboard` en frontend |
| Notificaciones | Inicial | Modelo `Notification` |
| Comisiones | Inicial | Modelo `CommissionRule` |

## Endpoints operativos iniciales
- `GET /health`
- `GET|POST /api/v1/tenants`
- `GET /api/v1/plans`
- `GET|POST /api/v1/stripe-config`
- `GET|POST /api/v1/categories`
- `GET|POST /api/v1/products`

## Notas
- Todos los modulos de negocio que aplican multitenancy incluyen `tenant_id`.
- El repositorio queda preparado para evolucionar a PostgreSQL mediante `DATABASE_URL`.
