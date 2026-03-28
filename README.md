# COMERCIA by REINPIA

Plataforma SaaS multitenant para landing, ecommerce, fidelizacion, distribuidores, servicios y pagos con Stripe, preparada para evolucionar a WebApp POS.

## Monorepo

- `backend/`: FastAPI + SQLAlchemy + Alembic + JWT + Stripe.
- `frontend/`: React + Vite + TypeScript (admin shell + storefront + checkout).
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

Credenciales seed:
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

## Endpoints de pagos Stripe

Configuracion Stripe por tenant:
- `GET /api/v1/stripe-config`
- `POST /api/v1/stripe-config`

Checkout:
- `POST /api/v1/checkout/create-session`

Webhook:
- `POST /api/v1/stripe/webhook`

Dashboard admin pagos:
- `GET /api/v1/payments/dashboard`

## Regla de comision PLAN_2

Implementada por item en `backend/app/services/commission_service.py`:
- si `precio <= 2000` -> `2.5%`
- si `precio > 2000` -> `3%`

## Flujo Plan 1 / Plan 2

- PLAN_1 (`fixed`): checkout sin comision.
- PLAN_2 (`commission`): checkout con `application_fee_amount` + `transfer_data[destination]` usando `stripe_account_id` del tenant.

## Frontend de pagos

Storefront:
- carrito base
- boton `Comprar`
- llamada a checkout backend
- redireccion a Stripe Checkout

Admin:
- `/admin/payments`
- total vendido
- comision generada
- neto al comercio
- listado de ordenes

## Documentacion

- [docs/architecture.md](docs/architecture.md)
- [docs/modules.md](docs/modules.md)
- [CHECKLIST_COMERCIA.md](CHECKLIST_COMERCIA.md)
