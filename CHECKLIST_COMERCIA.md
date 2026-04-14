# CHECKLIST COMERCIA

## Entregables ejecucion 1
- [x] A. Estructura completa del monorepo
- [x] B. Backend FastAPI corriendo con modulos iniciales
- [x] C. Frontend React/Vite corriendo con layout inicial
- [x] D. Modelos iniciales del dominio
- [x] E. Endpoints iniciales solicitados
- [x] F. Migraciones base
- [x] G. CHECKLIST actualizado
- [x] H. README con instrucciones de arranque local
- [x] I. docs/architecture.md
- [x] J. docs/modules.md

## Entregables ejecucion 2
- [x] A. Autenticacion y usuarios (JWT, login, me, roles)
- [x] B. Tenants y branding extendidos
- [x] C. Landing generator logico por configuracion
- [x] D. Catalogo multitenant CRUD minimo
- [x] E. Frontend admin shell funcional con login y guard
- [x] F. Frontend storefront base por tenant slug
- [x] G. Documentacion actualizada
- [x] H. Modelo de dominio adicional (`User`, `StorefrontConfig`, `Banner`)
- [x] I. Calidad minima validada

## Entregables ejecucion 3 (Pagos Stripe)
- [x] Stripe config por tenant (incluye `stripe_account_id`)
- [x] Plan 1 (checkout sin comision)
- [x] Plan 2 (checkout con fee + transfer data)
- [x] Comision dinamica 2.5% / 3% por item
- [x] Checkout endpoint `create-session`
- [x] Webhook Stripe para estado de orden
- [x] Dashboard admin de pagos
- [x] Base email de comprobante y desglose
- [x] Documentacion de pagos actualizada
- [x] Validacion tecnica

## Entregables ejecucion 4 (Growth comercial)
- [x] Fidelizacion (`LoyaltyProgram`, cuentas y puntos)
- [x] Membresias (`MembershipPlan`)
- [x] Cupones (`Coupon` + validacion)
- [x] Banners dinamicos por posicion/target/prioridad
- [x] Upsell / cross-sell previo al checkout
- [x] Wishlist por cliente
- [x] Reseñas basicas con moderacion
- [x] Checkout extendido (coupon_code + points + customer_id)
- [x] Admin frontend growth pages
- [x] Storefront extendido (home-data, product detail, checkout UI)
- [x] Documentacion y arquitectura actualizadas
- [x] Validacion backend/frontend completada

## Entregables ejecucion 5 (Operacion comercial real)
- [x] Modelos: services, appointments gift, distributors, contracts, recurring, logistics
- [x] Servicios backend: appointment/distributor/contract/recurring/logistics/notifications base
- [x] Endpoints API v1 de servicios, citas, distribuidores, contratos, recurrencia y logistica
- [x] Checkout extendido para compra de servicios y regalo
- [x] Webhook post-pago crea appointment para servicios y envia notificaciones base
- [x] Frontend admin: services, appointments, distributor applications, distributors, contracts, recurring, logistics
- [x] Frontend storefront: services list/detail, gift form, distributor register/login-placeholder
- [x] Contratos digitales MVP con firma textual
- [x] Migraciones Alembic actualizadas hasta `20260328_05`
- [x] README y docs actualizados con flujo operativo
- [x] Validacion: backend compile, alembic upgrade head, frontend build

## Entregables ejecucion 6 (Landings COMERCIA + REINPIA)
- [x] Landing corporativa COMERCIA de alto impacto en `/comercia`
- [x] Seccion comercial completa de paquetes IMPULSA y ESCALA
- [x] Widget placeholder de agente "Lia de COMERCIA"
- [x] Landing principal REINPIA en `/store/reinpia`
- [x] Secciones REINPIA: que hacemos, soluciones, modelo comercial y CTA
- [x] Widget placeholder de agente "SofIA by REINPIA"
- [x] Componentes visuales reutilizables de marketing
- [x] Seed idempotente de tenant REINPIA + branding + banners + servicios demo
- [x] Storefront servicios REINPIA orientado a ecommerce de servicios
- [x] README, docs/modules y docs/architecture actualizados
- [x] Validacion: backend compile + frontend build

## Entregables ejecucion 7 (Panel Global REINPIA)
- [x] Servicios backend de analytics multi-tenant
- [x] Servicios backend de export CSV
- [x] Endpoints `/api/v1/reinpia/*` para dashboard, tenants, payments, operations y exports
- [x] KPIs globales y KPIs por tenant implementados
- [x] Filtros `date_from`, `date_to`, `tenant_id`, `status`, `plan_id`, `business_type`
- [x] Frontend global pages: dashboard, tenants, tenant detail, payments, operations, reports
- [x] Componentes UI reutilizables: KpiCard, FilterBar, SummaryTable, ExportButtons, EmptyState, SimpleChartSection
- [x] Seguridad por rol: solo `reinpia_admin` puede acceder a `/reinpia/*`
- [x] Export CSV funcional desde frontend
- [x] Seed idempotente con subscription activa REINPIA para reporting base
- [x] README/docs/checklist actualizados
- [x] Validacion: backend compile + frontend build

## Entregables ejecucion 8 (Panel Global + Comisionistas/Afiliados)
- [x] Modelos `SalesCommissionAgent`, `SalesReferral`, `PlanPurchaseLead`, `InternalAlert`
- [x] Servicios `commission_agents_service` e `internal_alerts_service`
- [x] Analytics global extendido con KPIs de comisionistas y ventas directas
- [x] Export CSV extendido: commission agents y plan purchase leads
- [x] Endpoints REINPIA para comisionistas, referidos, leads y alertas
- [x] Endpoints publicos COMERCIA para validar referral y registrar lead de plan
- [x] Landing `/comercia` con captura real de lead y clave de comisionista (`?ref=`)
- [x] Trazabilidad de origen de lead (`query_param`, `manual_code`, `direct`) y alertas por `failed` / `pending_contact`
- [x] Frontend REINPIA: pages `/reinpia/commission-agents` y `/reinpia/alerts`
- [x] Dashboard REINPIA con resumen de comisionistas y alertas recientes
- [x] Seeds idempotentes de comisionistas demo
- [x] Documentacion actualizada (README + architecture + modules + checklist)
- [x] Validacion: backend compile, alembic upgrade head, frontend build

## Entregables ejecucion 9 (Modos DEMO / APP limpia)
- [x] Estructura dual de datos por ambiente (`DATA_MODE=demo|app|none`)
- [x] Script `seed_demo` con dataset multi-tenant completo e idempotente
- [x] Script `seed_app_base` con base minima tecnica sin demo comercial
- [x] Script `reset_demo` para limpieza controlada de datos demo
- [x] Tenants demo: REINPIA, NATURA VIDA, CAFE MONTE ALTO + tenant inactivo
- [x] Datos demo suficientes para storefront, admin, panel global, pagos y operaciones
- [x] Usuarios demo funcionales (`*.demo`) para login por rol
- [x] Data de comisionistas/leads/alertas incluida en demo para flujo comercial-contable
- [x] Documentacion actualizada con comandos DEMO/APP y limpieza
- [x] Validacion ejecutada: compile backend + build frontend + seed/reset/seed

## Entregables ejecucion 10 (Cierre funcional local)
- [x] Panel global REINPIA estabilizado con KPIs y exportes
- [x] Onboarding vendedor y cliente con progreso por usuario
- [x] Base i18n ES/EN con selector visible y persistencia local
- [x] Multi-moneda por tenant con settings + exchange rates manual/refresh
- [x] Selector de moneda visible en storefront y aviso de fallback checkout
- [x] POS WebApp base con ubicaciones, empleados, clientes y ventas
- [x] Integracion de fidelizacion en flujo POS (uso/suma de puntos)
- [x] Base de puntos propios/franquicia/distribuidor por `PosLocation.location_type`
- [x] Base automation para bots/WhatsApp: canales, templates y eventos
- [x] Seeds DEMO/APP actualizados para onboarding, currency, POS y automation
- [x] Validacion: backend compile + alembic upgrade head + seed_app_base + seed_demo + frontend build

## Entregables ejecucion 11 (Centinela seguridad / antifraude)
- [x] Auditoria inicial: modulo centinela faltante identificado (modelos/servicios/endpoints/frontend)
- [x] Modelos creados: `SecurityEvent`, `SecurityRule`, `SecurityAlert`, `RiskScore`, `BlockedEntity`
- [x] Servicios creados: `security_watch_service`, `security_rules_service`, `security_hooks`
- [x] Reglas iniciales sembradas (`LOGIN_FAIL_5_IN_10`, `FAILED_PAYMENTS_3_IN_15`, `COUPON_ABUSE_10_IN_30`, `REFERRAL_ABUSE_8_IN_30`, `ADMIN_ACTION_SPIKE`, `WEBHOOK_FAILURE_REPEAT`)
- [x] Endpoints `/api/v1/security/*` protegidos para `reinpia_admin`
- [x] Integraciones reales en auth, cupones, referral/comisionistas, webhook Stripe y POS
- [x] Frontend seguridad REINPIA: dashboard, alerts, rules y blocked entities
- [x] Componentes UI centinela: `SecurityKpiCard`, `SecurityEventTable`, `SecurityAlertList`, `RuleEditorCard`, `BlockedEntityTable`

## Entregables ejecucion 40 (Limpieza landing publica COMERCIA)
- [x] Auditoria de rutas activas publicas (`/comercia`, `/comercia/precios`, `/comercia/marketing`, `/comercia/consultoria`)
- [x] Identificacion de legacy publico fuera del flujo oficial (`/demo/mercaplus*`)
- [x] Retiro de rutas demo legacy del router publico
- [x] Eliminacion de archivos demo legacy en `frontend/src/demo/mercaplus`
- [x] Depuracion de estilos legacy en `ComerciaLandingPage.css` para sitio publico vigente
- [x] Validacion de build frontend sin imports rotos
- [x] Documentacion actualizada (`README.md`, `docs/modules.md`, `docs/architecture.md`, `CHECKLIST_COMERCIA.md`)

## Entregables ejecucion 41 (Limpieza admin global/marca legacy)
- [x] Auditoria de rutas oficiales: panel global, wizard, canales creados y panel de marca
- [x] Identificacion de legacy/duplicados de tenants en router admin
- [x] Retiro de aliases legacy de tenants (`/tenants`, `/tenants/:tenantId`, `/tenants/:tenantId/branding`)
- [x] Eliminacion de paginas legacy `TenantsPage` y `TenantDetailPage`
- [x] Consolidacion de enlaces de marca hacia `/reinpia/tenants/:tenantId`
- [x] Limpieza de menu para evitar mezcla de contexto global en panel de marca
- [x] Validacion build frontend y compile backend
- [x] Documentacion actualizada (`README.md`, `docs/modules.md`, `docs/architecture.md`, `CHECKLIST_COMERCIA.md`)
- [x] Seeds demo idempotentes de eventos, alertas, bloqueos y reglas de seguridad
- [x] Documentacion actualizada (README, architecture, modules, checklist)
- [x] Validacion: backend compile + alembic upgrade head + frontend build

## Entregables ejecucion 12 (Reportes e insights comerciales)
- [x] Modelos de soporte reportes: `ReportRequest`, `ReportInsight`, `MarketingInsight`
- [x] Servicios: `reporting_periods`, `reporting_service`, `marketing_insights_service`, `report_export_service`
- [x] Endpoints tenant: overview/users/sales/memberships/loyalty/products/distributors/logistics/services/marketing-insights
- [x] Endpoints REINPIA global: overview/tenants-growth/commissions/leads/marketing-opportunities/commercial-summary
- [x] Exports tenant CSV: users, sales, products, loyalty, distributors, logistics, services, marketing-insights
- [x] Soporte de periodos: day, week, fortnight, month, quarter, half_year, year, custom
- [x] Frontend tenant reports pages implementadas bajo `/admin/reports*`
- [x] Frontend REINPIA reportes ejecutivos implementados bajo `/reinpia/reports/*`
- [x] Componentes UI de reportes: `ReportKpiCard`, `PeriodSelector`, `InsightCard`, `ReportSection`, `RankingTable`, `StatusSummaryCard`, `ExportCsvButton`
- [x] Permisos: tenant report routes restringidas a `tenant_admin|tenant_staff|reinpia_admin`; global REINPIA a `reinpia_admin`
- [x] Seed demo ajustado para fechas distribuidas y marketing insights idempotentes
- [x] Validacion ejecutada: backend compile, alembic upgrade head, seed_demo, frontend build

## Entregables ejecucion 13 (Arranque y root frontend)
- [x] `start_all.ps1` valida `backend/.venv` y muestra instrucciones exactas si falta
- [x] `start_all.ps1` soporta modo bootstrap opcional (`-Bootstrap` o `COMERCIA_BOOTSTRAP=1`)
- [x] `start_all.bat` soporta `--bootstrap` sin romper flujo actual
- [x] Frontend evita rebote en raiz para no autenticados (`/` -> `/comercia`)
- [x] README actualizado con uso bootstrap

## Entregables ejecucion 14 (Branding + rutas + storefront)
- [x] Branding visible actualizado a `ComerCia` en landing principal y textos UI clave
- [x] Guard de auth corregido: rutas protegidas redirigen a `/login` (excepto `/` sin sesion -> `/comercia`)
- [x] `/reinpia/dashboard` mantiene acceso protegido para `reinpia_admin` sin redireccion erronea a landing publica
- [x] CORS backend ampliado para puertos locales de Vite (`5173/5174`) y evita `Failed to fetch` por origen
- [x] `/store/:tenantSlug` ahora muestra fallback elegante con boton reintentar y log claro de endpoint fallido
- [x] README actualizado con notas de branding y comportamiento de rutas

## Entregables ejecucion 15 (Auditoria flujo /store/reinpia)
- [x] Endpoint frontend verificado: `/api/v1/storefront/{tenantSlug}/home-data`
- [x] Endpoint backend verificado y funcional para `reinpia`
- [x] Seed demo verificado: tenant `reinpia` + branding + storefront config + datos minimos visibles
- [x] Script reusable de verificacion agregado (`python -m app.db.verify_reinpia_storefront`)

## Entregables ejecucion 16 (Arquitectura madre/hijos + workflow de marca)
- [x] Ajuste de copy y navegación: ComerCia plataforma madre, marcas como tenants hijos
- [x] Workflow guiado base para setup por marca (`/reinpia/brands/new`, `/reinpia/brands/:tenantId/setup`)
- [x] Estados por etapa con revisión/aprobación/rehacer antes de publicar
- [x] Carga de assets locales por etapa en backend (`/api/v1/brand-setup/{tenant_id}/assets`)
- [x] Configuración por marca para NFC / Mercado Pago / MFA TOTP (base funcional)
- [x] Módulos visibles: carga masiva, inventario operativo base y retroalimentación moderable
- [x] Build frontend + compile backend + alembic upgrade head validados

## Entregables ejecucion 17 (Split de pagos Stripe/Mercado Pago)
- [x] Regla de negocio aplicada: Stripe solo para ecommerce/suscripciones y Mercado Pago para POS/WebApp
- [x] Configuracion separada por marca: `stripe-config` y `mercadopago-settings`
- [x] POS con flujos Mercado Pago (`link`, `qr`, `confirm`) y trazabilidad en `PosPaymentTransaction`
- [x] Metodos de pago POS alineados (efectivo, transferencia, Mercado Pago, placeholders controlados)
- [x] Reportes ajustados para distinguir Stripe ecommerce vs POS por metodo
- [x] Landing ComerCia actualizada con servicios adicionales y activaciones (NFC/cobros digitales)
- [x] Validacion: backend compile + alembic upgrade head + frontend build

## Entregables ejecucion 18 (PWA instalable priorizada para POS)
- [x] Frontend convertido en PWA instalable (manifest + service worker)
- [x] `start_url` orientada a POS (`/pos`)
- [x] Prompt de instalacion y ayuda Android/iOS en login y POS
- [x] Iconos base instalables (`192`, `512`, `apple-touch-icon`)
- [x] Shortcuts preparados para POS/Admin/Landing
- [x] Cache offline basico para shell estatico
- [x] Documentacion y modulos actualizados
- [x] Validacion: frontend build OK

## Entregables ejecucion 19 (Experiencia premium por marca y operacion visual)
- [x] Landing por marca elevada con bloques premium reutilizables en storefront
- [x] Ecommerce publico mejorado con secciones comerciales, carruseles y tarjetas reforzadas
- [x] Ecommerce distribuidores separado visual y funcionalmente con enfoque B2B
- [x] Dashboard de marca reorganizado por modulos con breadcrumbs y boton volver
- [x] Retroalimentacion visible y moderable con filtros por estado/canal
- [x] Carga masiva mejorada con plantilla, validaciones y resumen de errores/importacion
- [x] Inventario visible por canal con movimientos rapidos y lectura por almacen
- [x] Workflow de marca reforzado con preview por etapa y accion de regenerar/rehacer
- [x] Validacion: backend compile + alembic upgrade head + frontend build

## Entregables ejecucion 20 (Mejora comercial landing + logistica global + roles)
- [x] Copy tecnico retirado de landing comercial de ComerCia
- [x] Landing de ComerCia mejorada visualmente (hero, narrativa, beneficios, paquetes, CTA)
- [x] Lia convertida en agente comercial conversacional con recomendacion de plan
- [x] Flujo \"Hablar con un asesor\" corregido y conectado a diagnostico
- [x] Modulo global de servicios logisticos adicionales por marca (backend + frontend)
- [x] Usuarios demo ampliados por perfil (global, marca, distribuidor, publico)
- [x] Visibilidad de modulos reforzada por rol (distribuidor/publico fuera de admin)
- [x] Validacion: backend compile + alembic upgrade head + frontend build

## Entregables ejecucion 21 (Arranque local robusto)
- [x] Dependencia backend `python-multipart` agregada a requirements
- [x] JSX de `ReinpiaLogisticsServicesPage` validado/corregido para build estable
- [x] Scripts robustos: `start_all.ps1`, `start_all.bat`, `start_backend_only.ps1`, `start_frontend_only.ps1`
- [x] Nuevo `bootstrap_local.ps1` para preparar entorno local completo
- [x] `package.json` raiz actualizado con `dev:all` y `dev:all:bootstrap`
- [x] Mensajes de error mejorados (venv faltante, dependencia faltante, puerto ocupado)
- [x] Validacion: backend compile + frontend build

## Entregables ejecucion 22 (Estabilidad landing/login + operacion global)
- [x] Overlay/residuo visual de landing mitigado (estado body + cache PWA menos agresivo)
- [x] Login sin falso `Failed to fetch` por puertos dinamicos (CORS local + `VITE_API_URL` dinamica)
- [x] Rutas y menus reforzados por rol (`tenant_admin` vs `tenant_staff` vs `reinpia_admin`)
- [x] Servicios logisticos adicionales globales mejorados con filtros y edicion
- [x] Healthcheck de `start_all` con mensajes mas claros y API URL efectiva
- [x] Validacion: backend compile + frontend build

## Entregables ejecucion 23 (Wizard SaaS de setup de marca)
- [x] `BrandSetupWizard` reemplaza flujo de cards independientes
- [x] Flujo secuencial bloqueado en 6 pasos (identidad, contenido IA, landing, ecommerce, POS, publicacion)
- [x] Generacion backend de contenido base por prompt (`generate-content`)
- [x] Generacion backend de landing draft desde identidad + contenido (`generate-landing`)
- [x] Aprobacion secuencial de pasos con bloqueo backend (`steps/{step_code}/approve`)
- [x] Persistencia de progreso real (`current_step`, estados y payload por etapa en `StorefrontConfig.config_json`)
- [x] Seed demo de marca `Instituto Zaro Latino` con identidad + contenido + landing aprobada
- [x] Validacion: backend compile + frontend build

## Entregables ejecucion 24 (Revision funcional reportes/operacion demo)
- [x] Reportes tenant ajustados para `reinpia_admin` sin dependencia de tenant asociado (selector de marca)
- [x] Dashboards/reportes globales con filtro por marca util (`FilterBar` con opciones de tenants)
- [x] Productos extendidos con campos Stripe (`stripe_product_id` y `stripe_price_id_*`) + migracion `20260330_13`
- [x] Carga masiva de catalogo ampliada con columnas Stripe y guia comercial de sincronizacion
- [x] Vistas distribuidores y solicitudes clarificadas con foco operativo (contacto, autorizacion, empleados)
- [x] Retroalimentacion moderable mejorada (autor, canal, producto, estado y acciones)
- [x] Logistica adicional mejorada con detalle de costos y generacion de link de cobro (Stripe/MP base)
- [x] Citas/servicios rediseñadas con acciones operativas (notificar, confirmar recibido, asistencia, cerrar)
- [x] POS y modulos relacionados con etiquetas visibles en español (tipos de punto y metodos de pago)
- [x] Monedas robustecidas (fallback de error y preconfiguracion regional base)

## Entregables ejecucion 25 (Wizard condicional + login estable + Lia comercial)
- [x] Barrido de navegacion duplicada en panel de marca (rutas repetidas simplificadas)
- [x] Wizard de setup rehacido como flujo secuencial condicional (con landing / sin landing)
- [x] Paso 1 condicional con URL de landing existente y prompt maestro obligatorio
- [x] Flujos separados: con landing existente (5 pasos) y sin landing (6 pasos)
- [x] Paso landing bloqueado por aprobacion con generar/regenerar/preview
- [x] Paso ecommerce distribuidores separado del ecommerce publico
- [x] Persistencia de progreso por `flow_type`, `current_step`, `steps` y drafts por etapa
- [x] Login reforzado para evitar estado colgado (`Ingresando...`) y timeout de API
- [x] Bloque de Lía reemplazado por formulario comercial inteligente de diagnostico
- [x] Seeds demo actualizados para probar ambos flujos (REINPIA sin landing, Instituto Zaro Latino con landing)

## Entregables ejecucion 26 (Landing premium + onboarding modular + demo reforzada)
- [x] Landing de ComerCia elevada visualmente (jerarquia, bloques, fondos y CTA)
- [x] Onboarding contextual por modulo con tarjeta reusable y boton "Entendido"
- [x] Onboarding aplicado en modulos clave: landing/branding, productos, carga masiva, distribuidores, membresias, retroalimentacion, logistica, inventario, servicios, citas, POS, reportes, monedas, automatizacion, Stripe y Mercado Pago
- [x] Seeds demo reforzados: citas (normal/regalo/anonima + estados), feedback adicional, logistica adicional (recoleccion/entrega/ambos/resguardo con estatus)
- [x] REINPIA demo mantenido con workflow, servicios y datos de evaluacion visual/comercial
- [x] UX general pulida con estados vacios mas utiles y textos clave en espanol
- [x] Validacion: backend compile + frontend build

## Entregables ejecucion 27 (Landing comercial premium + Lia conversacional IA)
- [x] Landing de ComerCia rediseñada con narrativa comercial mas fuerte (dolor -> solucion -> proceso -> cierre)
- [x] Hero y composicion visual premium mejorados con bloques de alto impacto
- [x] Seccion de problema real del cliente agregada para enfoque de conversion
- [x] Seccion de solucion ComerCia ampliada por modulos comerciales clave
- [x] Seccion \"Como funciona\" incorporada con flujo claro en 5 pasos
- [x] Seccion de paquetes IMPULSA/ESCALA reforzada visualmente
- [x] Servicios adicionales presentados con enfoque comercial de activacion
- [x] Lía transformada a asistente conversacional guiado con chips y recomendacion dinamica
- [x] Captura de lead desde Lía con plan recomendado y contexto para seguimiento
- [x] Validacion: frontend build + backend compile

## Entregables ejecucion 28 (Trust + conversion landing ComerCia)
- [x] Banner de cookies con rechazo/aceptacion/preferencias y persistencia local
- [x] Modal de preferencias de cookies (analitica/marketing) sin bloqueo global persistente
- [x] Paginas legales publicas: privacidad, cookies y proteccion de datos
- [x] Rutas legales nuevas: `/legal/privacidad`, `/legal/cookies`, `/legal/proteccion-datos`
- [x] Seccion video YouTube en landing con `VITE_COMERCIA_YOUTUBE_URL` y placeholder elegante
- [x] Formulario de atencion al cliente separado del diagnostico comercial
- [x] Trazabilidad backend de atencion con `CustomerContactLead`
- [x] Endpoint publico `POST /api/v1/comercia/customer-contact-leads`
- [x] Endpoint admin `GET /api/v1/reinpia/customer-contact-leads`
- [x] Lía evolucionada a asistente comercial conversacional y persuasivo con captura de lead
- [x] Footer landing reforzado con enlaces legales/contacto/atencion
- [x] Validacion: backend compile + frontend build

## Entregables ejecucion 29 (Lía flotante + flujo comercial unificado)
- [x] Lía migrada a widget flotante tipo chat web (abrir/cerrar, historial corto, chips, recomendacion y CTAs)
- [x] Seccion "Atencion al cliente" reemplazada por "Contáctanos" con formulario premium
- [x] Diagnostico comercial movido a subflujo modal (ya no barra suelta)
- [x] CTAs de landing alineados: abrir Lía, abrir diagnostico, abrir contáctanos, ver paquetes
- [x] Copy "Dolor" eliminado y reemplazado por etiqueta comercial "Reto actual"

## Entregables ejecucion 45 (Wizard oficial de alta/configuracion)
- [x] Wizard consolidado como flujo oficial de onboarding de marca (no demo)
- [x] Plan pagado desde Stripe integrado como fuente oficial de billing/comision/limites/creditos
- [x] Bloqueo de edicion manual de `billing_model` y comision en wizard (override explicito via backend)
- [x] Entitlements visibles en wizard: marcas, usuarios, agentes IA, productos, sucursales, creditos IA y add-ons
- [x] Advertencias y bloqueos por exceso de limites en flujo de aprobacion/publicacion
- [x] Plantillas oficiales forzadas en wizard (`approved_landing_v1`, `approved_public_v1`, `approved_b2b_v1`)
- [x] Caso landing externa resuelto sin romper preview interno ni regeneracion tenant-aware
- [x] Botones/rutas corregidos en wizard para landing/publico/distribuidores (ver, preview, regenerar)
- [x] Resumen final ejecutivo del wizard con branding, plan, plantillas, rutas y estado general
- [x] Estado final del wizard visible: `borrador`, `en configuracion`, `lista para revision`, `lista para publicacion`, `publicada`
- [x] Validacion tecnica ejecutada: `npm run build` (frontend) y `python -m compileall backend/app` (backend)

## Entregables ejecucion 46 (Landing comercial + Stripe test checkout)
- [x] Variables de entorno para `price_id` de planes y add-ons agregadas en backend
- [x] Catalogo comercial central actualizado con `code/display_name/stripe_price_id` y precios totales
- [x] Endpoint `POST /api/v1/commercial-plans/create-checkout-session` habilitado para planes y add-ons por `item_code`
- [x] Resolucion de `stripe_price_id` centralizada en backend (sin hardcode en frontend)
- [x] Landing publica `/comercia` conectada a checkout real de Stripe test para 6 planes
- [x] Add-ons conectados a checkout real de Stripe test desde landing
- [x] UX de compra con loading, error claro y retorno por `success/cancel`
- [x] Validaciones ejecutadas:
  - `npm run build` (frontend)
  - `python -m compileall app` (backend)
  - prueba funcional de endpoint de checkout (plan + add-on) con mock de Stripe
- [x] Modulo interno "Inbox comercial" para leads/mensajes/diagnosticos con filtros y cambio de estatus
- [x] Endpoint REINPIA para actualizar estatus de contacto (`PUT /api/v1/reinpia/customer-contact-leads/{id}`)
- [x] Seeds demo ampliados con leads de canales `lia_widget`, `contacto`, `diagnostico`, `whatsapp`
- [x] Base WhatsApp/bot reforzada con plantillas y eventos comerciales demo
- [x] Validacion: backend compile + frontend build

## Entregables ejecucion 30 (Conexion wizard + upload + demo superadmin)
- [x] URL base frontend unificada a `http://127.0.0.1:8000` (env, fallbacks y mensajes de error)
- [x] CORS backend ampliado para puertos locales Vite (`5173-5176`, localhost y 127.0.0.1)
- [x] Scripts de arranque actualizados con URLs visibles: frontend `http://localhost:5175`, API `http://127.0.0.1:8000`, docs y health
- [x] `start_all.ps1` corregido (sin argumentos vacios en `Start-Process`)
- [x] Upload del wizard reparado: `multipart/form-data`, validacion de imagen y respuesta con `file_url`
- [x] Assets del wizard servidos por backend en `/media/*` con persistencia por tenant/paso
- [x] Paso 1 del wizard reforzado: guardado completo, mensajes claros y confirmacion visual de logo/imagenes
- [x] Errores API mejorados con endpoint y contexto (conexion, timeout, upload invalido)
- [x] Modo demo local con autologin superadmin (`VITE_DEMO_AUTOLOGIN`) y boton rapido en login
- [x] Seed demo idempotente actualizado: `superadmin@comercia.demo / Demo1234!`
- [x] Validacion ejecutada: backend compile, frontend build, `/health`, `/docs`, endpoint wizard, upload logo/base image y guardado paso 1
## Entregables ejecucion 31 (Carga masiva + catalogo + wizard ecommerce)
- [x] Carga masiva conectada a backend real por tenant (`POST /api/v1/products/bulk-import`)
- [x] Categorias desde CSV creadas automaticamente y asociadas a productos del tenant
- [x] Persistencia de importaciones por marca en `catalog_import_jobs` (fecha, totales, validas, errores, creados/actualizados)
- [x] Endpoint de ultima importacion por tenant (`GET /api/v1/products/bulk-import/tenant/{tenant_id}/latest`)
- [x] Paso Ecommerce publico del wizard ahora muestra resumen real de catalogo/importacion/sincronizacion Stripe
- [x] Estado del paso ecommerce calculado automaticamente (`pending`, `in_progress`, `ready`, `approved`)
- [x] Accion de aprobacion/activacion ecommerce publico (`POST /api/v1/brand-setup/{tenant_id}/ecommerce-public/activate`)
- [x] Persistencia del progreso del wizard tras importacion (sin reset de checkboxes/manual)
- [x] Frontend en `Carga masiva` ahora importa al tenant activo y muestra ultima corrida
- [x] Validacion ejecutada: backend compile, frontend build, import CSV por tenant, lectura de wizard con resumen y progreso restaurado

## Entregables ejecucion 32 (Copy comercial landing + posicionamiento REINPIA)
- [x] Se elimino copy debil "Plantilla clonable para multiples industrias" de landing COMERCIA
- [x] Se agrego copy premium: "Diseno de landing y ecommerce para multiples empresas e industrias"
- [x] Se incorporo mensaje comercial de SEO/AEO/prompts integrados y estructura orientada a busqueda
- [x] Se agrego mensaje de expansion internacional (operacion desde Mexico con pesos, dolares y euros)
- [x] Footer actualizado con derechos y propiedad intelectual REINPIA
- [x] Validacion ejecutada: frontend build OK

## Entregables ejecucion 33 (Separacion panel Global vs Marca + selector de contexto)
- [x] Layout admin separado por contexto: "Administración General de ComerCia" vs "Panel de Operación de Marca"
- [x] Indicador persistente de contexto y marca activa en sidebar y topbar
- [x] Selector de contexto para `reinpia_admin` (Global ComerCia / Marca activa) con persistencia en sesion
- [x] Selector de marca activa para `reinpia_admin` (usa lista real de tenants)
- [x] Navegacion Global reorganizada por bloques: inicio, comercial, marcas/activacion, operacion, finanzas, configuracion y reportes
- [x] Navegacion de Marca reorganizada por bloques: inicio, comercial, catalogo, clientes, operacion, POS/WebApp, configuracion y reportes
- [x] Monedas reubicado por contexto en menu:
  - [x] Global: "Monedas y tipos de cambio"
  - [x] Marca: "Moneda de operación"
- [x] Limpieza de duplicados de menu (ej. ventas POS repetidas) y consolidacion de accesos
- [x] Ocultamiento por contexto y rol: usuario de marca no ve menu global

## Entregables ejecucion 34 (Landing SaaS multitenant premium orientada a conversion + SEO/AEO)
- [x] Hero comercial reforzado para captar empresas, comercios y distribuidores
- [x] Seccion explicita de problema de negocio (digitalizacion, escalabilidad y descubrimiento)
- [x] Seccion de solucion SaaS (landing + ecommerce + webapp + IA)
- [x] Beneficios clave para conversion: escalabilidad, automatizacion, multimoneda, multiempresa
- [x] Seccion IA integrada con prompts embebidos orientados a AEO
- [x] Modelos de negocio actualizados: plan sin comision y plan con comision por venta
- [x] Bloque de casos de uso actualizado con copy exacto requerido (SEO/AEO + expansion MXN/USD/EUR)
- [x] Segmentacion visible por tipo de usuario (publico general, distribuidores, comercios)
- [x] Compatibilidad declarada para ecommerce, webapp, multi-tenant y personalizacion por marca

## Entregables ejecucion 35 (Estabilizacion de arranque backend local)
- [x] Compatibilidad de esquema en startup (`init_db`) para columnas nuevas sin depender de migracion previa
- [x] Reconciliacion automatica de columnas en SQLite local: `tenants.plan_type`, `commission_rules_json`, `subscription_plan_json`, `pos_sales.commission_amount`, `net_amount`, `payment_mode`
- [x] Ajuste de puertos por defecto frontend/scripts a `8001` para evitar bloqueo recurrente en `8000`
- [x] Frontend API client actualizado con fallback local `8001` y `8000`
- [x] Validacion de build frontend + compile backend

## Entregables ejecucion 36 (Monedas + alineacion API local)
- [x] Diagnostico de conexion de Monedas completado (sin hardcode `8002` en codigo)
- [x] Alineacion de base API local a `http://127.0.0.1:8000` en frontend y scripts
- [x] Cliente API central reforzado para evitar quedarse pegado a puertos runtime efimeros
- [x] Fallback local controlado `8000 -> 8001` para no romper desarrollo
- [x] Reuso de helper API base en wizard de marca y exportes REINPIA
- [x] Modulo Monedas reforzado con loading, error util, reintento y estado vacio editable
- [x] Validacion ejecutada: backend compile + frontend build

## Entregables ejecucion 37 (Panel global vs marca + modulos vivos)
- [x] Monedas funcional por contexto (global y marca)
- [x] Usuarios funcional por contexto (global y marca)
- [x] Idioma funcional por contexto (global y marca)
- [x] Vista Global: Marcas ordenada con acciones claras por fila
- [x] Restriccion real: crear marca solo en panel global y solo `reinpia_admin`
- [x] Restriccion real: usuarios de marca sin acceso a modulos globales
- [x] Navegacion limpiada para evitar modulos vacios o rutas confusas
- [x] Validacion backend compile OK
- [x] Validacion frontend build OK

## Entregables ejecucion 38 (Canales de marca conectados a vistas reales por tenant)
- [x] Nuevo centro de control por canal de marca: landing, ecommerce publico, ecommerce distribuidores y POS/WebApp
- [x] Modulos del panel de marca redirigidos a rutas de control tenant-aware (sin placeholders genericos)
- [x] Estado por canal visible: borrador, en revision, publicado, requiere ajustes
- [x] Acciones por canal habilitadas: abrir vista real, preview, editar modulo relacionado y regenerar (solo global admin)
- [x] Integracion de datos reales por tenant: branding, catalogo, distribuidores, POS, Mercado Pago y configuracion admin de marca
- [x] POS ajustado para usar tenant activo del selector de contexto (incluye modo marca para `reinpia_admin`)
- [x] Build frontend OK
- [x] Compile backend OK

## Entregables ejecucion 39 (Correccion fina de canales + landing principal)
- [x] Landing principal ComerCia recodificada en UTF-8 valida (sin texto corrupto)
- [x] Copy del modelo comision ajustado para evitar mensajes ambiguos de cobro
- [x] Landing de marca separada en ruta interna tenant-aware (`/store/:tenantSlug/landing`)
- [x] Botones de canal alineados a comportamiento real por tenant (ver/preview/regenerar)
- [x] Regeneracion de canales sin boton muerto (accion real para global admin y stub operativo para marca)
- [x] Validacion de URL externa de landing (dominios demo/no resolubles usan fallback interno)
- [x] Ecommerce publico y distribuidores conservan rutas propias (sin mezclar landing)
- [x] Eliminado hardcode de puerto `8001` en cliente API frontend
- [x] `Abrir WebApp / POS` usa ruta valida tenant-aware (`/pos?tenant_id=...`)
- [x] Validacion ejecutada: frontend build + backend compile

## Entregables ejecucion 40 (Diagnóstico inteligente independiente)
- [x] Nuevo modulo independiente `Diagnóstico inteligente` (separado de wizard/setup)
- [x] Ruta de marca: `/admin/diagnostico-inteligente`
- [x] Ruta global base: `/reinpia/diagnosticos`
- [x] Backend: endpoints de analisis, latest, historial y plan de mejora
- [x] Backend: persistencia en entidad `BrandDiagnostic`
- [x] Analisis real inicial por reglas (SEO, AEO, identidad de marca)
- [x] Frontend: scores visuales, hallazgos, recomendaciones y resumen ejecutivo
- [x] Frontend: plan de mejora editable y guardable
- [x] Navegacion: acceso desde bloque Comercial de marca
- [x] Validacion ejecutada: backend compile + frontend build

## Entregables ejecucion 41 (Diagnóstico inteligente: URL externa)
- [x] Se mantiene analisis interno de marca activa sin romper flujo actual
- [x] Se agrega modo "Analizar URL externa" dentro de `/admin/diagnostico-inteligente`
- [x] Nuevo endpoint: `POST /api/v1/brand-diagnostics/analyze-external-url`
- [x] Nuevo endpoint: `GET /api/v1/brand-diagnostics/{tenant_id}/latest-external`
- [x] Extraccion HTML basica implementada (title/meta/headings/texto/CTA/contacto/formularios)
- [x] Persistencia de analisis externo en historial con `analysis_type=external_url` y `source_url`
- [x] Historial muestra tipo de analisis y origen
- [x] Validacion ejecutada: backend compile + frontend build

## Entregables ejecucion 42 (Plantillas oficiales por canal)
- [x] Arquitectura oficial por tenant definida con `landing_template`, `public_store_template`, `distributor_store_template`
- [x] Defaults oficiales fijados: `approved_landing_v1`, `approved_public_v1`, `approved_b2b_v1`
- [x] Resolver central frontend por canal implementado (`landing`, `public`, `distributors`)
- [x] Rutas oficiales conectadas al resolver tenant-aware (`/store/:tenantSlug`, `/landing`, `/distribuidores`)
- [x] Wizard persistiendo plantilla oficial por canal en pasos landing/public/distribuidores
- [x] Panel de marca leyendo y mostrando plantilla activa por canal
- [x] Preview de distribuidores separado (`/store/:tenantSlug/distribuidores?preview=1`)
- [x] Compatibilidad con flujo legacy (`workflow.selected_template`) mantenida sin romper setup previo
- [x] Documentacion actualizada (`README.md`, `docs/modules.md`, `docs/architecture.md`, `CHECKLIST_COMERCIA.md`)

## Entregables ejecucion 43 (Modelo comercial por marca)
- [x] Persistencia en tenant de `billing_model`, `commission_percentage`, `commission_enabled`, `commission_scope`, `commission_notes`
- [x] Regla aplicada: `fixed_subscription` sin comision y `commission_based` con comision
- [x] Alta de marca (`/reinpia/brands/new`) con seleccion de modelo comercial
- [x] Wizard (`BrandSetupWizard`) con seleccion de modelo y porcentaje/notas cuando aplica
- [x] `brand_setup` sincroniza modelo comercial en workflow y tenant
- [x] Panel global muestra modelo, porcentaje, ventas sujetas y comision estimada
- [x] Panel de marca muestra modelo activo y explicacion de comision
- [x] Reportes/pagos reconocen si aplica comision y exponen calculo estimado base
- [x] Validacion ejecutada: backend compile + frontend build

## Entregables ejecucion 44 (Plan comercial desde Stripe + llave de creditos IA)
- [x] Catalogo oficial de planes comerciales centralizado (`fixed_subscription` y `commission_based`, tiers basic/growth/premium)
- [x] Catalogo de add-ons oficial con calculo de IVA en backend
- [x] Nuevo endpoint de catalogo: `GET /api/v1/commercial-plans/catalog`
- [x] Nuevo endpoint checkout de plan: `POST /api/v1/commercial-plans/create-checkout-session`
- [x] Webhook Stripe aplica plan pagado cuando `metadata.kind=tenant_commercial_plan`
- [x] Persistencia tenant de plan comercial y limites:
  - [x] `commercial_plan_key`
  - [x] `commercial_plan_status`
  - [x] `commercial_plan_source`
  - [x] `commercial_checkout_session_id`
  - [x] `commercial_limits_json`
- [x] Persistencia tenant para control de creditos IA:
  - [x] `ai_tokens_included`
  - [x] `ai_tokens_balance`
  - [x] `ai_tokens_used`
  - [x] `ai_tokens_locked`
  - [x] `ai_tokens_lock_reason`
- [x] Endpoints internos de llave/consumo de creditos IA:
  - [x] consumir
  - [x] recargar
  - [x] abrir/cerrar llave
- [x] Wizard muestra plan pagado desde Stripe y estado de creditos IA
- [x] Panel global detalle de marca muestra plan comercial y creditos IA
- [x] Seccion nueva en landing principal (bloque 1 marketing): `#marketing-diagnostico`
- [x] Validacion ejecutada: backend compile + frontend build

## Entregables ejecucion 45 (Rediseno seccion marketing COMERCIA)
- [x] Seccion `#marketing-diagnostico` convertida a flujo real de brief + cotizacion
- [x] Formulario completo alineado a `Ejemplo Input MKT`
- [x] Metodologia alineada a `CODEX Seccion marketing`
- [x] Reglas de cotizacion alineadas a `Cotizacion interna MKT`
- [x] Clasificacion interna aplicada segun `Clasificacion Interna MKT`
- [x] Salida ejecutiva en 10 puntos implementada en UI
- [x] Brief registrado a leads para seguimiento comercial
- [x] Validacion ejecutada: frontend build

## Entregables ejecucion 46 (Templates oficiales unicos por canal)
- [x] Inventario de templates de landing/publico/distribuidores con identificacion de legacy activo
- [x] Resolver central de canales forzado a templates oficiales unicos
- [x] Backend `brand_setup` bloqueado para persistir solo IDs oficiales
- [x] Wizard sin seleccion de templates legacy y persistencia oficial por defecto
- [x] Storefront landing/publico/distribuidores sin fallback legacy en flujo principal
- [x] Modulos de marca muestran y regeneran sobre template oficial por canal
- [x] Legacy/demo retirado del flujo principal (permanece solo como referencia interna)
- [x] Validacion ejecutada: backend compile + frontend build

## Entregables ejecucion 47 (Mercadotecnia publica + flujo interno)
- [x] Landing publica sin exponer metodologia interna ni cotizacion al prospecto
- [x] Formulario publico conectado a `POST /api/v1/comercia/marketing-prospects`
- [x] Persistencia de prospectos de mercadotecnia en tabla `marketing_prospects`
- [x] Motor interno de diagnostico y precotizacion en `marketing_prospects_service.py`
- [x] Modulo global interno `Prospectos MKT` en `/reinpia/marketing/prospectos`
- [x] Detalle interno por prospecto con estatus, notas y responsable
- [x] Alerta interna al crear solicitud (`marketing_prospect_new`)
- [x] Registro de trazabilidad (`new_marketing_prospect_request`)
- [x] Filtros internos por estatus, urgencia, fecha, canal y busqueda
- [x] Persistencia de objetivo principal (`main_goal`) y historial simple de estatus

## Entregables ejecucion 48 (Planes con IVA + cliente comercial + candados)
- [x] Catalogo publico de planes en `/api/v1/comercia/commercial-plans/catalog`
- [x] Landing COMERCIA mostrando planes y add-ons con IVA incluido (`price_with_tax_mxn`)
- [x] Modelo `CommercialClientAccount` para controlar cliente comercial y marcas padre/hijas
- [x] Campos en tenant para vinculo comercial: `commercial_client_account_id`, `is_parent_brand`
- [x] Modelo `CommercialPlanRequest` para upgrade/add-ons con trazabilidad
- [x] Modulo global `/reinpia/clientes-comerciales` con alta, edicion, asignacion de marcas y uso vs limites
- [x] Candado de limite de marcas por cliente comercial al crear/asignar tenant
- [x] Candado de limite de usuarios en alta de usuarios
- [x] Candado de limite de productos en alta de catalogo
- [x] Candado de limite de sucursales en POS
- [x] Botones en panel de marca para solicitar upgrade y add-ons
- [x] Alerta interna `commercial_plan_request` al crear solicitud
- [x] Migracion Alembic idempotente aplicada sin borrar data (`20260409_22`)
- [x] Validacion: `alembic upgrade head`, `python -m compileall app`, `npm run build`

## Entregables ejecucion 49 (Dashboard de marca por plan, consumo, soporte y add-ons)
- [x] Dashboard de marca alineado al plan contratado real del tenant
- [x] Bloque visible de plan: nombre, tipo, estado, activacion y soporte incluido
- [x] Bloques de capacidad/consumo: marcas, usuarios, agentes IA, productos, sucursales y creditos IA
- [x] Detalle de creditos IA: incluidos, extra, consumidos y restantes con medidor visual
- [x] Bloque de comision por venta visible (activa o desactivada)
- [x] Bloque de soporte por plan visible (correo/chat)
- [x] Bloque "Expandir capacidad" con add-ons y CTA de mejora de plan
- [x] Endpoint de uso comercial por tenant implementado (`GET /api/v1/commercial-plans/tenant/{tenant_id}/usage`)
- [x] Modulos avanzados (logistica/jornada/NFC) ocultos por defecto y condicionados por flags de contrato
- [x] Separacion de paneles reforzada: "Prospectos MKT" solo en panel global REINPIA
- [x] Configuracion internacional base visible por marca (pais, moneda, idioma, expansion, cross-border)
- [x] Validacion ejecutada: `npm run build` (frontend) y `python -m compileall app` (backend)

## Entregables ejecucion 50 (Comisionistas y visibilidad contable)
- [x] Capa de seguridad financiera por rol (`reinpia_admin|super_admin|contador`)
- [x] Nuevo router financiero `/api/v1/reinpia-finance/*` para vistas contables
- [x] Dashboard financiero con resumen ejecutivo y detalle por operacion
- [x] Filtros por cliente, marca, comisionista y periodo
- [x] Extensiones de comisionista: tipo interno/externo + asignacion cliente/marca
- [x] Nueva entidad de conciliacion `CommissionAgentSettlement`
- [x] Registro de liquidaciones restringido a super admin/reinpia admin
- [x] UI de pagos/contador en español con conciliacion (generada, distribuida, pagada, por pagar)
- [x] UI de comisionistas en modo lectura para contador (sin edicion directa)
- [x] Roles preparados en gestion de usuarios globales: `super_admin`, `contador`, `soporte`
- [x] Validacion ejecutada: `python -m compileall app` y `npm run build`

## Entregables ejecucion 51 (Alertas por capacidad critica)
- [x] Umbrales 80/90/100 aplicados a capacidades criticas.
- [x] Alertas para productos, usuarios, agentes IA, sucursales y creditos IA.
- [x] Dashboard de marca con barras y semaforo visual (verde/amarillo/rojo).
- [x] Mensajes claros de consumo por capacidad (ej. uso actual vs limite).
- [x] CTA por alerta: agregar capacidad / comprar add-on / actualizar plan.
- [x] Checkout de add-on Stripe test disparado desde alertas de marca.
- [x] Bloqueo controlado mantenido para altas nuevas sin romper operacion existente.
- [x] Replica de alertas al panel global y base de escalamiento interno (email/Telegram/bot).
- [x] Validacion ejecutada: backend compile + frontend build.

## Entregables ejecucion 52 (Creditos IA: UX, alerta y bloqueo inteligente)
- [x] Medidor tipo gasolina para creditos IA en dashboard de marca
- [x] Visualizacion de creditos totales, consumidos y restantes
- [x] Mensaje de saldo mensual ('Te quedan X de Y creditos este mes')
- [x] Umbral de advertencia al 30% de saldo restante
- [x] Umbral critico al 10% de saldo restante
- [x] Boton 'Comprar más créditos' conectado a checkout add-on extra_500_ai_credits
- [x] Mensaje de bloqueo inteligente al agotar creditos IA sin cortar operacion basica
- [x] Validacion ejecutada: backend compile + frontend build

## Entregables ejecucion 53 (Compra de add-ons en 1 clic por alertas/capacidad)
- [x] Mapeo central alerta/capacidad -> add-on oficial
- [x] Alertas de capacidad en dashboard de marca con CTA de compra add-on
- [x] Dashboard de marca con CTA contextual por bloque de consumo (80%+)
- [x] Panel global con bloque "marcas en riesgo" y CTA rapido add-on/upgrade
- [x] Checkout add-on reutiliza endpoint comercial unificado (Stripe test)
- [x] Checkout add-on envia contexto trazable: tenant, cuenta cliente, recurso origen, origen UI
- [x] Webhook Stripe aplica add-on comprado a tenant o cuenta comercial segun contexto
- [x] Recalculo de snapshot IA y alertas operativas post-compra
- [x] Mensaje de error UX unificado: "No fue posible iniciar la compra en este momento. Intenta nuevamente."
- [x] Validacion ejecutada: backend compile + frontend build

## Entregables ejecucion 54 (Reorganizacion arquitectura global alrededor del wizard)
- [x] Wizard conservado como flujo oficial de creacion (sin rehacer logica interna)
- [x] Sidebar global reorganizado por dominios (Creacion / Administracion / Vision ejecutiva / Configuracion)
- [x] Nuevo modulo global `Canales creados` (`/reinpia/canales-creados`)
- [x] Vista consolidada por cliente y marca para landing/publico/distribuidores/WebApp
- [x] Acceso directo a rutas activas de canales desde modulo administrativo unico
- [x] Limpieza de duplicados de rutas globales (`commission-agents` y `reports/commissions`)
- [x] Enlaces legacy `/tenants/*` retirados del flujo principal global de marcas
- [x] Validacion ejecutada: backend compile + frontend build

## Entregables ejecucion 55 (Add-ons visibles por rol con activacion comercial)
- [x] Logistica, Jornada laboral y NFC visibles siempre en panel de marca
- [x] Cliente/marca ve estado comercial y CTA de activacion sin acceso operativo si no contratado
- [x] Super admin puede revisar y operar modulos add-on completos
- [x] Super admin puede habilitar/deshabilitar y definir plan/scope por marca/sucursal
- [x] Nueva ruta NFC dedicada (`/admin/addons/nfc`) sin pantalla vacia
- [x] Navegacion de marca con etiquetas de estado comercial por add-on
- [x] Backend `brand-settings` habilitado para gestion de add-ons por rol `super_admin`
- [x] Rutas sin ruptura y modulo deshabilitado con UX informativa (no error/blank)
- [x] Validacion ejecutada: backend compile + frontend build

## Entregables ejecucion 56 (Landing principal ligera y subpaginas comerciales)
- [x] `/comercia` simplificada para vista ejecutiva sin saturacion
- [x] Subpagina `/comercia/precios` creada con planes, add-ons y CTA comerciales
- [x] Subpagina `/comercia/marketing` creada con beneficios y formulario
- [x] Subpagina `/comercia/consultoria` creada con diagnostico/revision/automatizacion y contacto
- [x] Navegacion publica integrada entre Inicio, Precios, Marketing y Consultoria
- [x] Contenido de detalle movido desde landing principal a subpaginas
- [x] Validacion ejecutada: frontend build + backend compile

## Entregables ejecucion 57 (Panel global por dominios funcionales)
- [x] Menu global reorganizado en `INICIO`, `CREACIÓN`, `ADMINISTRACIÓN`, `FINANZAS`, `OPERACIÓN INTERNA`
- [x] Dominio `CREACIÓN` limitado a Clientes, Marcas, Nueva marca y Wizard
- [x] Dominio `ADMINISTRACIÓN` limitado a Clientes comerciales, Marcas activas, Canales creados y Configuracion internacional
- [x] Dominio `FINANZAS` agrupado con Pagos, Comisiones, Planes/Add-ons y Tokens IA
- [x] Dominio `OPERACIÓN INTERNA` agrupado con Soporte, Alertas/Centinela, Seguridad, Prospectos y Usuarios internos
- [x] Limpieza de navegacion principal para sacar flujo legacy/mezclado
- [x] Wizard preservado y funcional sin rehacer logica
- [x] Validacion ejecutada: frontend build + backend compile
## Checklist - Correcciones panel cliente/marca (2026-04-13)

- [x] Botón `Comprar más créditos` funcional en resumen de marca.
- [x] Botón `Abrir Soporte Comercial` funcional y local (`/admin/contracts`).
- [x] Botón `Mejorar Plan` funcional sin salto al panel global.
- [x] Eliminado bloque separado de cliente principal/comercial en resumen.
- [x] `Marcas hijas` ya no navega al panel global.
- [x] Vista local de marcas hijas implementada (`/admin/brands/children`).
- [x] Sin botón global de crear marca en flujo local de marcas hijas.
- [x] `Ficha de marca activa` revisa principal/hijas con selector.
- [x] Menú de marca sin sección `Canales`.
- [x] Router actualizado con rutas locales de marca.
## Checklist - Orden del Panel Global (2026-04-14)

- [x] Panel Global organizado en 5 dominios: Inicio, Creacion, Administracion, Finanzas, Operacion interna.
- [x] INICIO mantiene solo dashboard global.
- [x] CREACION mantiene solo alta/setup inicial (Clientes, Marcas, Nueva marca, Wizard).
- [x] ADMINISTRACION mantiene activos creados y configuracion internacional.
- [x] FINANZAS concentra pagos, comisiones, planes/add-ons y tokens IA.
- [x] OPERACION INTERNA concentra soporte, alertas, seguridad, prospectos y usuarios internos.
- [x] Sin enlaces globales apuntando a rutas del panel de marca.
- [x] Sin duplicados en menu global principal.
- [x] Wizard y panel de marca permanecen separados del flujo global.
