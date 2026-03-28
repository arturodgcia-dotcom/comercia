# Modulos COMERCIA - Estado Actual

| Modulo | Estado | Implementacion actual |
|---|---|---|
| Autenticacion y usuarios | Inicial funcional | JWT login/me, modelo `User`, roles base |
| Tenants / Marcas | Inicial funcional | CRUD base + inicializacion storefront + `plan_id` |
| Branding por tenant | Inicial funcional | Modelo y endpoints GET/POST/PUT |
| Landing generator logico | Inicial funcional | `StorefrontConfig` + `Banner` + servicio de inicializacion |
| Ecommerce multitenant | Inicial funcional | CRUD categorias/productos + filtros por tenant |
| Storefront publico | Inicial funcional | `/storefront/{slug}` y `/distribuidores` + carrito base |
| Stripe por tenant | Inicial funcional | `stripe_account_id` + endpoint config |
| Checkout Stripe | Inicial funcional | `POST /checkout/create-session` (Plan1/Plan2) |
| Comisiones dinamicas | Inicial funcional | Servicio por item 2.5%/3% + `CommissionDetail` |
| Webhooks Stripe | Inicial funcional | `POST /stripe/webhook` con actualizacion de orden |
| Dashboard pagos admin | Inicial funcional | `GET /payments/dashboard` + frontend `/admin/payments` |
| Planes comerciales | Inicial funcional | PLAN_1 fixed / PLAN_2 commission (`commission_enabled`) |
| Suscripciones | Base de dominio | Modelo `Subscription` |
| Clientes publicos | Base de dominio | Modelo `Customer` |
| Distribuidores | Inicial funcional | Modelo + consumo publico por slug |
| Servicios / Agenda | Base de dominio | Modelo `Appointment` |
| Fidelizacion | Base de dominio | Modelo `LoyaltyRule` |
| Logistica | Base de arquitectura | Pendiente implementacion funcional |
| Bots / Agentes | Base de arquitectura | Pendiente implementacion funcional |
| Dashboard central REINPIA | Inicial funcional | Admin dashboard base |
| Notificaciones | Base de dominio | Modelo `Notification` |

## Endpoints pagos clave
- `POST /api/v1/checkout/create-session`
- `POST /api/v1/stripe/webhook`
- `GET /api/v1/payments/dashboard`

## Estado de calidad actual
- Backend compila (`python -m compileall app`)
- Frontend build ok (`npm run build`)
- Migraciones Alembic hasta `20260328_03`
