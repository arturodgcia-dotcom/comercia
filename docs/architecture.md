# Arquitectura COMERCIA by REINPIA

## 1) Estado actual
Plataforma SaaS multitenant con:
- autenticacion JWT y roles
- ecommerce y catalogo por tenant
- pagos Stripe para ecommerce online/suscripciones
- pagos Mercado Pago para POS/WebApp
- growth comercial (fidelizacion, cupones, memberships, wishlist, reviews)
- operacion comercial (servicios, agendas, distribuidores, recurrencia, logistica, contratos digitales base)

## 2) Arquitectura de pagos por canal
Regla operativa actual:
- Stripe: ecommerce publico, ecommerce distribuidores, checkout online, suscripciones y planes con comision.
- Mercado Pago: POS/WebApp con cobro por link o QR (base Point preparada).
- NFC: identificacion/membresias/credenciales (no se usa para cobro bancario).

## 3) Flujo de dinero online (Stripe)
1. Storefront crea checkout session.
2. Se calcula subtotal, descuentos (cupon/puntos) y total.
3. Si plan tenant = `PLAN_2`, se aplica comision por item:
- <= 2000: 2.5%
- > 2000: 3%
4. Webhook Stripe actualiza `Order` y ejecuta post-procesos (puntos, cupon, citas de servicios).

## 4) Flujo de dinero POS/WebApp (Mercado Pago)
1. POS arma ticket y cliente.
2. Se genera transaccion Mercado Pago (`link` o `qr`) en `PosPaymentTransaction`.
3. Al confirmar pago, se registra `PosSale` y `PosSaleItem`.
4. POS integra fidelizacion (suma/uso de puntos) y deja trazabilidad por vendedor y punto de venta.

## 5) Flujo de servicios y agenda
1. Se define `ServiceOffering` por tenant.
2. Cliente compra servicio para si o como regalo desde storefront.
3. Checkout guarda payload de servicio/regalo en `Order`.
4. En pago exitoso se crea `Appointment`, se envia email y placeholder WhatsApp.

## 6) Flujo de regalo (MVP)
Campos de regalo soportados:
- remitente
- anonimo
- mensaje
- receptor (nombre, email, telefono)

Se persisten en `Order` y `Appointment`.

## 7) Flujo de distribuidores
1. Solicitud publica: `DistributorApplication`.
2. Admin aprueba/rechaza.
3. Aprobado crea `DistributorProfile` autorizado.
4. Se gestionan empleados con `DistributorEmployee`.

## 8) Contratos digitales base
- `ContractTemplate` (tenant/global)
- `SignedContract` con firma textual MVP:
  - signed_by_name
  - signed_by_email
  - signature_text
  - signed_at

No hay firma biometrica en esta fase.

## 9) Programacion recurrente
- `RecurringOrderSchedule` + `RecurringOrderItem`
- frecuencia semanal/quincenal/mensual
- base para ejecucion automatica posterior

## 10) Logistica base
- `LogisticsOrder` con estado operativo
- `LogisticsEvent` para trazabilidad
- acciones: programar, reprogramar, marcar entregado

## 9) Validacion local ejecutada
- `python -m compileall app` (backend)
- `alembic upgrade head` (SQLite local)
- `npm run build` (frontend)

## 10) Landings comerciales
- Landing corporativa COMERCIA:
  - ruta `/comercia`
  - mensajes de conversion y seleccion de paquetes
  - widget placeholder "Lia de COMERCIA"
- Landing tenant REINPIA:
  - ruta `/store/reinpia`
  - enfoque en servicios y captacion de agencias/distribuidores
  - widget placeholder "SofIA by REINPIA"

## 11) Seed tenant REINPIA
`init_db` crea/actualiza de forma idempotente:
- tenant `reinpia`
- branding y banners base
- categoria de servicios
- servicios demo orientados a implementacion/renta/automatizacion

## 12) Panel global REINPIA
Se agrego una capa de control multi-tenant para rol `reinpia_admin`:
- endpoints `/api/v1/reinpia/*`
- KPIs globales y por tenant
- resumen comercial:
  - ventas
  - comisiones
  - netos
- resumen operativo:
  - citas
  - logistica
  - distribuidores
- filtros:
  - `date_from`
  - `date_to`
  - `tenant_id`
  - `status`
  - `plan_id`
  - `business_type`

## 13) Exportes CSV
Reportes MVP exportables:
- `sales.csv`
- `commissions.csv`
- `tenants.csv`
- `orders.csv`

Objetivo: base estable para BI/reporting sin dependencias de Excel en esta fase.

## 14) Seguridad por rol
- Backend: dependencia `get_reinpia_admin`.
- Frontend: `RoleRoute` para vistas `/reinpia/*`.
- `tenant_admin` no accede al dashboard global multi-tenant.

## 15) Flujo de comisionistas y referidos
1. COMERCIA landing acepta clave de comisionista manual y por query param `?ref=CODIGO`.
2. Backend valida codigo en `SalesCommissionAgent`.
3. Se registra `PlanPurchaseLead` con trazabilidad completa del comprador y plan elegido.
4. Si hay codigo valido:
- `is_commissioned_sale=true`
- se crea alerta `commission_sale`
- se crea alerta `accountant_notice`
5. Si no hay codigo:
- se registra venta directa
- se crea alerta `direct_sale`
- se crea alerta `plan_purchase`
6. Si el lead solicita atencion o cita:
- `needs_followup` y/o `needs_appointment`
- alertas internas de seguimiento comercial.

## 16) Alertas internas y base para bots/WhatsApp
- `InternalAlert` centraliza eventos de operacion comercial y contable.
- `internal_alerts_service` expone creacion tipada de alertas legibles para equipo interno.
- base de integracion futura:
  - bots comerciales
  - notificaciones WhatsApp reales
  - derivacion automatica a procesos de backoffice

## 17) Exportes comerciales extendidos
Ademas de los CSV base de reporting, se exportan:
- `commission-agents.csv`
- `plan-purchase-leads.csv`

Esto habilita seguimiento de rendimiento por comisionista y control de pipeline de ventas de planes COMERCIA.

## 18) Estrategia de datos DEMO / APP limpia
Se implemento un esquema dual por ambiente con `DATA_MODE`:
- `demo`: ejecuta seed demo multi-tenant completo.
- `app`: limpia data demo y deja base minima lista para operacion real.
- `none`: no aplica seed automatico en startup.

Scripts operativos:
- `python -m app.db.seed_demo`
- `python -m app.db.seed_app_base`
- `python -m app.db.reset_demo`

Objetivo:
- soporte comercial para demos y ventas de plataforma
- paso controlado a operacion real sin datos ficticios
- idempotencia para evitar duplicados en ejecuciones repetidas

## 19) Demo dataset multi-tenant
Cobertura funcional de la demo:
- REINPIA (`reinpia`) para servicios y canal distribuidor.
- NATURA VIDA (`natura-vida`) para ecommerce de productos con plan 2 y comision.
- CAFE MONTE ALTO (`cafe-monte-alto`) para segundo tenant de productos con branding distinto.
- tenant demo inactivo para KPIs activos vs inactivos.

Incluye data para:
- storefront, catalogo, fidelizacion, cupones, memberships
- ordenes paid/failed, logistics y recurrencia
- comisionistas, leads de planes y alertas internas
- panel global REINPIA con metricas visibles desde primer arranque

## 20) Cierre funcional local
Se agregaron bloques de cierre para operacion demostrable local:
- onboarding vendedor y cliente con progreso por usuario
- base i18n ES/EN en admin, login, landing COMERCIA y storefront
- moneda por tenant (MXN/USD/EUR), tipos manuales y refresh automatico (fallback local)
- POS webapp base con ubicaciones, empleados, clientes y ventas
- fidelizacion integrada al flujo POS (uso y suma de puntos)
- separacion operativa de punto propio, franquicia y punto distribuidor por `location_type`
- base de automation/bots con eventos + plantillas + canales sin proveedor externo

## 21) Centinela seguridad / antifraude (MVP)
Se implemento un modulo de vigilancia operativa llamado "centinela":

Dominio:
- `SecurityEvent`: bitacora de eventos de riesgo.
- `SecurityRule`: umbrales y acciones configurables.
- `SecurityAlert`: alertas accionables para revision.
- `RiskScore`: scoring base por entidad.
- `BlockedEntity`: bloqueo temporal/manual de IP, usuario, cupon o referral.

Reglas iniciales:
- `LOGIN_FAIL_5_IN_10`
- `FAILED_PAYMENTS_3_IN_15`
- `COUPON_ABUSE_10_IN_30`
- `REFERRAL_ABUSE_8_IN_30`
- `ADMIN_ACTION_SPIKE`
- `WEBHOOK_FAILURE_REPEAT`

Integraciones actuales:
- Auth:
  - login fallido -> evento `login_failed`
  - login exitoso -> evento `login_success`
  - umbral excedido -> alerta + bloqueo temporal IP (si aplica)
- Pagos:
  - `payment_intent.payment_failed` -> evento + evaluacion de pagos fallidos
- Cupones:
  - validaciones fallidas repetidas -> evento `coupon_abuse`
- Comisionistas/referral:
  - codigos invalidos o uso anormal -> `referral_code_abuse` / `suspicious_commission_activity`
- Stripe webhooks:
  - falla de verificacion -> `webhook_verification_failed`
- POS:
  - venta con monto inusualmente alto -> `abnormal_pos_activity`

Paneles frontend REINPIA:
- `/reinpia/security`
- `/reinpia/security/alerts`
- `/reinpia/security/rules`
- `/reinpia/security/blocked`

Limitaciones MVP:
- no sustituye soluciones de seguridad perimetral (WAF/IDS/SIEM)
- no aplica bloqueo a nivel infraestructura de red
- no integra proveedores externos antifraude en esta fase
- sirve como capa de observabilidad, alertado y control interno base

## 22) Modulo de reportes e insights (tenant + REINPIA)
Se agrego una capa de reporting transversal para operacion, comercial y marketing:

Modelos de soporte:
- `ReportRequest` (preparado para solicitudes asinc/report queue en fases futuras)
- `ReportInsight` (insights sintetizados por reporte)
- `MarketingInsight` (insights accionables por tenant)

Servicios:
- `reporting_service.py`:
  - usuarios, ventas, memberships, loyalty
  - top/low/unsold products
  - categorias fuertes/debiles
  - distribuidores, logistica, servicios, citas
  - cupones y recompra (repeat vs new)
  - revenue timeseries
- `marketing_insights_service.py`:
  - reglas simples sin IA externa para recomendaciones comerciales accionables
- `report_export_service.py`:
  - export CSV por modulo tenant
- `reporting_periods.py`:
  - periodos: `day`, `week`, `fortnight`, `month`, `quarter`, `half_year`, `year`, `custom`
  - helper de rango y agrupacion temporal

Vistas tenant:
- `/admin/reports`
- `/admin/reports/sales`
- `/admin/reports/products`
- `/admin/reports/loyalty`
- `/admin/reports/distributors`
- `/admin/reports/logistics`
- `/admin/reports/services`
- `/admin/reports/marketing`

Vistas REINPIA ejecutivas:
- `/reinpia/reports/overview`
- `/reinpia/reports/growth`
- `/reinpia/reports/commissions`
- `/reinpia/reports/leads`
- `/reinpia/reports/marketing-opportunities`

Permisos:
- `tenant_admin` / `tenant_staff` / `reinpia_admin` acceden a reportes tenant
- `reinpia_admin` accede a reportes globales REINPIA
- `distributor_user` queda fuera de vistas admin de reportes

## 23) Ajuste de arquitectura madre/hijos y setup guiado
Se reforzo el modelo funcional:
- ComerCia = plataforma madre.
- Marcas cliente (tenants) = REINPIA, Natura Vida, Cafe Monte Alto, etc.

Nuevos bloques:
- workflow guiado de alta y publicacion por marca (wizard SaaS secuencial):
  - pasos bloqueados:
    1. identidad
    2. contenido base (prompt + IA)
    3. landing
    4. ecommerce
    5. POS/WebApp
    6. revision/publicacion
  - endpoints:
    - `GET/PUT /api/v1/brand-setup/{tenant_id}`
    - `POST /api/v1/brand-setup/{tenant_id}/generate-content`
    - `POST /api/v1/brand-setup/{tenant_id}/generate-landing`
    - `POST /api/v1/brand-setup/{tenant_id}/steps/{step_code}/approve`
- assets por etapa desde archivo local:
  - `POST /api/v1/brand-setup/{tenant_id}/assets`
- configuracion opcional por marca:
  - NFC por lotes (base)
  - Mercado Pago (base)
  - MFA TOTP / Google Authenticator (base de habilitacion)
  - `GET/PUT /api/v1/brand-setup/{tenant_id}/channel-settings`

Se guardan en `StorefrontConfig.config_json` para mantener compatibilidad local sin romper migraciones actuales:
- `current_step`
- estado por paso (`pending`, `in_progress`, `approved`)

## 24) Wizard oficial como orquestador de onboarding comercial
Arquitectura aplicada:
1. Backend `brand_setup` expone un `workflow` enriquecido con:
- `plan_snapshot` (plan comercial oficial, limites, metricas, creditos IA, add-ons).
- `channel_routes` (rutas reales de landing/publico/distribuidores/POS preview).
- `channel_runtime` (landing externa, modo revision, ultima regeneracion por canal).
- `wizard_status` (estado final operativo del onboarding).
- `blocking_issues` (bloqueos de publicacion por plan/limites).
2. El plan pagado manda:
- `billing_model` y comision se resuelven desde tenant cuando el plan esta `paid`.
- cambios manuales desde wizard quedan bloqueados salvo `force_plan_override`.
3. Plantillas oficiales forzadas:
- `approved_landing_v1`
- `approved_public_v1`
- `approved_b2b_v1`
4. Landing externa sin ruptura:
- URL externa se conserva como referencia comercial.
- preview interno tenant-aware siempre operativo.
- regeneracion interna disponible incluso con `has_existing_landing=true`.
5. Entitlements visibles y accionables:
- metricas de uso/limite para marcas, usuarios, agentes IA, productos, sucursales y creditos IA.
- advertencias y bloqueos cuando hay exceso.
6. Publicacion controlada:
- solo publica cuando pasos previos estan aprobados y no hay `blocking_issues`.
- estados de ciclo: `borrador` -> `en configuracion` -> `lista para revision` -> `lista para publicacion` -> `publicada`.

## 25) Arquitectura de checkout comercial publico (Stripe test)
1. Configuracion segura:
- `price_id` de planes/add-ons en `backend/.env` y `backend/.env.example`.
- cargados por `Settings` (`core/config.py`).
2. Catalogo comercial central:
- `commercial_plan_service.py` concentra definiciones de planes/add-ons y resuelve `stripe_price_id`.
- compatibilidad mantenida con llaves legacy de planes para flujos internos existentes.
3. Resolucion de compra:
- frontend landing envia solo `item_code` + `success_url` + `cancel_url`.
- backend resuelve `stripe_price_id` y crea sesion Stripe (modo test) con `line_items.price`.
4. Endpoints:
- `GET /api/v1/comercia/commercial-plans/catalog` (publico).
- `POST /api/v1/commercial-plans/create-checkout-session` (planes y add-ons).
5. Seguridad:
- sin hardcode de `price_id` en componentes de UI.
- logica Stripe concentrada en backend para evitar dispersion en frontend.
- `identity_data`, `generated_content`, `landing_draft`, `ecommerce_data`, `pos_setup_data`

Frontend nuevo:
- `/reinpia/brands/new`
- `/reinpia/brands/:tenantId/setup`
- `/admin/catalog/bulk-upload`
- `/admin/inventory`
- `/admin/feedback`

Seed demo adicional:
- marca `Instituto Zaro Latino` (`instituto-zaro-latino`) con:
  - identidad cargada
  - contenido base generado
  - landing demo aprobada (pasos 1-3 listos)

## 24) WebApp instalable (PWA) priorizada para POS
Se agrego base PWA para experiencia tipo app en celular:
- `manifest.webmanifest` con `display=standalone`, splash y branding ComerCia.
- `start_url` orientada a POS: `/pos`.
- `service worker` para cache basico de shell estatico, manifest e iconos.
- componentes UX:
  - `InstallAppPrompt` (boton â€œInstalar WebAppâ€)
  - `AppInstallHelp` (guia Android/iOS)
- rutas:
  - usuario con sesion: entra directo a POS
  - usuario sin sesion: guard redirige a login y vuelve a POS

Notas:
- NFC sigue siendo solo identificacion/credenciales.
- modo offline es basico (no cubre flujo completo de negocio/API/pagos).

## 25) Experiencia premium por marca (landing + ecommerce por canal)
Se elevo la capa visual y funcional por tenant con separacion real de canales:

- Storefront publico premium:
  - hero comercial, beneficios y bloques configurables
  - categorias, destacados, promociones, nuevos y mas vendidos
  - tarjetas de producto y detalle mejorados
- Storefront distribuidores separado:
  - home comercial distinta al canal publico
  - copy B2B, beneficios y reglas de volumen
  - enfoque en compra recurrente y catalogo mayorista

Esta separacion evita mezclar narrativa y experiencia de cliente final con la operacion comercial de distribuidores.

## 26) Dashboard de marca reorganizado
El admin tenant se reorganizo por modulos para reducir saturacion:
- Inicio
- Comercial
- Catalogo
- Clientes
- Operacion
- POS
- Reportes
- Configuracion

La navegacion incluye topbar con boton volver y breadcrumbs para ubicar al usuario en flujos largos.

## 27) Operacion visible: feedback, carga masiva e inventario
- Feedback moderable:
  - filtro por estado (pending/approved/rejected)
  - filtro por canal (publico/distribuidor)
  - acciones aprobar/rechazar
- Carga masiva:
  - descarga de plantilla CSV
  - validacion de columnas y filas
  - resumen de errores e importacion
- Inventario operativo:
  - stock por canal (publico/distribuidor/POS)
  - vista por producto con movimientos rapidos
  - base de stock por almacen en contexto local

## 28) Landing comercial de ComerCia (ajuste de mensaje)
- Se elimino copy tecnico visible en landing comercial (sin explicaciones internas de arquitectura).
- Mensaje actual orientado a:
  - valor comercial
  - canales de venta
  - servicios adicionales
  - cierre por diagnostico
- Boton "Hablar con un asesor" ahora conduce a flujo claro con Lia + formulario de diagnostico.

## 29) Lia como agente comercial conversacional
- Lia paso de bloque estatico a widget conversacional inicial:
  - pregunta objetivo del prospecto
  - recomienda IMPULSA o ESCALA
  - orienta dudas de logistica y activacion
  - lleva a diagnostico comercial para cierre
- Queda preparada la integracion posterior con IA externa sin romper la UX actual.

## 30) Servicios logisticos adicionales globales
Se agrego modulo global para registrar servicios logisticos que ComerCia brinda a marcas:
- tipo: recoleccion, entrega, ambos, resguardo
- origen/destino, kilometros, costo unitario
- subtotal, IVA, total, estatus y fecha de servicio
- resumen de facturacion por marca

Objetivo:
- control interno operativo
- trazabilidad comercial
- base para facturacion a la marca

Superficie:
- backend: `/api/v1/reinpia/logistics-services*`
- frontend: `/reinpia/logistics-services`

## 31) Visibilidad por rol (ajuste)
- Los modulos administrativos se restringen a:
  - `reinpia_admin`
  - `tenant_admin`
  - `tenant_staff`
- `distributor_user` y `public_customer` ya no acceden a paneles admin de marca o global.

## 32) Arranque local tipo SprintPilot
Se reforzo el arranque local con scripts confiables:
- `start_all.ps1` / `start_all.bat`:
  - valida `backend/.venv`
  - detecta puertos ocupados y usa siguiente disponible
  - muestra URLs utiles (docs, health, landing, store reinpia, login)
- `start_backend_only.ps1`:
  - valida `python-multipart` para endpoints con Form/File
  - soporta modo bootstrap para instalar faltantes
- `start_frontend_only.ps1`:
  - valida `frontend/node_modules`
  - detecta puerto ocupado
- `bootstrap_local.ps1`:
  - crea venv backend si falta
  - instala requirements backend
  - instala dependencias frontend si faltan

## Actualizacion arquitectura: trazabilidad de atencion comercial
Se incorpora un flujo paralelo al lead de compra de plan para soporte y atencion:
- Nuevo agregado de dominio: `CustomerContactLead`.
- Captura desde landing publica con `POST /api/v1/comercia/customer-contact-leads`.
- Consulta operativa para REINPIA con `GET /api/v1/reinpia/customer-contact-leads`.
- Al registrar contacto, se crea alerta interna de seguimiento comercial (`followup_required`).

Esto separa claramente:
- Diagnostico/compra de plan (`PlanPurchaseLead`).
- Atencion al cliente general (`CustomerContactLead`).

## Ajuste arquitectonico de captura comercial
Se unifica la bandeja comercial sobre `CustomerContactLead` con canales de origen:
- `lia_widget`
- `contacto`
- `diagnostico`
- `whatsapp`

Se incorpora actualizacion de estatus desde REINPIA:
- `PUT /api/v1/reinpia/customer-contact-leads/{id}`

Esto habilita un flujo de seguimiento comercial end-to-end sin depender de formularios aislados en frontend.

## Contextos de panel y navegacion (Ejecucion 33)
- Se implementa separacion explicita entre:
  - Administracion General de ComerCia (global)
  - Panel de Operacion de Marca (por tenant)
- Selector de contexto y marca activa para `reinpia_admin` con persistencia en sesion.
- Restriccion visual por rol/contexto:
  - roles de marca no ven menu global
  - contexto global no muestra modulos internos de marca como menu primario
- Reubicacion de monedas en navegacion:
  - Global: Monedas y tipos de cambio
  - Marca: Moneda de operación

## Conectividad API y Monedas (Ejecucion 36)
- Se centralizo la URL base del frontend en `frontend/src/services/api.ts` para evitar desalineacion entre modulos.
- En local, el esquema recomendado queda:
  - backend `8000` como base
  - fallback historico a `8001` (eliminado en Ejecucion 39)
- Se evitan puertos runtime efimeros almacenados previamente (ej. `8002`) cuando no forman parte de la configuracion local esperada.
- El modulo de Monedas deja de depender de un backend perfecto para renderizar:
  - siempre muestra UI util
  - incluye loading, error claro y reintento
  - muestra estado inicial editable cuando no hay respuesta de API
- Se unificaron consumos de URL absoluta en frontend:
  - assets del wizard de marca
  - exportes CSV de reportes REINPIA

## Ejecucion 37: permisos y paneles por contexto
- Se formalizo la arquitectura de dos contextos de administracion:
  - Global ComerCia (`reinpia_admin`).
  - Panel de operacion de marca (`tenant_admin`, `tenant_staff`, y `reinpia_admin` cuando opera una marca).
- Endpoints de tenant y branding ahora validan scope real por usuario.
- Se incorporaron endpoints administrativos:
  - `GET/PUT /api/v1/admin/platform-settings`
  - `GET/PUT /api/v1/admin/brand-settings/{tenant_id}`
  - `GET/POST/PUT /api/v1/admin/users`
- Se agrego entidad `PlatformSettings` para configuracion global de moneda e idioma.
- Monedas se divide en:
  - configuracion global de plataforma
  - configuracion de moneda por marca con herencia global opcional.
- Se evita que cuentas de marca creen o administren otras marcas desde backend y frontend.

## Ejecucion 38: canales de marca conectados a plantillas reales por tenant
- Se agrega una capa de "centro de control de canal" en frontend para la operacion de marca:
  - Landing de la marca
  - Ecommerce publico
  - Ecommerce distribuidores
  - POS / WebApp
- Los modulos dejan de navegar a cascarones genericos y ahora resuelven datos reales del tenant activo via:
  - `GET /api/v1/tenants/{tenant_id}/storefront-config`
  - branding, catalogo, distribuidores, POS y channel settings por tenant
- El tenant activo se toma desde el selector de contexto (`sessionStorage`) para `reinpia_admin` en modo marca, y desde `user.tenant_id` para usuarios de marca.
- Se unifica la operacion por canal con estados de publicacion y acciones de lifecycle:
  - ver vista real
  - preview
  - editar modulo relacionado
  - regenerar plantilla (restringido a `reinpia_admin`)
- POS se alinea a esta arquitectura: ya no usa fallback hardcodeado de tenant; opera con tenant activo real.

## Ejecucion 39: correccion de rutas reales y consistencia de canal
- Se elimina fallback hardcodeado al puerto `8001` en cliente API frontend para evitar desalineacion de endpoint.
- Se agrega landing interna tenant-aware publica:
  - `/store/:tenantSlug/landing`
  - separa claramente landing de marca vs ecommerce publico.
- Politica de URL externa de landing:
  - URL externa valida y resoluble: se abre directa.
  - URL demo/no desplegada (`.demo`, `.local`, `.invalid`): se informa y se usa fallback interno.
- Acciones de regeneracion por canal:
  - global admin: flujo real de regeneracion.
  - usuario de marca: stub operativo con timestamp y confirmacion visible.
- POS principal de canal se normaliza a ruta tenant-aware:
  - `/pos?tenant_id={tenantId}`

## Ejecucion 40: módulo independiente Diagnóstico inteligente
Se agrega un nuevo modulo desacoplado del wizard de marca y de la generacion de landing/ecommerce.

Objetivo:
- evaluar la marca activa desde tres perspectivas:
  - SEO
  - AEO
  - identidad de marca
- generar recomendaciones accionables para cliente y equipo interno.

Arquitectura:
- backend:
  - nueva entidad `BrandDiagnostic`
  - servicio `brand_diagnostics_service`
  - endpoint router `brand_diagnostics.py`
- frontend:
  - vista de marca: `/admin/diagnostico-inteligente`
  - vista global base: `/reinpia/diagnosticos`
  - navegacion integrada en bloque Comercial de marca.

Persistencia por analisis:
- `tenant_id`, `analyzed_at`, `status`
- scores `seo`, `aeo`, `branding`, `global`
- hallazgos por eje
- recomendaciones por prioridad
- resumen ejecutivo
- siguientes acciones
- contexto usado y datos faltantes
- plan de mejora editable

Endpoints:
- `POST /api/v1/brand-diagnostics/{tenant_id}/analyze`
- `POST /api/v1/brand-diagnostics/analyze-external-url`
- `GET /api/v1/brand-diagnostics/{tenant_id}/latest`
- `GET /api/v1/brand-diagnostics/{tenant_id}/latest-external`
- `GET /api/v1/brand-diagnostics/{tenant_id}`
- `POST /api/v1/brand-diagnostics/{tenant_id}/improvement-plan`
- `GET /api/v1/reinpia/diagnostics`

Regla de diseño:
- no modifica wizard ni onboarding.
- opera como modulo paralelo de evaluacion comercial y de visibilidad.

## Ejecucion 41: extension a auditoria de URL externa
- El modulo mantiene analisis interno de tenant y suma un flujo externo en la misma pantalla:
  - `Analizar marca activa`
  - `Analizar URL externa`
- Backend agrega lectura HTML basica con timeout y parser sin navegador headless:
  - title
  - meta description
  - headings (H1/H2/H3)
  - texto principal
  - CTA detectables
  - senales de contacto/formulario
- Persistencia compartida en `brand_diagnostics` con separacion logica por contexto:
  - `analysis_type`: `internal_brand` o `external_url`
  - `source_url`: URL auditada para casos externos

## Ejecucion 42: arquitectura oficial de plantillas por canal
Objetivo estructural:
- eliminar ambiguedad entre demo/preview/storefront oficial
- fijar motor oficial por tenant en landing, ecommerce publico y ecommerce distribuidores

Persistencia oficial por tenant (`StorefrontConfig.config_json`):
- `landing_template`
- `public_store_template`
- `distributor_store_template`
- `channel_templates` (objeto espejo normalizado)
- compatibilidad legacy: `workflow.selected_template` para landing

IDs oficiales activos:
- `approved_landing_v1`
- `approved_public_v1`
- `approved_b2b_v1`

Capa central de resolucion (frontend):
- `resolveLandingTemplate(templateId)`
- `resolvePublicStoreTemplate(templateId)`
- `resolveDistributorStoreTemplate(templateId)`
- archivo: `frontend/src/branding/channelTemplateResolver.tsx`

Rutas oficiales conectadas al resolver:
- `/store/:tenantSlug/landing`
- `/store/:tenantSlug`
- `/store/:tenantSlug/distribuidores`

Integracion de setup y operacion:
- Wizard persiste plantilla oficial por paso/canal.
- Panel de marca lee plantilla activa desde config oficial y expone:
  - plantilla activa
  - ruta oficial
  - preview tenant-aware
  - estado y ultima regeneracion

## Ejecucion 43: arquitectura de modelos comerciales por tenant
Objetivo:
- habilitar dos modelos comerciales oficiales por marca:
  - `fixed_subscription`
  - `commission_based`

Persistencia estructural:
- columnas en `tenants`:
  - `billing_model`
  - `commission_percentage`
  - `commission_enabled`
  - `commission_scope`
  - `commission_notes`
- sincronizacion en workflow (`StorefrontConfig.config_json`) via `brand_setup`:
  - `billing_model`
  - `commission_percentage`
  - `commission_enabled`
  - `commission_scope`
  - `commission_notes`

Reglas de coherencia:
- `fixed_subscription` fuerza `commission_enabled=false`
- `commission_based` fuerza `commission_enabled=true`
- `plan_type` legado se sincroniza automaticamente:
  - `commission_based` -> `commission`
  - `fixed_subscription` -> `subscription`

Superficies integradas:
- alta de marca (`/reinpia/brands/new`)
- wizard de setup (paso identidad)
- panel global (marcas, detalle, pagos, reportes)
- panel de marca (canales)

## Ejecucion 44: plan comercial gobernado por Stripe checkout
Objetivo:
- que el plan comercial no sea una seleccion manual aislada en wizard
- que el pago en Stripe determine plan activo, comision y limites operativos reales
- habilitar control interno de creditos IA con apertura/cierre de llave por tenant

Nucleo de arquitectura:
- servicio central: `backend/app/services/commercial_plan_service.py`
  - catalogo oficial de planes:
    - `fixed_subscription_basic|growth|premium`
    - `commission_based_basic|growth|premium`
  - add-ons oficiales y calculo de IVA
  - aplicacion atomica del plan al tenant (`apply_plan_to_tenant`)
  - control de creditos IA (`consume_tokens`, `topup_tokens`, `set_tokens_lock`)

Flujo oficial Stripe -> tenant:
1. `POST /api/v1/commercial-plans/create-checkout-session`
2. Stripe Checkout completa pago
3. webhook `POST /api/v1/stripe/webhook` recibe `checkout.session.completed`
4. si `metadata.kind=tenant_commercial_plan`:
   - se aplica plan al tenant
   - se sincroniza `billing_model`, `commission_enabled`, `% comision`
   - se guardan limites operativos
   - se inicializan creditos IA y estado de llave

Persistencia tenant (nueva):
- `commercial_plan_key`
- `commercial_plan_status`
- `commercial_plan_source`
- `commercial_checkout_session_id`
- `commercial_limits_json`
- `ai_tokens_included`
- `ai_tokens_balance`
- `ai_tokens_used`
- `ai_tokens_locked`
- `ai_tokens_lock_reason`
- `ai_tokens_last_reset_at`

Integracion con capas existentes:
- `tenant_config` ahora expone `commercial_plan_key/status`, `limits`, `ai_tokens_balance`, `ai_tokens_locked`
- `brand_setup` expone plan comercial y estado de creditos IA para que wizard lea el estado pagado
- `analytics_service` incorpora metricas de plan comercial y llave IA en KPIs globales y por tenant

## Ejecucion 45: arquitectura de captacion marketing en landing COMERCIA
Objetivo:
- convertir la seccion marketing en un flujo util de pre-cotizacion
- priorizar formulario de entrada real y salida ejecutiva accionable

Componentes:
- Formulario de brief comercial (frontend) en `#marketing-diagnostico`
  - basado en campos de `Ejemplo Input MKT`
- Motor de clasificacion interna local (frontend)
  - complejidad, madurez digital, intensidad y potencial
  - aplicado solo para decidir cotizacion preliminar
- Generador de salida ejecutiva
  - formato de 10 puntos definido en CODEX marketing
  - resultado visible en la misma seccion para revision inmediata

Nota de alcance:
- aplica solo a landing principal COMERCIA (captacion)
- no se propaga a templates tenant/storefront

## Ejecucion 46: hard lock de templates oficiales por canal
Objetivo:
- retirar templates legacy del flujo principal tenant-aware
- dejar un unico motor oficial por canal para evitar ambiguedad demo/preview/produccion

Arquitectura activa:
- `landing_template = approved_landing_v1`
- `public_store_template = approved_public_v1`
- `distributor_store_template = approved_b2b_v1`

Puntos de control:
- resolver frontend por canal siempre devuelve el componente oficial:
  - `resolveLandingTemplate(...)`
  - `resolvePublicStoreTemplate(...)`
  - `resolveDistributorStoreTemplate(...)`
- `brand_setup` en backend normaliza y persiste siempre IDs oficiales en `config_json`
- `workflow.selected_template` queda forzado al oficial de landing para compatibilidad

Rutas productivas oficiales:
- `/store/:tenantSlug/landing`
- `/store/:tenantSlug`
- `/store/:tenantSlug/distribuidores`

Rutas legacy/demo:
- `/templates/*` y `/demo/*` no participan como motor principal de canales por marca.

## Ejecucion 47: separacion publica vs interna en mercadotecnia COMERCIA
Objetivo:
- mantener la landing publica en enfoque comercial
- mover diagnostico y precotizacion al panel interno REINPIA

Arquitectura final:
1) Capa publica (landing COMERCIA)
- ruta: `/comercia` (seccion `#marketing-diagnostico`)
- solo muestra:
  - explicacion comercial del servicio
  - formulario de solicitud
  - mensaje de confirmacion
- endpoint de captura:
  - `POST /api/v1/comercia/marketing-prospects`

2) Capa interna (panel global)
- ruta: `/reinpia/marketing/prospectos`
- funcionalidades:
  - listado de prospectos por estatus/urgencia
  - detalle interno con datos originales
  - diagnostico ejecutivo interno
  - precotizacion sugerida
  - notas internas y responsable
- endpoints internos:
  - `GET /api/v1/reinpia/marketing-prospects`
  - `GET /api/v1/reinpia/marketing-prospects/{id}`
  - `PUT /api/v1/reinpia/marketing-prospects/{id}`

3) Persistencia y motor interno
- tabla: `marketing_prospects`
- migracion: `20260409_19_marketing_prospects_internal.py`
- migracion incremental: `20260409_20_marketing_prospects_goal_history.py`
- servicio: `marketing_prospects_service.py`
  - genera salida interna en 10 secciones
  - calcula rango y sugerencia de precotizacion
  - guarda servicios recomendados y riesgos
  - separa datos capturados del prospecto y resultado interno de COMERCIA
  - agrega `main_goal` y `status_history` para gestion comercial

4) Alertas internas
- al crear prospecto:
  - se genera alerta `marketing_prospect_new`
  - se registra evento `new_marketing_prospect_request`

Nota de control:
- la salida analitica y de cotizacion ya no se expone en la landing publica.

## Ejecucion 48: arquitectura de cuentas comerciales, limites y crecimiento
Objetivo:
- controlar consumo real por cliente comercial (marca padre/hijas)
- evitar sobreasignacion gratuita fuera del plan
- permitir upgrade/add-ons desde panel de marca con flujo interno trazable

Modelo de dominio:
- `CommercialClientAccount`:
  - agrupa marcas de un mismo cliente comercial
  - define `billing_model`, `commercial_plan_key`, `commercial_limits_json`, `addons_json`, `status`
- `Tenant`:
  - `commercial_client_account_id` (vinculo a cuenta comercial)
  - `is_parent_brand` (marca principal del grupo)
- `CommercialPlanRequest`:
  - solicitud de upgrade o add-on originada por marca/panel
  - estatus y notas para gestion interna.

Arquitectura de enforcement:
1. Resolver de limites efectivos:
   - servicio `commercial_account_guard_service.py`
   - combina limites base del plan + add-ons activos.
2. Guardas transaccionales en endpoints criticos:
   - marcas (`tenants.py`)
   - usuarios (`users_admin.py`)
   - productos (`products.py`)
   - sucursales POS (`pos.py`)
3. Si se excede limite:
   - se bloquea operacion con mensaje comercial claro.

Arquitectura de crecimiento comercial:
- Panel de marca (`BrandChannelPages`) crea solicitudes:
  - upgrade de plan
  - add-ons
- Endpoint: `POST /api/v1/commercial-plans/requests`
- Se crea alerta interna `commercial_plan_request` para seguimiento REINPIA.

Catalogo y precios publicos:
- Endpoint publico: `GET /api/v1/comercia/commercial-plans/catalog`
- Fuente: catalogo oficial de planes y add-ons
- Visualizacion frontend con `price_with_tax_mxn` (IVA incluido), evitando riesgo de exhibir precios sin impuesto.

Migraciones:
- `20260409_22_commercial_client_accounts_and_limits.py`
  - crea tablas nuevas necesarias
  - agrega columnas nuevas en `tenants`
  - idempotente para no romper bases con tablas ya existentes.

## Ejecucion 49: dashboard de marca gobernado por plan contratado
Objetivo:
- alinear el panel de marca al plan comercial real del tenant y su consumo operativo.
- separar claramente capacidades de marca vs administracion global ComerCia.

Arquitectura aplicada:
1) Fuente comercial por tenant
- `tenant_plan_status_payload` expone:
  - `plan_display_name`
  - `support`
  - `plan_activated_at`
- origen: estado comercial persistido en `Tenant` + catalogo comercial central.

2) Capa de uso/capacidad
- nuevo endpoint:
  - `GET /api/v1/commercial-plans/tenant/{tenant_id}/usage`
- agrega metrica de consumo real por tenant:
  - marcas, usuarios, agentes IA, productos, sucursales
  - sucursales activas/inactivas
  - creditos IA incluidos/usados/restantes
  - add-ons activos y cantidad.

3) Configuracion administrativa de marca
- `admin_settings` incorpora dos bloques nuevos en `StorefrontConfig.config_json`:
  - `international`:
    - `country_code`
    - `expansion_enabled`
    - `cross_border_enabled`
  - `features`:
    - `logistics_enabled`
    - `workday_enabled`
    - `nfc_operations_enabled`
- estos flags gobiernan visibilidad de modulos avanzados en panel de marca.

4) Separacion de paneles
- Global REINPIA mantiene:
  - pagos, planes, add-ons, alertas, configuracion internacional, marketing prospectos.
- Panel de marca mantiene:
  - dashboard de plan/consumo, soporte, add-ons y operacion de su tenant.
- `Prospectos MKT` queda solo en contexto global.

5) UI de dashboard de marca
- bloque ejecutivo:
  - plan contratado, estado, activacion, soporte.
- bloque de capacidad:
  - usados/permitidos/disponibles por recurso.
- bloque comision:
  - estado activo/desactivado, porcentaje y ventas sujetas.
- bloque soporte:
  - canal correo/chat y base de escalamiento.
- bloque expansion:
  - solicitud de add-ons y mejora de plan.

## Ejecucion 50: arquitectura contable y comisionistas
Objetivo:
- dar visibilidad financiera real a contador y super admin sin abrir toda la administracion global.

Capa de acceso:
- `get_finance_view_user` habilita lectura financiera para:
  - `reinpia_admin`
  - `super_admin`
  - `contador`
- `get_reinpia_admin` mantiene operaciones de escritura restringidas para:
  - `reinpia_admin`
  - `super_admin`

Router financiero dedicado:
- `GET /api/v1/reinpia-finance/dashboard`
- `GET /api/v1/reinpia-finance/tenants/summary`
- `GET /api/v1/reinpia-finance/commercial-client-accounts`
- `GET /api/v1/reinpia-finance/commission-agents`
- `GET /api/v1/reinpia-finance/commission-agents/{agent_id}/summary`
- `POST /api/v1/reinpia-finance/settlements` (solo admin global)

Modelo de comisionistas:
- `SalesCommissionAgent` extendido con:
  - `agent_type` (`interno` | `externo`)
  - `commercial_client_account_id`
  - `tenant_id`

Modelo de conciliacion:
- nueva entidad `CommissionAgentSettlement` para registrar pagos realizados a comisionistas.
- el dashboard financiero calcula:
  - comision generada (desde ordenes pagadas)
  - comision distribuida (segun porcentaje de comisionista asignado)
  - comision pagada (desde liquidaciones)
  - comision pendiente

Frontend:
- `ReinpiaPaymentsPage` se convierte en panel contable con:
  - filtros por cliente/marca/comisionista/periodo
  - alternancia entre resumen ejecutivo y detalle por operacion
  - bloque de conciliacion
- `ReinpiaCommissionAgentsPage`:
  - contador en solo lectura
  - super admin/reinpia admin con edicion y asignaciones

## Ejecucion 51: alertas de capacidad critica y accion directa
- El servicio operational_alerts_service ahora usa umbrales 80/90/100 para capacidad.
- Se emiten alertas de capacidad para: productos, usuarios, agentes IA, sucursales y creditos IA.
- Las alertas de marca se reflejan tambien en nivel cliente principal para visibilidad contable/global.
- Se registra evento de escalamiento interno (sentinel_operational_alert) con canales preparados: email, Telegram y bot interno.
- En dashboard de marca, cada alerta incorpora CTAs para checkout de add-on (Stripe test) o upgrade de plan.

## Ejecucion 52: UX de creditos IA y continuidad operativa
- El dashboard de marca implementa una capa de lectura operativa de creditos IA con medidor visual tipo gasolina.
- Se aplican umbrales de estado en frontend para saldo restante (30% advertencia, 10% critica).
- El CTA 'Comprar más créditos' dispara checkout comercial Stripe test del add-on extra_500_ai_credits.
- Al llegar a 0 creditos se comunica bloqueo de funciones IA no criticas, manteniendo acceso a panel, ventas y operacion basica.
