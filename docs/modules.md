# Modulos COMERCIA - Estado Actual

| Modulo | Estado | Implementacion actual |
|---|---|---|
| Autenticacion y usuarios | Inicial funcional | JWT login/me, modelo `User`, roles base |
| Tenants / Marcas | Inicial funcional | CRUD base + inicializacion storefront |
| Branding por tenant | Inicial funcional | Modelo y endpoints GET/POST/PUT |
| Landing generator logico | Inicial funcional | `StorefrontConfig` + `Banner` + servicio de inicializacion |
| Ecommerce multitenant | Inicial funcional | CRUD categorias/productos + filtros por tenant |
| Storefront publico | Inicial funcional | `/storefront/{slug}` y `/distribuidores` |
| Stripe por tenant | Base inicial | Modelo y endpoint base (`stripe-config`) |
| Planes comerciales | Inicial funcional | Seed `PLAN_1` y `PLAN_2` |
| Suscripciones | Base de dominio | Modelo `Subscription` |
| Clientes publicos | Base de dominio | Modelo `Customer` |
| Distribuidores | Inicial funcional | Modelo + consumo publico por slug |
| Servicios / Agenda | Base de dominio | Modelo `Appointment` |
| Fidelizacion | Base de dominio | Modelo `LoyaltyRule` |
| Logistica | Base de arquitectura | Pendiente implementacion funcional |
| Bots / Agentes | Base de arquitectura | Pendiente implementacion funcional |
| Dashboard central REINPIA | Inicial funcional | Admin dashboard base |
| Notificaciones | Base de dominio | Modelo `Notification` |
| Comisiones | Base de dominio | Modelo `CommissionRule` |

## Endpoints clave actuales
- `GET /health`
- `POST /api/v1/auth/login`
- `GET /api/v1/auth/me`
- `GET|POST /api/v1/tenants`
- `GET|PUT /api/v1/tenants/{tenant_id}`
- `POST /api/v1/tenants/{tenant_id}/initialize-storefront`
- `GET /api/v1/tenants/{tenant_id}/storefront-config`
- `GET|POST|PUT /api/v1/tenant-branding/{tenant_id}`
- `GET /api/v1/categories/by-tenant/{tenant_id}`
- `POST /api/v1/categories`
- `PUT /api/v1/categories/{id}`
- `GET /api/v1/products/by-tenant/{tenant_id}`
- `POST /api/v1/products`
- `PUT /api/v1/products/{id}`
- `GET /api/v1/storefront/{tenant_slug}`
- `GET /api/v1/storefront/{tenant_slug}/distribuidores`

## Estado de calidad actual
- Backend compila (`python -m compileall app`)
- Frontend build ok (`npm run build`)
- Migraciones Alembic actualizadas a `20260327_02`
