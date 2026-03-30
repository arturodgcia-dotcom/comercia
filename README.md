# ComerCia by REINPIA

Plataforma SaaS multitenant para landing, ecommerce, growth comercial y operacion comercial.

## Stack
- `backend/`: FastAPI + SQLAlchemy + Alembic + JWT + Stripe + Mercado Pago (POS base)
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
Modo bootstrap automatico:
```bash
npm run dev:all:bootstrap
```

Bootstrap local de entorno (tipo SprintPilot):
```bash
powershell -ExecutionPolicy Bypass -File .\bootstrap_local.ps1
```
Hace:
- crea `backend/.venv` si falta
- instala requirements backend (incluye `python-multipart`)
- instala dependencias frontend si faltan
- deja el entorno listo para `start_all`

Scripts por servicio:
- `start_backend_only.bat` / `start_backend_only.ps1`
- `start_frontend_only.bat` / `start_frontend_only.ps1`

Prerequisito backend:
- debe existir `backend/.venv` con dependencias instaladas.
- los scripts no recrean la venv automaticamente.
- excepcion: si usas `-Bootstrap` o `COMERCIA_BOOTSTRAP=1`, se intenta bootstrap automatico.

Mensajes de arranque y troubleshooting:
- si falta `backend/.venv`, los scripts muestran comandos exactos para prepararlo.
- si falta `python-multipart`, backend lo reporta con instruccion clara (o lo instala en modo bootstrap).
- si un puerto esta ocupado, los scripts detectan el conflicto y levantan en el siguiente puerto disponible.
- `start_all` imprime URLs utiles reales para backend/frontend.

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
  - `http://localhost:5173/reinpia/logistics-services`
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
- Configuracion de pagos por canal:
  - `http://localhost:5173/admin/settings/payments/stripe`
  - `http://localhost:5173/admin/settings/payments/mercadopago`
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

### WebApp instalable (PWA) orientada a POS
- La app incluye `manifest.webmanifest` + `service worker` para instalación en celular.
- `start_url` configurada: `/pos`.
- Flujo:
  - si hay sesión activa, abre POS directo.
  - si no hay sesión, `ProtectedRoute` redirige a `/login` y luego vuelve a POS.
- Componentes de ayuda/instalación:
  - botón “Instalar WebApp” en login y POS.
  - ayuda para Android/iOS sobre “Agregar a pantalla de inicio”.
- Íconos base incluidos en `frontend/public/icons`:
  - `icon-192.png`
  - `icon-512.png`
  - `apple-touch-icon.png`
- Caché offline básico:
  - shell estático, manifest e íconos.
  - no reemplaza operación online de negocio (API/checkout requieren conexión).

## Bloques funcionales implementados

### Core comercial
- auth JWT (`/api/v1/auth/login`, `/api/v1/auth/me`)
- tenants + branding + storefront config
- catalogo multitenant (categorias/productos)

### Arquitectura de pagos por canal
- Stripe (online):
  - ecommerce publico y distribuidores
  - checkout online
  - suscripciones y planes
  - plan 2 con comision dinamica por item (2.5% / 3%)
- Mercado Pago (POS/WebApp):
  - link de pago
  - QR de cobro
  - base para Point (placeholder)
- NFC:
  - identificacion y credenciales (opcional)
  - no se usa para cobrar tarjetas bancarias

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
  - preview por etapa (landing, ecommerce público, ecommerce distribuidores, POS)
  - acciones de regeneración y rehacer antes de publicar

### Operación de catálogo y feedback (nuevo)
- Carga masiva visible: `/admin/catalog/bulk-upload`
- Inventario operativo base: `/admin/inventory`
- Retroalimentación moderable: `/admin/feedback`
- Mejoras actuales:
  - carga masiva con validación de columnas, errores por fila y resumen de importación
  - inventario con vista por canal (público, distribuidor, POS) y movimientos rápidos
  - feedback con filtros por estado/canal y acciones aprobar/rechazar

### Experiencia premium de marca (nuevo)
- Storefront público renovado con bloques comerciales:
  - hero, beneficios, categorías, destacados, promociones, nuevos y más vendidos
- Canal distribuidores separado y orientado a negocio:
  - beneficios comerciales, reglas de volumen y catálogo mayorista
- Dashboard de marca reorganizado por módulos con navegación más clara:
  - Inicio, Comercial, Catálogo, Clientes, Operación, POS, Reportes, Configuración
  - incluye botón volver + breadcrumbs en la barra superior

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
  - `/api/v1/pos/payments/mercadopago/link`
  - `/api/v1/pos/payments/mercadopago/qr`
  - `/api/v1/pos/payments/mercadopago/confirm`
  - `/api/v1/pos/payments/by-tenant/{tenant_id}`
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
  - enfoque: captacion de leads, paquetes IMPULSA / ESCALA y narrativa 100% comercial (sin copy tecnico interno)
  - Lia funciona como agente comercial conversacional para recomendar plan y llevar al diagnostico
  - formulario de lead comercial con:
    - `company_name`, `legal_type`, `buyer_name`, `buyer_email`, `buyer_phone`
    - `selected_plan_code`, `referral_code`, `needs_followup`, `needs_appointment`, `notes`
  - autollenado de clave de comisionista por query param `?ref=`
  - servicios adicionales visibles:
    - logistica personalizada
    - membresias y credenciales inteligentes (QR + NFC opcional)
    - cobros digitales desde celular para POS (Mercado Pago)
  - precios mostrados solo de activacion:
    - activacion NFC: 500 MXN
    - activacion cobros digitales POS: 500 MXN
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

### Servicios logisticos adicionales globales (nuevo)
- Modulo global para registrar servicios logisticos brindados por ComerCia a marcas:
  - tipo de servicio (recoleccion, entrega, ambos, resguardo)
  - costo, IVA, total, estatus y fecha de servicio
  - resumen para control operativo y facturacion a la marca
- Endpoints:
  - `GET /api/v1/reinpia/logistics-services`
  - `POST /api/v1/reinpia/logistics-services`
  - `GET /api/v1/reinpia/logistics-services/{id}`
  - `PUT /api/v1/reinpia/logistics-services/{id}`
  - `GET /api/v1/reinpia/logistics-services-summary`

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
- `superadmin@comercia.demo` / `Admin12345!` (`reinpia_admin`)
- `comercial.global@comercia.demo` / `Admin12345!` (`reinpia_admin`)
- `logistica.global@comercia.demo` / `Admin12345!` (`reinpia_admin`)
- `marketing.global@comercia.demo` / `Admin12345!` (`reinpia_admin`)
- `admin@reinpia-tenant.demo` / `Admin12345!` (`tenant_admin`)
- `admin.marca@reinpia.demo` / `Admin12345!` (`tenant_admin`)
- `catalogo.marca@reinpia.demo` / `Admin12345!` (`tenant_staff`)
- `logistica.marca@reinpia.demo` / `Admin12345!` (`tenant_staff`)
- `pos.marca@reinpia.demo` / `Admin12345!` (`tenant_staff`)
- `admin@natura.demo` / `Admin12345!` (`tenant_admin`)
- `admin@cafe.demo` / `Admin12345!` (`tenant_admin`)
- `distributor1@natura.demo` / `Admin12345!` (`distributor_user`)
- `distributor2@cafe.demo` / `Admin12345!` (`distributor_user`)
- `admin@distribuidor.demo` / `Admin12345!` (`distributor_user`)
- `vendedor@distribuidor.demo` / `Admin12345!` (`distributor_user`)
- `cliente.final@publico.demo` / `Admin12345!` (`public_customer`)

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
