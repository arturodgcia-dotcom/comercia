# Arquitectura COMERCIA by REINPIA

## 1) Vision
COMERCIA es una plataforma SaaS multitenant orientada a marcas que venden productos, servicios o un modelo mixto. La arquitectura deja una base para:
- Landing generator por tenant.
- Ecommerce multitenant con catalogo y categorias.
- Fidelizacion y distribuidores.
- Agenda de servicios.
- Integracion de pagos con Stripe por tenant.
- Dashboard central de operacion REINPIA.
- Preparacion para WebApp POS futura.

## 2) Monorepo
- `backend/`: FastAPI + SQLAlchemy + Alembic.
- `frontend/`: React + Vite + TypeScript.
- `docs/`: arquitectura, modulos y evolucion.
- `infra/`: Dockerfiles y compose para local.

## 3) Multitenancy
- Patron de aislamiento logico por columna `tenant_id` en entidades de negocio.
- Entidad `Tenant` para marcas/empresas.
- Entidad `TenantBranding` para configuracion visual por tenant.
- `StripeConfig` por tenant para llaves de pago y control `is_reinpia_managed`.

## 4) Backend
- API base: `FastAPI` con Swagger en `/docs`.
- Healthcheck: `GET /health`.
- Versionado: rutas bajo `/api/v1`.
- Persistencia: SQLAlchemy declarativo.
- Migraciones: Alembic con revision inicial.
- Entorno local: SQLite por defecto.
- Entorno futuro: `DATABASE_URL` permite cambiar a PostgreSQL sin redisenar el dominio.

## 5) Dominio inicial modelado
- Tenant
- TenantBranding
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

## 6) Planes comerciales cargados en semilla
- Plan 1 (`PLAN_1`):
  - Mes 1 y 2: 25000 + IVA
  - Mes 3 en adelante: 45000 + IVA
- Plan 2 (`PLAN_2`):
  - 2.5% para importes de 0 a 2000
  - 3.0% para importes mayores a 2000

## 7) API inicial publicada
- `GET /health`
- `GET|POST /api/v1/tenants`
- `GET /api/v1/plans`
- `GET|POST /api/v1/stripe-config`
- `GET|POST /api/v1/products`
- `GET|POST /api/v1/categories`

## 8) Frontend administrativo inicial
- Shell de administracion con sidebar.
- Ruteo principal:
  - Dashboard
  - Tenants
  - Plans
  - Stripe Config
  - Categories
  - Products
- Consumo de API por `VITE_API_URL`.

## 9) Infraestructura local
- `infra/docker/backend.Dockerfile`
- `infra/docker/frontend.Dockerfile`
- `infra/docker/docker-compose.yml`

## 10) Evolucion sugerida siguiente
- Authn/Authz por tenant y por rol.
- Middleware de tenant resolver (subdominio/header).
- Paginacion y filtros por endpoints.
- Validaciones de unicidad por `(tenant_id, slug)` en catalogos.
- Modo PostgreSQL + Redis + colas.
