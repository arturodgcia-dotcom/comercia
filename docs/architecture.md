# Arquitectura COMERCIA by REINPIA

## 1) Vision
COMERCIA es una plataforma SaaS multitenant para marcas de productos, servicios o modelos mixtos.

Base actual habilitada:
- Admin SaaS con autenticacion JWT.
- Gestion de tenants y branding por marca.
- Landing generator logico por configuracion (sin clonado fisico de codigo).
- Catalogo ecommerce multitenant aislado por `tenant_id`.
- Storefront publico por slug de tenant.

## 2) Estructura del monorepo
- `backend/`: FastAPI, SQLAlchemy, Alembic, JWT.
- `frontend/`: React + Vite + TypeScript.
- `docs/`: arquitectura y estado modular.
- `infra/`: Dockerfiles y docker compose local.

## 3) Multitenancy
- Aislamiento logico por columna `tenant_id` en entidades de negocio.
- `Tenant` como raiz de marca/empresa.
- `TenantBranding` para identidad visual y datos de contacto por tenant.
- `StorefrontConfig` y `Banner` para configuracion de landing/ecommerce por tenant.
- Endpoints de catalogo filtrados por tenant (`by-tenant`).

## 4) Backend (FastAPI)
- Swagger: `/docs`
- Healthcheck: `GET /health`
- Versionado: `/api/v1`

### 4.1 Autenticacion
- Login con JWT: `POST /api/v1/auth/login`
- Usuario actual: `GET /api/v1/auth/me`
- Roles base:
  - `reinpia_admin`
  - `tenant_admin`
  - `tenant_staff`
  - `distributor_user`

### 4.2 Tenants y storefront
- CRUD base tenant:
  - `GET /api/v1/tenants`
  - `POST /api/v1/tenants`
  - `GET /api/v1/tenants/{tenant_id}`
  - `PUT /api/v1/tenants/{tenant_id}`
- Inicializacion logica storefront:
  - `POST /api/v1/tenants/{tenant_id}/initialize-storefront`
  - `GET /api/v1/tenants/{tenant_id}/storefront-config`

Inicializacion logica (idempotente):
- Branding default
- Configuracion landing base
- Configuracion ecommerce base
- Banner placeholder inicial

### 4.3 Branding por tenant
- `GET /api/v1/tenant-branding/{tenant_id}`
- `POST /api/v1/tenant-branding/{tenant_id}`
- `PUT /api/v1/tenant-branding/{tenant_id}`

Campos base:
- `primary_color`
- `secondary_color`
- `logo_url`
- `hero_title`
- `hero_subtitle`
- `contact_whatsapp`
- `contact_email`

### 4.4 Catalogo multitenant
Categorias:
- `POST /api/v1/categories`
- `PUT /api/v1/categories/{id}`
- `GET /api/v1/categories/by-tenant/{tenant_id}`

Productos:
- `POST /api/v1/products`
- `PUT /api/v1/products/{id}`
- `GET /api/v1/products/by-tenant/{tenant_id}`

Se valida aislamiento tenant-categoria-producto.

### 4.5 Storefront publico
- `GET /api/v1/storefront/{tenant_slug}`
- `GET /api/v1/storefront/{tenant_slug}/distribuidores`

## 5) Modelos de dominio
- Tenant
- User
- TenantBranding
- StorefrontConfig
- Banner
- Plan
- Subscription
- StripeConfig
- Category
- Product
- Customer
- Distributor
- LoyaltyRule
- Appointment
- Notification
- CommissionRule

Modelos clave con audit timestamps (`created_at`, `updated_at`).

## 6) Persistencia y migraciones
- SQLAlchemy declarativo.
- Alembic con revisiones:
  - `20260327_01` esquema base.
  - `20260327_02` auth + storefront.
- Local con SQLite.
- Cambio a PostgreSQL via `DATABASE_URL`.

## 7) Frontend
### 7.1 Admin shell
- Login + guard de rutas.
- Páginas:
  - Tenants list
  - Tenant detail
  - Branding editor
  - Categories list
  - Products list
  - Plans

### 7.2 Storefront
- `/store/:tenantSlug`
- `/store/:tenantSlug/distribuidores`

Secciones base:
- Hero
- Banner principal placeholder
- Categorias
- Productos destacados
- Productos recientes
- Bloque promocion placeholder

## 8) Proximos pasos recomendados
- RBAC por endpoint (dependencias por rol).
- Resolver tenant por subdominio/header para storefront y admin tenant.
- Paginacion/filtros avanzados en catalogo.
- Integracion Stripe operativa (checkout/webhooks).
- Observabilidad y auditoria transaccional.
