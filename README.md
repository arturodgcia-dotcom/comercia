# COMERCIA by REINPIA

Plataforma SaaS multitenant para landing, ecommerce, fidelizacion, distribuidores, servicios, pagos con Stripe y evolucion a WebApp POS.

## Monorepo

- `backend/`: FastAPI + SQLAlchemy + Alembic.
- `frontend/`: React + Vite + TypeScript.
- `docs/`: arquitectura y estado de modulos.
- `infra/`: Docker base para entorno local.

## Requisitos

- Python 3.11+
- Node.js 20+
- npm 10+

## Variables de entorno

1. Backend:
   - Copiar `backend/.env.example` a `backend/.env`
2. Frontend:
   - Copiar `frontend/.env.example` a `frontend/.env`

Opcionalmente puedes usar `.env.example` en la raiz como referencia global.

## Arranque local - Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Endpoints clave:
- `GET /health`
- `GET|POST /api/v1/tenants`
- `GET /api/v1/plans`
- `GET|POST /api/v1/stripe-config`
- `GET|POST /api/v1/categories`
- `GET|POST /api/v1/products`

Swagger:
- `http://localhost:8000/docs`

## Arranque local - Frontend

```bash
cd frontend
npm install
npm run dev
```

Panel:
- `http://localhost:5173`

## Docker local

```bash
cd infra/docker
docker compose up --build
```

Servicios:
- Backend: `http://localhost:8000`
- Frontend: `http://localhost:5173`

## Base multitenant y dominio inicial

Modelos iniciales incluidos:
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

Todos los modelos de negocio relevantes incluyen `tenant_id`.

## Planes comerciales preconfigurados

- `PLAN_1`:
  - Mes 1 y 2: 25000 + IVA
  - Mes 3 en adelante: 45000 + IVA
- `PLAN_2`:
  - 2.5% sobre venta entre 0 y 2000
  - 3.0% sobre venta mayor a 2000

## Documentacion

- [docs/architecture.md](docs/architecture.md)
- [docs/modules.md](docs/modules.md)
- [CHECKLIST_COMERCIA.md](CHECKLIST_COMERCIA.md)
