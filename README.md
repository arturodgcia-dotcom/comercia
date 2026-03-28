# COMERCIA by REINPIA

Plataforma SaaS multitenant para landing, ecommerce, fidelizacion, distribuidores, servicios y pagos con Stripe, preparada para evolucionar a WebApp POS.

## Monorepo

- `backend/`: FastAPI + SQLAlchemy + Alembic + JWT auth.
- `frontend/`: React + Vite + TypeScript (admin shell + storefront).
- `docs/`: arquitectura y estado de modulos.
- `infra/`: Docker base local.

## Requisitos

- Python 3.11+
- Node.js 20+
- npm 10+

## Variables de entorno

1. Backend:
   - Copiar `backend/.env.example` a `backend/.env`
2. Frontend:
   - Copiar `frontend/.env.example` a `frontend/.env`

## Arranque local - Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Swagger:
- `http://localhost:8000/docs`

Credenciales iniciales seed:
- email: `admin@reinpia.com`
- password: `admin123`

## Arranque local - Frontend

```bash
cd frontend
npm install
npm run dev
```

- Admin: `http://localhost:5173`
- Storefront por tenant: `http://localhost:5173/store/{tenantSlug}`

## Docker local

```bash
cd infra/docker
docker compose up --build
```

Servicios:
- Backend: `http://localhost:8000`
- Frontend: `http://localhost:5173`

## Endpoints backend principales

Salud:
- `GET /health`

Auth:
- `POST /api/v1/auth/login`
- `GET /api/v1/auth/me`

Tenants:
- `GET /api/v1/tenants`
- `POST /api/v1/tenants`
- `GET /api/v1/tenants/{tenant_id}`
- `PUT /api/v1/tenants/{tenant_id}`
- `POST /api/v1/tenants/{tenant_id}/initialize-storefront`
- `GET /api/v1/tenants/{tenant_id}/storefront-config`

Branding:
- `GET /api/v1/tenant-branding/{tenant_id}`
- `POST /api/v1/tenant-branding/{tenant_id}`
- `PUT /api/v1/tenant-branding/{tenant_id}`

Catalogo:
- `GET /api/v1/categories/by-tenant/{tenant_id}`
- `POST /api/v1/categories`
- `PUT /api/v1/categories/{id}`
- `GET /api/v1/products/by-tenant/{tenant_id}`
- `POST /api/v1/products`
- `PUT /api/v1/products/{id}`

Storefront publico:
- `GET /api/v1/storefront/{tenant_slug}`
- `GET /api/v1/storefront/{tenant_slug}/distribuidores`

## Modelos base actuales

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

Todos los modelos de negocio relevantes incluyen `tenant_id`.

## Documentacion

- [docs/architecture.md](docs/architecture.md)
- [docs/modules.md](docs/modules.md)
- [CHECKLIST_COMERCIA.md](CHECKLIST_COMERCIA.md)
