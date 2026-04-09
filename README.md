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
- `start_all` pasa automaticamente la URL real del backend al frontend (`VITE_API_URL`) para evitar `Failed to fetch` cuando el backend usa puerto alterno.
- CORS backend acepta puertos locales dinamicos (`localhost` / `127.0.0.1`) para desarrollo estable.
- Puerto por defecto recomendado en local:
  - backend: `8000`
  - frontend (`VITE_API_URL`): `http://127.0.0.1:8000`

### Backend
```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

- Swagger: `http://127.0.0.1:8000/docs`
- Health: `http://127.0.0.1:8000/health`

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

- Admin: `http://localhost:5175`
- Landing ComerCia: `http://localhost:5175/comercia`
- Storefront: `http://localhost:5175/store/{tenantSlug}`
- Panel global REINPIA (solo reinpia_admin):
  - `http://localhost:5175/reinpia/dashboard`
  - `http://localhost:5175/reinpia/tenants`
  - `http://localhost:5175/reinpia/payments`
  - `http://localhost:5175/reinpia/operations`
  - `http://localhost:5175/reinpia/logistics-services`
  - `http://localhost:5175/reinpia/reports`
  - `http://localhost:5175/reinpia/reports/overview`
  - `http://localhost:5175/reinpia/reports/growth`
  - `http://localhost:5175/reinpia/reports/commissions`
  - `http://localhost:5175/reinpia/reports/leads`
  - `http://localhost:5175/reinpia/reports/marketing-opportunities`
  - `http://localhost:5175/reinpia/commission-agents`
  - `http://localhost:5175/reinpia/alerts`
  - `http://localhost:5175/reinpia/security`
  - `http://localhost:5175/reinpia/security/alerts`
  - `http://localhost:5175/reinpia/security/rules`
  - `http://localhost:5175/reinpia/security/blocked`
- Onboarding:
  - `http://localhost:5175/onboarding/sales`
  - `http://localhost:5175/onboarding/client`
- Monedas:
  - `http://localhost:5175/admin/currency`
- Canales de marca (control tenant-aware):
  - `http://localhost:5175/admin/channels/landing`
  - `http://localhost:5175/admin/channels/public`
  - `http://localhost:5175/admin/channels/distributors`
  - `http://localhost:5175/admin/channels/pos`
  - `http://localhost:5175/admin/diagnostico-inteligente`
- Diagnosticos globales REINPIA:
  - `http://localhost:5175/reinpia/diagnosticos`
- Configuracion de pagos por canal:
  - `http://localhost:5175/admin/settings/payments/stripe`
  - `http://localhost:5175/admin/settings/payments/mercadopago`
- POS:
  - `http://localhost:5175/pos`
  - `http://localhost:5175/pos/locations`
  - `http://localhost:5175/pos/sales`
  - `http://localhost:5175/pos/customers`
- Reportes tenant:
  - `http://localhost:5175/admin/reports`
  - `http://localhost:5175/admin/reports/sales`
  - `http://localhost:5175/admin/reports/products`
  - `http://localhost:5175/admin/reports/loyalty`
  - `http://localhost:5175/admin/reports/distributors`
  - `http://localhost:5175/admin/reports/logistics`
  - `http://localhost:5175/admin/reports/services`
  - `http://localhost:5175/admin/reports/marketing`
- Automation base:
  - `http://localhost:5175/admin/automation`

### WebApp instalable (PWA) orientada a POS
- La app incluye `manifest.webmanifest` + `service worker` para instalaciÃ³n en celular.
- `start_url` configurada: `/pos`.
- Flujo:
  - si hay sesiÃ³n activa, abre POS directo.
  - si no hay sesiÃ³n, `ProtectedRoute` redirige a `/login` y luego vuelve a POS.
- Componentes de ayuda/instalaciÃ³n:
  - botÃ³n â€œInstalar WebAppâ€ en login y POS.
  - ayuda para Android/iOS sobre â€œAgregar a pantalla de inicioâ€.
- Ãconos base incluidos en `frontend/public/icons`:
  - `icon-192.png`
  - `icon-512.png`
  - `apple-touch-icon.png`
- CachÃ© offline bÃ¡sico:
  - shell estÃ¡tico, manifest e Ã­conos.
  - no reemplaza operaciÃ³n online de negocio (API/checkout requieren conexiÃ³n).

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

### Workflow guiado de marca (wizard SaaS)
- rutas globales ComerCia:
  - `/reinpia/brands/new`
  - `/reinpia/brands/{id}/setup`
- frontend:
  - `BrandSetupWizard` con pasos secuenciales bloqueados
  - progreso visible "Paso X de 6"
  - sin cards sueltas, cada paso en vista dedicada
- pasos obligatorios:
  1. Identidad de marca
  2. Contenido base (prompt + IA)
  3. Landing
  4. Ecommerce
  5. POS / WebApp
  6. Revision y publicacion
- backend:
  - `GET/PUT /api/v1/brand-setup/{tenant_id}`
  - `POST /api/v1/brand-setup/{tenant_id}/generate-content`
  - `POST /api/v1/brand-setup/{tenant_id}/generate-landing`
  - `POST /api/v1/brand-setup/{tenant_id}/steps/{step_code}/approve`
  - `POST /api/v1/brand-setup/{tenant_id}/assets`
  - `GET/PUT /api/v1/brand-setup/{tenant_id}/channel-settings`
- persistencia en `StorefrontConfig.config_json`:
  - `current_step`
  - estado de pasos (`pending`, `in_progress`, `approved`)
  - identidad de marca
  - contenido generado
  - landing draft
  - setup ecommerce
  - setup POS/WebApp
### OperaciÃ³n de catÃ¡logo y feedback (nuevo)
- Carga masiva visible: `/admin/catalog/bulk-upload`
- Inventario operativo base: `/admin/inventory`
- RetroalimentaciÃ³n moderable: `/admin/feedback`
- Mejoras actuales:
  - carga masiva con validaciÃ³n de columnas, errores por fila y resumen de importaciÃ³n
  - inventario con vista por canal (pÃºblico, distribuidor, POS) y movimientos rÃ¡pidos
  - feedback con filtros por estado/canal y acciones aprobar/rechazar

### Experiencia premium de marca (nuevo)
- Storefront pÃºblico renovado con bloques comerciales:
  - hero, beneficios, categorÃ­as, destacados, promociones, nuevos y mÃ¡s vendidos
- Canal distribuidores separado y orientado a negocio:
  - beneficios comerciales, reglas de volumen y catÃ¡logo mayorista
- Dashboard de marca reorganizado por mÃ³dulos con navegaciÃ³n mÃ¡s clara:
  - Inicio, Comercial, CatÃ¡logo, Clientes, OperaciÃ³n, POS, Reportes, ConfiguraciÃ³n
  - incluye botÃ³n volver + breadcrumbs en la barra superior

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
- pantalla admin de monedas robusta:
  - loading visible
  - estado vacio util si aun no hay tasas
  - error claro con boton de reintento
  - evita pantalla en blanco cuando backend no responde

### Conectividad API local (actualizado)
- Base URL frontend centralizada en `frontend/src/services/api.ts`.
- Se evita quedar atrapado en puertos efimeros guardados en runtime (ej. `8002`) que causaban errores de conexion en login y Monedas.
- Fallback local controlado:
  - prioridad `8000`
- Modulos que antes construian URL directa ahora usan helper central:
  - `BrandSetupWizard` (assets)
  - `ReinpiaReportsPage` (exportes)

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
  - posicionamiento digital reforzado: SEO + AEO + prompts integrados para mejorar descubrimiento y conversion
  - expansion comercial internacional: operacion desde Mexico con estructura para precios en pesos, dolares y euros
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

### Navegacion por contexto (nuevo)
- El panel administrativo se separa en dos contextos visibles:
  - `Administración General de ComerCia` (global plataforma)
  - `Panel de Operación de Marca` (operacion de una marca activa)
- `reinpia_admin` puede cambiar entre ambos contextos desde selector en sidebar:
  - contexto: `Global ComerCia` / `Marca activa`
  - marca activa: selector de tenant persistido en sesion
- `tenant_admin` y `tenant_staff` solo ven contexto de marca (sin menu global).
- Indicadores persistentes en interfaz:
  - `Modo actual: ...`
  - `Marca activa: ...`

### Canales de marca conectados a vistas reales (nuevo)
- Los modulos de marca `Landing`, `Ecommerce publico`, `Ecommerce distribuidores` y `POS / WebApp` ahora abren centros de control por tenant activo.
- Cada canal muestra estado de publicacion (`borrador`, `en revision`, `publicado`, `requiere ajustes`) y datos reales de la marca activa.
- Las acciones por canal permiten abrir vista real, preview, editar modulo relacionado y regenerar plantilla cuando el usuario es `reinpia_admin`.
- Cuando una marca tiene landing externa, se respeta la URL externa y se evita forzar una landing interna innecesaria.
- Si la URL externa es de demo/no desplegada (`.demo`, `.local`, `.invalid`), el panel muestra aviso y usa fallback interno.
- Ruta de landing interna tenant-aware:
  - `/store/:tenantSlug/landing`

### Diagnóstico inteligente (nuevo)
- Modulo independiente del wizard y de la generacion de canales.
- Objetivo: evaluar marca activa en tres ejes:
  - SEO
  - AEO
  - Identidad de marca
- Capacidades en una sola pantalla:
  - `Analizar marca activa` (interno por tenant)
  - `Analizar URL externa` (auditoria de landing/sitio externo con URL)
- Ruta de marca:
  - `/admin/diagnostico-inteligente`
- Ruta global base (listado):
  - `/reinpia/diagnosticos`
- Endpoints:
  - `POST /api/v1/brand-diagnostics/{tenant_id}/analyze`
  - `POST /api/v1/brand-diagnostics/analyze-external-url`
  - `GET /api/v1/brand-diagnostics/{tenant_id}/latest`
  - `GET /api/v1/brand-diagnostics/{tenant_id}/latest-external`
  - `GET /api/v1/brand-diagnostics/{tenant_id}`
  - `POST /api/v1/brand-diagnostics/{tenant_id}/improvement-plan`
  - `GET /api/v1/reinpia/diagnostics`
- Persistencia:
  - entidad `BrandDiagnostic` con scores, hallazgos, recomendaciones, resumen, plan de mejora y contexto analizado.
  - el contexto guarda `analysis_type` (`internal_brand` o `external_url`) y `source_url` cuando aplica.

### Monedas por contexto (actualizado)
- Global (`Administración General de ComerCia`):
  - menu: `Monedas y tipos de cambio`
  - enfoque: control global de monedas habilitadas y tipos de cambio.
- Marca (`Panel de Operación de Marca`):
  - menu: `Moneda de operación`
  - enfoque: moneda base y visualizacion de monedas por tienda/marca.

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
- `superadmin@comercia.demo` / `Demo1234!` (`reinpia_admin`)
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
- `admin@zaro.demo` / `Admin12345!` (`tenant_admin`)
- `distributor1@natura.demo` / `Admin12345!` (`distributor_user`)
- `distributor2@cafe.demo` / `Admin12345!` (`distributor_user`)
- `admin@distribuidor.demo` / `Admin12345!` (`distributor_user`)
- `vendedor@distribuidor.demo` / `Admin12345!` (`distributor_user`)
- `cliente.final@publico.demo` / `Admin12345!` (`public_customer`)

Permisos visibles esperados:
- `reinpia_admin`: panel global completo (`/reinpia/*`) + administracion de marca.
- `tenant_admin`: administracion de su marca (configuracion, pagos, reportes, onboarding, catalogo, operacion).
- `tenant_staff`: operacion diaria (catalogo, inventario, logistica, citas, distribuidores operativos, POS) sin vistas globales ni configuraciones sensibles.
- `distributor_user` y `public_customer`: sin acceso al admin interno; uso de rutas de storefront/canal correspondiente.

### Datos DEMO generados
- tenants: `reinpia`, `natura-vida`, `cafe-monte-alto`, `instituto-zaro-latino` + tenant inactivo demo
- branding/storefront/banners por tenant
- servicios REINPIA + catalogos de productos para NATURA/CAFE + marca educativa Instituto Zaro Latino
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

## Actualizacion ejecucion 24
- Reportes tenant: `reinpia_admin` ya puede seleccionar marca en lugar de depender de `tenant_id` asociado.
- Catalogo y carga masiva: productos con campos Stripe (`stripe_product_id`, `stripe_price_id_public`, `stripe_price_id_retail`, `stripe_price_id_wholesale`) y layout CSV extendido para sincronizacion.
- Operacion: mejoras visuales y de flujo en distribuidores, feedback moderable, citas/servicios y logistica adicional.
- POS/monedas: etiquetas visibles en espanol para ubicaciones/metodos y preconfiguracion regional base en modulo de monedas.


## Landing ComerCia: confianza y conversion
Se agregaron bloques de confianza/compliance y conversion en `/comercia`:
- Banner de cookies con opciones: `Rechazar`, `Ver preferencias`, `Aceptar`.
- Persistencia local:
  - `comercia_cookie_consent_status`
  - `comercia_cookie_preferences`
- Paginas legales publicas:
  - `/legal/privacidad`
  - `/legal/cookies`
  - `/legal/proteccion-datos`
- Seccion de video demo con embed configurable por `VITE_COMERCIA_YOUTUBE_URL`.
- Formulario de atencion al cliente separado del diagnostico comercial.
- Lía reforzada como asistente comercial conversacional con recomendacion de plan y captura de lead.
- Footer comercial reforzado con enlaces legales, atencion y placeholders de redes.

### Nuevos endpoints de trazabilidad comercial
- `POST /api/v1/comercia/customer-contact-leads`
- `GET /api/v1/reinpia/customer-contact-leads`

El endpoint de planes existente se mantiene:
- `POST /api/v1/comercia/plan-purchase-leads`

## Flujo comercial actualizado en landing
- Lía ahora funciona como widget flotante tipo chat web (no bloque estatico).
- Diagnostico comercial se abre en modal/subflujo para mejor conversion.
- Seccion "Contáctanos" reemplaza "Atencion al cliente" con formulario premium.
- Canales de trazabilidad comercial activos:
  - `lia_widget`
  - `contacto`
  - `diagnostico`
  - `whatsapp`

## Inbox comercial REINPIA
Nuevo modulo global para seguimiento comercial:
- ruta frontend: `/reinpia/commercial-inbox`
- listado, filtros, detalle y cambio de estatus
- estados operativos:
  - `nuevo`
  - `en_seguimiento`
  - `contactado`
  - `agendado`
  - `cerrado_ganado`
  - `cerrado_perdido`

## Endpoints comerciales actualizados
- `POST /api/v1/comercia/customer-contact-leads`
- `GET /api/v1/reinpia/customer-contact-leads`
- `PUT /api/v1/reinpia/customer-contact-leads/{id}`

## Modo demo local (autologin superadmin)
Variables frontend (`frontend/.env`):
- `VITE_API_URL=http://127.0.0.1:8000`
- `VITE_DEMO_AUTOLOGIN=true`
- `VITE_DEMO_SUPERADMIN_EMAIL=superadmin@comercia.demo`
- `VITE_DEMO_SUPERADMIN_PASSWORD=Demo1234!`

Variables backend (`backend/.env`):
- `ENVIRONMENT=development`
- `FORCE_SUPERADMIN_AUTH=1` (solo no-produccion)
- `FORCE_SUPERADMIN_EMAIL=superadmin@comercia.demo`

## Actualizacion ejecucion 37 (Separacion real Global vs Marca + modulos funcionales)
- Se reforzo la separacion de paneles:
  - Global ComerCia (`/reinpia/*`) para administracion de plataforma.
  - Operacion de marca (`/admin/*`) para gestion de una marca activa.
- Monedas ya funciona por contexto:
  - Global: `/reinpia/currency` (moneda base global, monedas habilitadas, modo manual/automatico futuro, tipos manuales).
  - Marca: `/admin/currency` (moneda de operacion, heredar global o personalizar por marca).
- Usuarios funcional por contexto:
  - Global: `/reinpia/users` (usuarios internos de plataforma).
  - Marca: `/admin/users` (usuarios de la marca activa, sin exponer usuarios globales).
- Idioma funcional por contexto:
  - Global: `/reinpia/language` (idiomas de plataforma e idioma por defecto del panel).
  - Marca: `/admin/language` (idioma principal de tienda, idiomas visibles, perfil regional).
- Seguridad de arquitectura reforzada en backend:
  - Solo `reinpia_admin` puede crear/actualizar marcas.
  - Usuarios de marca no pueden administrar marcas hermanas.
  - Endpoints de branding/tenant restringidos por scope de tenant.

## Actualizacion ejecucion 42 (Plantillas oficiales por canal)
- Se establece arquitectura oficial de plantillas por tenant y por canal:
  - `landing_template`
  - `public_store_template`
  - `distributor_store_template`
- Valores oficiales activos:
  - `approved_landing_v1`
  - `approved_public_v1`
  - `approved_b2b_v1`
- Persistencia central en `StorefrontConfig.config_json`:
  - campos top-level de plantilla
  - `channel_templates` como bloque normalizado
  - compatibilidad con `workflow.selected_template` para landing
- Nuevo resolver central frontend:
  - `resolveLandingTemplate(...)`
  - `resolvePublicStoreTemplate(...)`
  - `resolveDistributorStoreTemplate(...)`
- Rutas oficiales conectadas al motor de plantillas resueltas:
  - `/store/:tenantSlug/landing`
  - `/store/:tenantSlug`
  - `/store/:tenantSlug/distribuidores`
- Wizard conectado al motor real:
  - paso landing guarda `landing_template`
  - paso ecommerce publico guarda `public_store_template`
  - paso ecommerce distribuidores guarda `distributor_store_template`
- Panel de marca actualizado como centro de control oficial:
  - muestra plantilla activa por canal
  - muestra rutas oficiales y preview tenant-aware
  - regeneraciones mantienen plantilla oficial configurada

## Actualizacion ejecucion 43 (Modelos comerciales por marca)
- Se agrego configuracion comercial oficial por tenant:
  - `billing_model` (`fixed_subscription` | `commission_based`)
  - `commission_percentage`
  - `commission_enabled`
  - `commission_scope`
  - `commission_notes`
- Reglas de negocio aplicadas:
  - `fixed_subscription` => `commission_enabled=false`
  - `commission_based` => `commission_enabled=true`
- Wizard y alta de marca ya permiten configurar modelo comercial.
- Panel global y panel de marca muestran modelo activo, porcentaje y estado de comision.
- Reportes/pagos globales incluyen:
  - ventas sujetas a comision
  - comision acumulada estimada
  - marcas bajo modelo por comision

## Actualizacion ejecucion 44 (Plan comercial desde Stripe + control de creditos IA)
- Se crea arquitectura oficial de plan comercial por tenant con activacion desde Stripe Checkout:
  - endpoint catalogo: `GET /api/v1/commercial-plans/catalog`
  - endpoint checkout plan: `POST /api/v1/commercial-plans/create-checkout-session`
  - webhook `checkout.session.completed` aplica plan pagado en tenant cuando `metadata.kind=tenant_commercial_plan`
- Nuevos campos persistidos por tenant:
  - `commercial_plan_key`, `commercial_plan_status`, `commercial_plan_source`, `commercial_checkout_session_id`
  - `commercial_limits_json`
  - `ai_tokens_included`, `ai_tokens_balance`, `ai_tokens_used`, `ai_tokens_locked`, `ai_tokens_lock_reason`
- Catalogo oficial incorporado (con IVA) para:
  - `fixed_subscription` (basic/growth/premium)
  - `commission_based` (basic/growth/premium)
  - add-ons oficiales (usuarios, agentes IA, marcas, productos, sucursales, creditos IA, soporte)
- Control interno de “llave” de creditos IA:
  - `POST /api/v1/commercial-plans/tenant/{tenant_id}/tokens/consume`
  - `POST /api/v1/commercial-plans/tenant/{tenant_id}/tokens/topup`
  - `POST /api/v1/commercial-plans/tenant/{tenant_id}/tokens/lock`
- Wizard/panel ahora exponen visibilidad del plan pagado y estado de creditos IA.
- Landing principal agrega nueva seccion por bloques:
  - Diagnostico comercial y cotizacion inteligente (basado en contexto/kpis/riesgo/rentabilidad).

## Actualizacion ejecucion 45 (Seccion Marketing redisenada con formulario y salida ejecutiva)
- La seccion de marketing en landing principal COMERCIA se rehizo para operar como brief comercial real.
- Ahora incluye formulario completo basado en `Ejemplo Input MKT`:
  - contexto de marca
  - madurez digital
  - urgencia/seguimiento
  - ticket promedio y canal de conversion
- Se aplica metodologia del CODEX con clasificacion interna automatica para:
  - complejidad
  - madurez digital
  - intensidad requerida
  - potencial comercial
- Se genera salida estructurada en 10 puntos (formato ejecutivo esperado) + cotizacion preliminar.
- El brief se registra en leads de contacto para seguimiento comercial.
