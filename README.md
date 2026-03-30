# ComerCia by REINPIA

Plataforma SaaS multitenant para landing, ecommerce, growth comercial y operacion comercial.

## Stack
- `backend/`: FastAPI + SQLAlchemy + Alembic + JWT + Stripe
- `frontend/`: React + Vite + TypeScript
- `docs/`: arquitectura y modulos
- `infra/`: base Docker local

## Arranque local

### Arranque unificado (1 comando)
Desde la raiz:
```bash
start_all.bat
```
o
```bash
powershell -ExecutionPolicy Bypass -File .\start_all.ps1
```

Si falta `backend/.venv`, puedes habilitar bootstrap opcional:
```bash
start_all.bat --bootstrap
```
o
```bash
powershell -ExecutionPolicy Bypass -File .\start_all.ps1 -Bootstrap
```
o por variable:
```bash
set COMERCIA_BOOTSTRAP=1
start_all.bat
```

Alternativa Node (raiz):
```bash
npm install
npm run dev:all
```

Scripts por servicio:
- `start_backend_only.bat` / `start_backend_only.ps1`
- `start_frontend_only.bat` / `start_frontend_only.ps1`

Prerequisito backend:
- debe existir `backend/.venv` con dependencias instaladas.
- los scripts no recrean la venv automaticamente.

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

Modo de datos (env `DATA_MODE`):
- `demo`: carga dataset demo multi-tenant completo
- `app`: limpia demo y deja base minima tecnica
- `none`: no ejecuta seed automatico en startup

### Frontend
```bash
cd frontend
npm install
npm run dev
```

- Admin: `http://localhost:5173`
- Landing ComerCia: `http://localhost:5173/comercia`
- Storefront: `http://localhost:5173/store/{tenantSlug}`
- Panel global REINPIA (solo reinpia_admin):
  - `http://localhost:5173/reinpia/dashboard`
  - `http://localhost:5173/reinpia/tenants`
  - `http://localhost:5173/reinpia/payments`
  - `http://localhost:5173/reinpia/operations`
  - `http://localhost:5173/reinpia/reports`
  - `http://localhost:5173/reinpia/reports/overview`
  - `http://localhost:5173/reinpia/reports/growth`
  - `http://localhost:5173/reinpia/reports/commissions`
  - `http://localhost:5173/reinpia/reports/leads`
  - `http://localhost:5173/reinpia/reports/marketing-opportunities`
  - `http://localhost:5173/reinpia/commission-agents`
  - `http://localhost:5173/reinpia/alerts`
  - `http://localhost:5173/reinpia/security`
  - `http://localhost:5173/reinpia/security/alerts`
  - `http://localhost:5173/reinpia/security/rules`
  - `http://localhost:5173/reinpia/security/blocked`
- Onboarding:
  - `http://localhost:5173/onboarding/sales`
  - `http://localhost:5173/onboarding/client`
- Monedas:
  - `http://localhost:5173/admin/currency`
- POS:
  - `http://localhost:5173/pos`
  - `http://localhost:5173/pos/locations`
  - `http://localhost:5173/pos/sales`
  - `http://localhost:5173/pos/customers`
- Reportes tenant:
  - `http://localhost:5173/admin/reports`
  - `http://localhost:5173/admin/reports/sales`
  - `http://localhost:5173/admin/reports/products`
  - `http://localhost:5173/admin/reports/loyalty`
  - `http://localhost:5173/admin/reports/distributors`
  - `http://localhost:5173/admin/reports/logistics`
  - `http://localhost:5173/admin/reports/services`
  - `http://localhost:5173/admin/reports/marketing`
- Automation base:
  - `http://localhost:5173/admin/automation`

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

### Panel Global REINPIA (actual)
- KPIs globales consolidados multi-tenant
- ventas, comisiones y netos por tenant
- top tenants y series temporales de ordenes
- distribucion por plan y tipo de negocio
- operaciones consolidadas:
  - citas
  - logistica
  - distribuidores
- exportables CSV:
  - `/api/v1/reinpia/exports/sales.csv`
  - `/api/v1/reinpia/exports/commissions.csv`
  - `/api/v1/reinpia/exports/tenants.csv`
  - `/api/v1/reinpia/exports/orders.csv`
  - `/api/v1/reinpia/exports/commission-agents.csv`
  - `/api/v1/reinpia/exports/plan-purchase-leads.csv`
- seguridad por rol:
  - backend protegido por `reinpia_admin`
  - frontend oculto para roles no autorizados

### Reportes e insights (actual)
- reportes tenant (`/api/v1/reports/tenant/{tenant_id}/*`):
  - overview, users, sales, memberships, loyalty
  - products (top-selling, low-selling, unsold)
  - distributors, logistics, services
  - marketing-insights
- reportes REINPIA global:
  - `/api/v1/reinpia/reports/overview`
  - `/api/v1/reinpia/reports/tenants-growth`
  - `/api/v1/reinpia/reports/commissions`
  - `/api/v1/reinpia/reports/leads`
  - `/api/v1/reinpia/reports/marketing-opportunities`
  - `/api/v1/reinpia/reports/commercial-summary`
- periodos soportados:
  - `day`, `week`, `fortnight`, `month`, `quarter`, `half_year`, `year`, `custom`
- exports tenant:
  - `users.csv`, `sales.csv`, `products.csv`, `loyalty.csv`, `distributors.csv`, `logistics.csv`, `services.csv`, `marketing-insights.csv`
- insights de marketing:
  - producto mas vendido/menos vendido/sin ventas
  - categoria fuerte/debil
  - cupon efectivo
  - baja recompra
  - canal distribuidor activo/inactivo
  - servicio mas reservado y cancelaciones

### Onboarding (actual)
- guias y pasos persistidos en backend:
  - `GET /api/v1/onboarding/guides`
  - `GET /api/v1/onboarding/guides/{id}`
  - `GET /api/v1/onboarding/progress/me`
  - `POST /api/v1/onboarding/progress/step-complete`
- flujos visuales:
  - onboarding ventas (`/onboarding/sales`)
  - onboarding cliente (`/onboarding/client`)
- progreso por usuario en `UserOnboardingProgress`

### Workflow guiado de marca (nuevo)
- rutas globales ComerCia:
  - `/reinpia/brands/new`
  - `/reinpia/brands/{id}/setup`
- backend:
  - `GET/PUT /api/v1/brand-setup/{tenant_id}`
  - `POST /api/v1/brand-setup/{tenant_id}/assets`
  - `GET/PUT /api/v1/brand-setup/{tenant_id}/channel-settings`
- usa `StorefrontConfig.config_json` para guardar:
  - estado por etapa (aprobado, en revisión, rehacer)
  - assets cargados desde archivo local
  - configuración NFC / Mercado Pago / MFA TOTP por marca

### Operación de catálogo y feedback (nuevo)
- Carga masiva visible: `/admin/catalog/bulk-upload`
- Inventario operativo base: `/admin/inventory`
- Retroalimentación moderable: `/admin/feedback`

### i18n (actual)
- base bilingue ES/EN con `i18next + react-i18next`
- selector de idioma visible en:
  - admin
  - landing COMERCIA
  - storefront
- preferencia persistida en `localStorage` y campo `User.preferred_language`

### Monedas y tipo de cambio (actual)
- modelos:
  - `CurrencySettings`
  - `ExchangeRate`
- endpoints:
  - `GET/POST/PUT /api/v1/currency-settings/{tenant_id}`
  - `GET /api/v1/exchange-rates`
  - `POST /api/v1/exchange-rates/manual`
  - `POST /api/v1/exchange-rates/refresh`
  - `POST /api/v1/exchange-rates/preview`
- soporte de modo manual y automatico (fallback local adapter)
- storefront con selector de moneda y aviso de fallback de checkout

### POS / WebApp base (actual)
- modelos:
  - `PosLocation`, `PosEmployee`, `PosSale`, `PosSaleItem`, `PosMembershipRegistration`
- endpoints:
  - `/api/v1/pos/locations/*`
  - `/api/v1/pos/employees/*`
  - `/api/v1/pos/sales/*`
  - `/api/v1/pos/customers/*`
- frontend:
  - `/pos`, `/pos/locations`, `/pos/sales`, `/pos/customers`
- fidelizacion en POS:
  - consume y suma puntos cuando aplica
  - permite registro base de membresia desde venta POS

### Automation base para bots/WhatsApp futuro
- modelos:
  - `BotChannelConfig`
  - `BotMessageTemplate`
  - `AutomationEventLog`
- endpoints:
  - `/api/v1/automation/events`
  - `/api/v1/automation/channels`
  - `/api/v1/automation/templates`
- eventos base registrados:
  - `new_plan_lead`
  - `appointment_created`
  - `order_paid`
  - `logistics_delivered`
  - `followup_required`

### Comisionistas y alertas internas (actual)
- comisionistas comerciales (`SalesCommissionAgent`) con clave unica
- trazabilidad de referidos (`SalesReferral`) por codigo manual o query param `?ref=`
- captura de compra de plan COMERCIA (`PlanPurchaseLead`) con:
  - empresa, contacto, plan seleccionado, estado de compra y flags de seguimiento
- alertas internas (`InternalAlert`) para:
  - venta con comisionista
  - venta directa
  - compra de plan
  - seguimiento comercial
  - aviso para contador
- endpoints REINPIA:
  - `/api/v1/reinpia/commission-agents*`
  - `/api/v1/reinpia/referrals*`
  - `/api/v1/reinpia/plan-purchase-leads*`
  - `/api/v1/reinpia/alerts*`
- endpoint publico para landing ComerCia:
  - `POST /api/v1/comercia/plan-purchase-leads`
  - `GET /api/v1/comercia/referral/{code}`

### Centinela seguridad / antifraude (actual)
- modelos:
  - `SecurityEvent`
  - `SecurityRule`
  - `SecurityAlert`
  - `RiskScore`
  - `BlockedEntity`
- endpoints:
  - `GET /api/v1/security/events`
  - `GET /api/v1/security/alerts`
  - `PUT /api/v1/security/alerts/{id}/read`
  - `GET /api/v1/security/rules`
  - `PUT /api/v1/security/rules/{id}`
  - `POST /api/v1/security/rules/{id}/toggle`
  - `GET /api/v1/security/blocked-entities`
  - `POST /api/v1/security/blocked-entities`
  - `PUT /api/v1/security/blocked-entities/{id}/unblock`
  - `GET /api/v1/security/kpis`
- reglas iniciales sembradas:
  - `LOGIN_FAIL_5_IN_10`
  - `FAILED_PAYMENTS_3_IN_15`
  - `COUPON_ABUSE_10_IN_30`
  - `REFERRAL_ABUSE_8_IN_30`
  - `ADMIN_ACTION_SPIKE`
  - `WEBHOOK_FAILURE_REPEAT`
- integraciones reales:
  - login fallido/exitoso
  - fallos de pago por webhook Stripe
  - validacion fallida de cupon
  - validacion fallida de referral/comisionista
  - falla de verificacion de webhook
  - alerta base por actividad POS inusual
- paneles frontend:
  - `/reinpia/security`
  - `/reinpia/security/alerts`
  - `/reinpia/security/rules`
  - `/reinpia/security/blocked`
- limitaciones MVP:
  - no reemplaza un SIEM/WAF/IDS dedicado
  - no integra bloqueo de red real ni proveedores antifraude externos
  - enfocado a monitoreo operativo, scoring base y respuesta inicial interna

### Landings comerciales (actual)
- Landing corporativa ComerCia:
  - ruta: `/comercia`
  - enfoque: captacion de leads, paquetes IMPULSA / ESCALA, widget placeholder "Lia de ComerCia"
  - formulario de lead comercial con:
    - `company_name`, `legal_type`, `buyer_name`, `buyer_email`, `buyer_phone`
    - `selected_plan_code`, `referral_code`, `needs_followup`, `needs_appointment`, `notes`
  - autollenado de clave de comisionista por query param `?ref=`
- comportamiento de rutas clave:
  - `/` (sin sesion) redirige a `/comercia`
  - rutas protegidas como `/reinpia/*` redirigen a `/login` cuando no hay sesion
  - `/store/:tenantSlug` muestra fallback elegante si falla el fetch
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
## Modos de datos DEMO / APP limpia

Comandos backend:
```bash
cd backend
python -m app.db.seed_demo
python -m app.db.seed_app_base
python -m app.db.reset_demo
```

Scripts disponibles:
- `app.db.seed_demo`: genera data demo multi-tenant (idempotente)
- `app.db.seed_app_base`: deja base limpia minima para operacion real
- `app.db.reset_demo`: limpia data demo comercial de forma controlada

### Usuarios DEMO
- `admin@reinpia.demo` / `Admin12345!` (`reinpia_admin`)
- `admin@reinpia-tenant.demo` / `Admin12345!` (`tenant_admin`)
- `admin@natura.demo` / `Admin12345!` (`tenant_admin`)
- `admin@cafe.demo` / `Admin12345!` (`tenant_admin`)
- `distributor1@natura.demo` / `Admin12345!` (`distributor_user`)
- `distributor2@cafe.demo` / `Admin12345!` (`distributor_user`)

### Datos DEMO generados
- tenants: `reinpia`, `natura-vida`, `cafe-monte-alto` + tenant inactivo demo
- branding/storefront/banners por tenant
- servicios REINPIA + catalogos de productos para NATURA/CAFE
- loyalty, memberships, cupones, reviews, wishlist
- distribuidores, solicitudes, citas, recurrentes y logistica
- ordenes paid/failed con comisiones (incluye casos PLAN_2)
- comisionistas demo + plan purchase leads con y sin comisionista
- alertas internas para seguimiento comercial/contable

## Validacion ejecutada
- backend: `python -m compileall app`
- migraciones: `alembic upgrade head`
- frontend: `npm run build`

Verificacion puntual storefront REINPIA:
- `cd backend`
- `python -m app.db.verify_reinpia_storefront`
- valida seed + payload de `/api/v1/storefront/reinpia/home-data` sin levantar servidor largo.

## Documentacion
- [docs/architecture.md](docs/architecture.md)
- [docs/modules.md](docs/modules.md)
- [CHECKLIST_COMERCIA.md](CHECKLIST_COMERCIA.md)
