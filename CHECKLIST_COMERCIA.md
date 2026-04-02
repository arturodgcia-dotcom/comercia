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
