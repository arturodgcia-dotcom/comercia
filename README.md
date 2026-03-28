# COMERCIA by REINPIA

Plataforma SaaS multitenant para landing, ecommerce, growth comercial y operacion comercial.

## Stack
- `backend/`: FastAPI + SQLAlchemy + Alembic + JWT + Stripe
- `frontend/`: React + Vite + TypeScript
- `docs/`: arquitectura y modulos
- `infra/`: base Docker local

## Arranque local

### Backend
```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

- Swagger: `http://localhost:8000/docs`
- Health: `http://localhost:8000/health`

Credenciales seed:
- `admin@reinpia.com`
- `admin123`

### Frontend
```bash
cd frontend
npm install
npm run dev
```

- Admin: `http://localhost:5173`
- Landing COMERCIA: `http://localhost:5173/comercia`
- Storefront: `http://localhost:5173/store/{tenantSlug}`

## Bloques funcionales implementados

### Core comercial
- auth JWT (`/api/v1/auth/login`, `/api/v1/auth/me`)
- tenants + branding + storefront config
- catalogo multitenant (categorias/productos)

### Pagos Stripe
- checkout Plan 1 y Plan 2
- comision dinamica por item (2.5% / 3%)
- webhook para estados y post-procesos

### Growth comercial
- fidelizacion, cupones, memberships
- banners dinamicos
- wishlist y reviews con moderacion
- upsell/cross-sell base

### Operacion comercial (actual)
- servicios y agenda:
  - `/api/v1/services/*`
  - `/api/v1/appointments/*`
- compra de servicios para si o como regalo (checkout extendido)
- distribuidores por marca:
  - `/api/v1/distributors/*`
- contratos digitales base:
  - `/api/v1/contracts/*`
- pedidos recurrentes:
  - `/api/v1/recurring-orders/*`
- logistica base:
  - `/api/v1/logistics/*`

### Landings comerciales (actual)
- Landing corporativa COMERCIA:
  - ruta: `/comercia`
  - enfoque: captacion de leads, paquetes IMPULSA / ESCALA, widget placeholder "Lia de COMERCIA"
- Landing tenant REINPIA:
  - ruta: `/store/reinpia`
  - enfoque: venta de servicios, canal agencias/distribuidores, widget placeholder "SofIA by REINPIA"
- Componentes visuales reutilizables:
  - `HeroSection`
  - `SolutionCard`
  - `PackageCard`
  - `CTASection`
  - `AgentWidgetPlaceholder`
  - `AudienceSplitSection`

## Frontend agregado (actual)

### Admin
- `/admin/services`
- `/admin/appointments`
- `/admin/distributor-applications`
- `/admin/distributors`
- `/admin/contracts`
- `/admin/recurring-orders`
- `/admin/logistics`

### Storefront
- `/store/:tenantSlug/services`
- `/store/:tenantSlug/service/:serviceId`
- `/store/:tenantSlug/distribuidores/registro`
- `/store/:tenantSlug/distribuidores/login-placeholder`
- `/store/reinpia` con layout comercial orientado a servicios

## Seed demo REINPIA
En `init_db` se deja seed idempotente para:
- tenant `REINPIA` (`slug=reinpia`)
- branding inicial REINPIA
- banners comerciales base
- categoria de servicios
- servicios demo:
  - Implementacion COMERCIA
  - Renta de plataforma COMERCIA
  - Automatizacion comercial con IA
  - Implementacion NERVIA
  - Implementacion SprintPilot
  - Desarrollo a la medida

## Validacion ejecutada
- backend: `python -m compileall app`
- migraciones: `alembic upgrade head`
- frontend: `npm run build`

## Documentacion
- [docs/architecture.md](docs/architecture.md)
- [docs/modules.md](docs/modules.md)
- [CHECKLIST_COMERCIA.md](CHECKLIST_COMERCIA.md)
