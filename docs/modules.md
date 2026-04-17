# Modulos ComerCia - Estado

## Actualizacion Sprint 1 (2026-04-15)
- Panel global reorganizado por dominios funcionales con menu limpio.
- Separacion clara entre setup inicial (wizard), operacion de marca y administracion global.
- Soporte global backoffice activo en /reinpia/support-backoffice.
- Comercial interno separado en /reinpia/commercial-inbox y /reinpia/marketing/prospectos.
- Consolidacion comercial de marca en dashboard (plan, limites, uso, creditos IA, add-ons, upgrade).
- Limpieza de legado visible: removidas rutas placeholder de login distribuidor/POS.

| Modulo | Estado | Notas |
|---|---|---|
| Auth y usuarios | Inicial funcional | JWT login/me + roles |
| Tenants y branding | Inicial funcional | CRUD tenant + branding por tenant |
| Storefront multitenant | Inicial funcional | home-data, distributors, services por slug |
| Catalogo ecommerce | Inicial funcional | categorias/productos CRUD por tenant |
| Pagos Stripe (online) | Inicial funcional | Ecommerce publico/distribuidores + suscripciones + checkout online + plan 2 con comision |
| Pagos Mercado Pago (POS/WebApp) | Base funcional | Config por marca + link/QR + confirmacion de pago POS + base Point |
| Fidelizacion | Inicial funcional | programa, cuenta, puntos |
| Cupones | Inicial funcional | CRUD + validate + uso |
| Memberships | Inicial funcional | CRUD por tenant |
| Banners dinamicos | Inicial funcional | posicion/target/prioridad/vigencia |
| Wishlist | Inicial funcional | add/list/delete |
| Reviews + moderacion | Inicial funcional | submit pending + approve + reject + filtro por estatus |
| Servicios y agenda | Inicial funcional | servicios CRUD + citas self/gift |
| Distribuidores | Inicial funcional | applications + profiles + employees |
| Contratos digitales | Inicial funcional | templates + firma textual |
| Ordenes recurrentes | Base funcional | schedule + items |
| Logistica | Base funcional | ordenes + eventos + schedule/reschedule/delivered |
| Servicios logisticos adicionales globales | Inicial funcional | registro por marca para control operativo y facturacion |
| Landing corporativa ComerCia | Inicial funcional | ruta `/comercia`, enfoque conversion, paquetes y lead form |
| Landing tenant REINPIA | Inicial funcional | ruta `/store/reinpia`, enfoque servicios y canal distribuidor |
| Seed tenant demo REINPIA | Inicial funcional | tenant + branding + banners + 6 servicios de demo |
| Panel global REINPIA | Inicial funcional | dashboard multi-tenant con KPIs, filtros y detalle por tenant |
| Reporting / export CSV | Inicial funcional | exportes de ventas, comisiones, tenants, ordenes, comisionistas y plan purchase leads |
| Reportes tenant e insights marketing | Inicial funcional | reportes por modulo + recomendaciones accionables |
| Seguridad por rol global | Inicial funcional | acceso `/reinpia/*` restringido a `reinpia_admin` |
| Comisionistas comerciales | Inicial funcional | CRUD de agentes, codigo unico, resumen y KPIs |
| Referidos y leads de plan | Inicial funcional | `SalesReferral` + `PlanPurchaseLead` con trazabilidad por codigo |
| Alertas internas | Inicial funcional | alertas para seguimiento comercial y aviso contable |
| Landing ComerCia lead capture | Inicial funcional | formulario real + soporte `?ref=` + registro backend |
| Modo DEMO de datos | Inicial funcional | seed multi-tenant idempotente para pruebas comerciales y demos |
| Modo APP limpio | Inicial funcional | base minima sin data demo comercial |
| Reset de demo | Inicial funcional | limpieza controlada de tenants/usuarios/datos demo |
| Onboarding vendedor/cliente | Inicial funcional | guias, pasos, progreso y vistas `/onboarding/*` |
| Internacionalizacion (i18n) | Base funcional | ES/EN con selector global y persistencia local |
| PWA instalable (POS prioridad) | Inicial funcional | manifest + service worker + prompt instalacion + ayuda Android/iOS |
| Monedas y tipo de cambio | Inicial funcional | settings por tenant + rates manual/refresh + preview |
| POS / WebApp base | Inicial funcional | ubicaciones, empleados, clientes, ventas POS y pagos Mercado Pago |
| Fidelizacion en POS | Base funcional | uso/suma de puntos en cierre de venta |
| Automation bots/WhatsApp | Inicial funcional | eventos, canales y templates + envio WhatsApp Meta Cloud API con validacion explicita de credenciales |
| Centinela seguridad/antifraude | Inicial funcional | eventos, reglas, alertas, bloqueos y panel REINPIA security |
| Workflow guiado de alta de marca | Inicial funcional | wizard secuencial SaaS (6 pasos bloqueados) + generacion de contenido/landing + aprobacion y publicacion |
| Media assets por etapa | Base funcional | carga de archivos locales por etapa de setup |
| Configuracion NFC/Mercado Pago/MFA | Base funcional | NFC opcional identificacion, Mercado Pago para POS, MFA por marca |
| Carga masiva catalogo | Inicial funcional | descarga plantilla + validacion de columnas/filas + resumen de errores e importacion |
| Inventario operativo | Inicial funcional | stock por canal + resumen KPI + movimientos rapidos |
| Retroalimentacion moderable visible | Inicial funcional | filtros por estado/canal + aprobar/rechazar + cola de moderacion |
| Storefront publico premium | Inicial funcional | home retail con hero, banners, carruseles y tarjetas mejoradas |
| Storefront distribuidores separado | Inicial funcional | home comercial B2B con beneficios, volumen y compra recurrente |
| Dashboard de marca reorganizado | Inicial funcional | modulos agrupados + topbar con volver y breadcrumbs |
| Arranque local unificado | Inicial funcional | scripts robustos con bootstrap, deteccion de puertos y URLs utiles |
| Diagn�stico inteligente | Inicial funcional | modulo independiente para evaluar SEO, AEO e identidad por marca |
| Bots / agentes | Base arquitectura | pendiente implementacion |
| Lia agente comercial | Base funcional | widget conversacional con recomendacion de plan y envio a diagnostico |
| Visibilidad por rol en admin | Inicial funcional | distributor/public fuera de modulos admin de marca/global |

## Endpoints operacion comercial (nuevos)
- `/api/v1/services/*`
- `/api/v1/appointments/*`
- `/api/v1/distributors/*`
- `/api/v1/contracts/*`
- `/api/v1/recurring-orders/*`
- `/api/v1/logistics/*`
- `/api/v1/storefront/{tenant_slug}/services`

## Endpoints REINPIA global y comisionistas
- `/api/v1/reinpia/dashboard/*`
- `/api/v1/reinpia/tenants/*`
- `/api/v1/reinpia/payments/*`
- `/api/v1/reinpia/appointments/*`
- `/api/v1/reinpia/logistics/*`
- `/api/v1/reinpia/distributors/*`
- `/api/v1/reinpia/exports/*`
- `/api/v1/reinpia/commission-agents/*`
- `/api/v1/reinpia/referrals*`
- `/api/v1/reinpia/plan-purchase-leads*`
- `/api/v1/reinpia/alerts*`
- `/api/v1/reinpia/reports/overview`
- `/api/v1/reinpia/reports/tenants-growth`
- `/api/v1/reinpia/reports/commissions`
- `/api/v1/reinpia/reports/leads`
- `/api/v1/reinpia/reports/marketing-opportunities`
- `/api/v1/reinpia/reports/commercial-summary`
- `/api/v1/reinpia/logistics-services`
- `/api/v1/reinpia/logistics-services/{id}`
- `/api/v1/reinpia/logistics-services-summary`
- `/api/v1/comercia/plan-purchase-leads`
- `/api/v1/comercia/referral/{code}`
- `/api/v1/brand-setup/{tenant_id}/generate-content`
- `/api/v1/brand-setup/{tenant_id}/generate-landing`
- `/api/v1/brand-setup/{tenant_id}/steps/{step_code}/approve`

## Endpoints reportes tenant
- `/api/v1/reports/tenant/{tenant_id}/overview`
- `/api/v1/reports/tenant/{tenant_id}/users`
- `/api/v1/reports/tenant/{tenant_id}/sales`
- `/api/v1/reports/tenant/{tenant_id}/memberships`
- `/api/v1/reports/tenant/{tenant_id}/loyalty`
- `/api/v1/reports/tenant/{tenant_id}/products/top-selling`
- `/api/v1/reports/tenant/{tenant_id}/products/low-selling`
- `/api/v1/reports/tenant/{tenant_id}/products/unsold`
- `/api/v1/reports/tenant/{tenant_id}/distributors`
- `/api/v1/reports/tenant/{tenant_id}/logistics`
- `/api/v1/reports/tenant/{tenant_id}/services`
- `/api/v1/reports/tenant/{tenant_id}/marketing-insights`
- `/api/v1/reports/tenant/{tenant_id}/export/*.csv`

## Endpoints centinela seguridad
- `/api/v1/security/events`
- `/api/v1/security/alerts`
- `/api/v1/security/alerts/{id}/read`
- `/api/v1/security/rules`
- `/api/v1/security/rules/{id}`
- `/api/v1/security/rules/{id}/toggle`
- `/api/v1/security/blocked-entities`
- `/api/v1/security/blocked-entities/{id}/unblock`
- `/api/v1/security/kpis`

## Endpoints diagn�stico inteligente
- `POST /api/v1/brand-diagnostics/{tenant_id}/analyze`
- `POST /api/v1/brand-diagnostics/analyze-external-url`
- `GET /api/v1/brand-diagnostics/{tenant_id}/latest`
- `GET /api/v1/brand-diagnostics/{tenant_id}/latest-external`
- `GET /api/v1/brand-diagnostics/{tenant_id}`
- `POST /api/v1/brand-diagnostics/{tenant_id}/improvement-plan`
- `GET /api/v1/reinpia/diagnostics`

## Actualizacion modulo Diagn�stico inteligente
- Nuevo modulo desacoplado del wizard de setup.
- Disponible en panel de marca:
  - `/admin/diagnostico-inteligente`
- Vista global base para REINPIA:
  - `/reinpia/diagnosticos`
- Analisis inicial por reglas semanticas y estructurales:
  - SEO: headline/subheadline/CTA/estructura/contacto/oferta/indexacion base.
  - AEO: capacidad de responder que hace la marca, para quien, beneficios y bloques reutilizables por IA.
  - Identidad: claridad de promesa, diferenciacion, alineacion con industria y coherencia de CTA.
- Persistencia por ejecucion en `brand_diagnostics`:
  - scores
  - hallazgos
  - recomendaciones
  - resumen ejecutivo
  - siguientes acciones
  - contexto usado y datos faltantes
  - plan de mejora guardable
  - tipo de analisis (`internal_brand` / `external_url`) y URL origen cuando aplica

## Actualizacion diagnostico externo por URL
- En la misma ruta `/admin/diagnostico-inteligente` se agregan dos modos:
  - Marca activa
  - URL externa
- El analisis externo permite pegar una URL `http/https`, leer HTML base (title, meta description, headings, texto, CTA y contacto) y calcular scores SEO/AEO/identidad.
- El resultado externo se muestra separado del interno y queda persistido en historial del tenant.

## Actualizacion: trust/compliance y conversion en landing
Nuevos componentes y capacidades:
- `CookieConsentBanner` + `CookiePreferencesModal` con persistencia local de consentimiento.
- Paginas legales publicas de privacidad, cookies y proteccion de datos.
- Seccion de video YouTube configurable por entorno (`VITE_COMERCIA_YOUTUBE_URL`).
- Formulario de atencion al cliente separado del diagnostico comercial.
- L�a evolucionada a experiencia conversacional comercial (diagnostico + recomendacion + CTA de cierre).
- Footer de landing reforzado con enlaces legales y de contacto.

Nuevos endpoints:
- `POST /api/v1/comercia/customer-contact-leads`
- `GET /api/v1/reinpia/customer-contact-leads`

## Actualizacion UX comercial
- L�a migrada a widget flotante conversacional con acciones de cierre.
- Diagnostico comercial presentado como modal/subflujo.
- Seccion "Cont�ctanos" separada y orientada a conversion.
- Copy de retos comerciales ajustado (se elimina etiqueta "Dolor").

## Modulo interno de seguimiento
- `ReinpiaCommercialInboxPage` centraliza contacto, leads de L�a, diagnosticos y solicitudes de asesoria.
- Filtros por canal y estatus + edicion de estatus desde detalle.

## Actualizacion navegacion por contexto (Ejecucion 33)
- El panel admin se divide en dos contextos:
  - Administracion General de ComerCia (global)
  - Panel de Operacion de Marca (marca activa)
- `reinpia_admin` puede alternar contexto y marca activa desde selector persistente.
- `tenant_admin` y `tenant_staff` solo ven el menu de marca.
- Monedas se ubica por contexto:
  - Global: "Monedas y tipos de cambio"
  - Marca: "Moneda de operaci�n"

## Actualizacion conectividad API y Monedas (Ejecucion 36)
- URL base de API centralizada y endurecida para entorno local:
  - `VITE_API_URL` por defecto en `http://127.0.0.1:8000`
  - fallback local historico a `8001` (retirado en Ejecucion 39)
  - descarte de runtime URL efimera fuera de lista (evita errores con puertos como `8002`)
- Modulo Monedas reforzado:
  - carga inicial con `loading`
  - mensaje de error util + accion `Reintentar conexion`
  - estado inicial editable cuando backend no responde (sin pantalla vacia)
  - vista previa con mensaje amigable cuando no hay tasas
- Reuso del helper central de API en modulos que armaban URL manual:
  - wizard de marca (assets)
  - reportes REINPIA (export CSV)

## Actualizacion panel por contexto (Ejecucion 37)
- Monedas
  - Global: modulo funcional `Monedas y tipos de cambio`.
  - Marca: modulo funcional `Moneda de operaci�n`.
- Usuarios
  - Global: `Usuarios internos de plataforma` con listado/alta/edicion minima.
  - Marca: `Usuarios de la marca` con listado/alta/edicion segun rol.
- Idioma
  - Global: `Idiomas de plataforma` con idioma por defecto y habilitados.
  - Marca: `Idioma de tienda` con idioma principal, visibles y perfil regional.
- Marcas globales
  - Vista `Global: Marcas` limpiada con tabla priorizada y acciones por fila.
- Permisos
  - Crear marca solo para `reinpia_admin` y solo en contexto global.
- Usuarios de marca sin acceso a modulos globales por ruta/rol.

## Actualizacion sitio publico COMERCIA (Ejecucion 40)
- Arquitectura publica oficial consolidada en:
  - `/comercia`
  - `/comercia/precios`
  - `/comercia/marketing`
  - `/comercia/consultoria`
- Se retiro del router publico el bloque legacy de demos `MercaPlus` (`/demo/mercaplus*`).
- Se eliminaron archivos legacy de `frontend/src/demo/mercaplus` al quedar fuera del flujo oficial.
- Se mantuvo sin cambios el alcance no solicitado:
  - wizard
  - panel global / panel de marca
  - ecommerce tenant-aware
  - modulos internos y prospectos internos
- Se depuro `ComerciaLandingPage.css` para conservar estilos usados por el sitio publico oficial.

## Actualizacion arquitectura admin global/marca (Ejecucion 41)
- Se consolid� la arquitectura administrativa oficial:
  - Panel global: Inicio, Creaci�n, Administraci�n, Finanzas, Operaci�n interna.
  - Wizard oficial solo para creaci�n inicial.
  - M�dulo global `Canales creados` como centro administrativo de canales.
  - Panel de marca orientado a operaci�n diaria.
- Se retiraron rutas legacy/alias de tenants:
  - `/tenants`
  - `/tenants/:tenantId`
  - `/tenants/:tenantId/branding`
- Se eliminaron p�ginas legacy no alineadas:
  - `frontend/src/pages/TenantsPage.tsx`
  - `frontend/src/pages/TenantDetailPage.tsx`
- Se actualizaron accesos en `Canales creados` para usar solo rutas REINPIA oficiales de ficha de marca.
- Se elimin� mezcla de contexto global dentro del men� de marca.

## Actualizacion canales de marca tenant-aware (Ejecucion 38)
- Nuevas rutas de control por canal en panel de marca:
  - `/admin/channels/landing`
  - `/admin/channels/public`
  - `/admin/channels/distributors`
  - `/admin/channels/pos`
- Cada modulo reemplaza vistas genericas y trabaja con tenant activo real.
- Estados por canal disponibles:
  - `borrador`
  - `en revision`
  - `publicado`
  - `requiere ajustes`
- Datos de estado visibles por canal:
  - Landing: modo externa/interna, URL, branding aplicado
  - Ecommerce publico: productos, categorias, banners, moneda e idioma
  - Ecommerce distribuidores: precios B2B, reglas de volumen, distribuidores registrados
  - POS/WebApp: habilitacion, puntos de venta, empleados, Mercado Pago y NFC
- Acciones por canal:
  - abrir vista real
  - abrir preview
  - editar modulo relacionado
  - regenerar plantilla (solo `reinpia_admin`)

## Ajuste de comportamiento real de canales (Ejecucion 39)
- Landing de marca:
  - `Ver landing` y `Ver preview` respetan URL externa valida.
  - Si la URL externa es demo/no resoluble (`.demo`, `.local`, `.invalid`), se usa landing interna tenant-aware.
  - Ruta interna de landing: `/store/:tenantSlug/landing`.
  - `Regenerar landing` deja de ser boton muerto:
    - `reinpia_admin`: accion real de regeneracion.
    - marca: stub funcional con confirmacion y timestamp visible.
- Ecommerce publico:
  - `Ver ecommerce publico` y `Ver preview` abren `/store/:tenantSlug`.
  - `Regenerar plantilla publica` ejecuta accion de regeneracion sin redirigir a landing.
- Ecommerce distribuidores:
  - `Ver ecommerce distribuidores` y `Ver preview` abren `/store/:tenantSlug/distribuidores`.
  - `Regenerar plantilla distribuidor` deja de ser boton muerto.
- POS / WebApp:
  - `Abrir WebApp / POS` abre ruta tenant-aware `/pos?tenant_id={tenantId}`.
  - `Ver preview POS` mantiene plantilla de preview.

## Actualizacion arquitectura oficial de plantillas (Ejecucion 42)
- Landing de la marca | Estado: funcional
  - motor oficial: `approved_landing_v1`
  - ruta oficial: `/store/:tenantSlug/landing`
- Ecommerce publico | Estado: funcional
  - motor oficial: `approved_public_v1`
  - ruta oficial: `/store/:tenantSlug`
- Ecommerce distribuidores | Estado: funcional
  - motor oficial: `approved_b2b_v1`
  - ruta oficial: `/store/:tenantSlug/distribuidores`
- Resolver central de canal:
  - `frontend/src/branding/channelTemplateResolver.tsx`
- Config oficial por tenant:
  - `frontend/src/branding/officialChannelTemplates.ts`
  - backend `brand_setup` normaliza y persiste en `config_json`
- Wizard conectado al motor oficial:
  - persiste `landing_template`, `public_store_template`, `distributor_store_template`
- Panel de marca conectado al motor oficial:
  - muestra plantilla activa por canal y rutas oficiales reales
  - preview de distribuidores separado en `/store/:tenantSlug/distribuidores?preview=1`

## Actualizacion modelos comerciales por marca (Ejecucion 43)
- Modelo comercial por tenant | Estado: funcional
  - `billing_model`: `fixed_subscription` o `commission_based`
  - `commission_percentage`, `commission_enabled`, `commission_scope`, `commission_notes`
- Wizard de setup | Estado: funcional
  - paso identidad incluye selector:
    - `Cuota fija`
    - `Comision por venta`
  - si aplica comision: porcentaje + notas
- Registro de marca (`/reinpia/brands/new`) | Estado: funcional
  - alta inicial con modelo comercial y porcentaje de comision
- Panel global | Estado: funcional
  - `ReinpiaTenantsPage`, `ReinpiaTenantDetailPage`, `ReinpiaPaymentsPage` y reportes muestran:
    - modelo comercial
    - porcentaje configurado
    - ventas sujetas
    - comision estimada
- Panel de marca | Estado: funcional
  - `BrandChannelPages` muestra modelo activo y explicacion por canal

## Actualizacion plan comercial desde Stripe y creditos IA (Ejecucion 44)
- Plan comercial oficial por marca | Estado: funcional
  - Catalogo central: `backend/app/services/commercial_plan_service.py`
  - Modelos: `fixed_subscription` y `commission_based` con tiers `basic/growth/premium`
  - Precios + IVA + add-ons oficiales incluidos en payload de catalogo
- Checkout de plan comercial | Estado: funcional
  - `POST /api/v1/commercial-plans/create-checkout-session`
  - genera sesion Stripe con metadata de plan (`kind=tenant_commercial_plan`)
- Activacion automatica por webhook | Estado: funcional
  - `backend/app/api/v1/endpoints/stripe_webhook.py`
  - `checkout.session.completed` aplica plan al tenant y sincroniza billing/comision/limites/creditos IA
- Control de creditos IA (llave interna) | Estado: funcional
  - `POST /api/v1/commercial-plans/tenant/{tenant_id}/tokens/consume`
  - `POST /api/v1/commercial-plans/tenant/{tenant_id}/tokens/topup`
  - `POST /api/v1/commercial-plans/tenant/{tenant_id}/tokens/lock`
- Wizard y panel de marca | Estado: funcional
  - Wizard muestra plan pagado desde Stripe y estado de creditos IA
  - Detalle global de marca muestra plan comercial, estado y metricas de creditos

## Actualizacion wizard oficial de alta/configuracion (Ejecucion 45)
- Wizard de setup de marca | Estado: oficial funcional
  - flujo oficial de alta/configuracion (no demo) con pasos reales de operacion.
  - estados finales visibles: `borrador`, `en configuracion`, `lista para revision`, `lista para publicacion`, `publicada`.
- Plan y facturacion en wizard | Estado: oficial funcional
  - fuente oficial: plan pagado desde Stripe (`commercial_plan_*`, `billing_model`, comision, limites, creditos IA).
  - edicion manual bloqueada por defecto en wizard para `billing_model`, comision y limites base.
  - soporte de override explicito via backend (`force_plan_override`).
- Entitlements y limites | Estado: oficial funcional
  - visibles en wizard: marcas, usuarios, agentes IA, productos, sucursales, creditos IA y add-ons activos.
  - bloqueos/advertencias cuando existen excesos de limites.
- Plantillas oficiales | Estado: oficial funcional
  - wizard persiste y fuerza: `approved_landing_v1`, `approved_public_v1`, `approved_b2b_v1`.
  - flujo principal sin plantillas legacy.
- Landing externa + preview interno | Estado: oficial funcional
  - URL externa registrada no rompe wizard.
  - preview interno tenant-aware siempre disponible.
  - regeneracion interna con timestamp por canal.
- Botones y rutas de canales | Estado: oficial funcional
  - landing: ver, preview, regenerar.
  - ecommerce publico: ver, preview, regenerar plantilla.
  - ecommerce distribuidores: ver, preview, regenerar plantilla.
  - sin rutas vacias ni templates legacy en flujo principal.

## Actualizacion checkout comercial publico Stripe test (Ejecucion 46)
- Catalogo comercial oficial | Estado: funcional
  - planes y add-ons ahora exponen:
    - `code`
    - `display_name`
    - `billing_model`
    - `commission_enabled`
    - `commission_percentage`
    - `monthly_price_mxn`
    - `total_price_mxn`
    - `stripe_price_id`
  - mapeo centralizado desde variables de entorno backend.
- Checkout comercial | Estado: funcional
  - endpoint: `POST /api/v1/commercial-plans/create-checkout-session`
  - soporta planes y add-ons con `item_code`.
  - backend resuelve `stripe_price_id` de forma segura y crea sesion Stripe test.
- Landing comercial publica | Estado: funcional
  - botones de planes y add-ons conectados a checkout real de Stripe test.
  - UX con loading, manejo de error y estado de regreso `success/cancel`.
  - mensaje de error unificado:
    - "No fue posible iniciar el checkout en este momento. Intenta nuevamente."
- Landing COMERCIA (seccion marketing por bloques) | Estado: parcial (bloque 1 implementado)
  - Nueva seccion `#marketing-diagnostico` en `ComerciaLandingPage`
  - Enfocada en captacion comercial y solicitud de interes

## Actualizacion seccion marketing de captacion (Ejecucion 45)
- Landing principal COMERCIA | Estado: funcional
  - Seccion `#marketing-diagnostico` redisenada como flujo operativo:
    - formulario de brief comercial completo
    - metodologia consultiva CODEX
    - clasificacion interna automatica
    - salida ejecutiva en 10 puntos con cotizacion preliminar
- Nota:
  - este enfoque publico fue reemplazado en Ejecucion 47 para no exponer logica interna en landing.
- Archivos impactados:
  - `frontend/src/pages/ComerciaLandingPage.tsx`
  - `frontend/src/pages/ComerciaLandingPage.css`

## Actualizacion templates oficiales unicos (Ejecucion 46)
- Landing de la marca | Estado: funcional
  - template oficial unico: `approved_landing_v1`
  - ruta oficial: `/store/:tenantSlug/landing`
- Ecommerce publico | Estado: funcional
  - template oficial unico: `approved_public_v1`
  - ruta oficial: `/store/:tenantSlug`
- Ecommerce distribuidores | Estado: funcional
  - template oficial unico: `approved_b2b_v1`
  - ruta oficial: `/store/:tenantSlug/distribuidores`
- Resolver oficial activo:
  - `frontend/src/branding/channelTemplateResolver.tsx`
  - `frontend/src/branding/officialChannelTemplates.ts`
- Backend de setup bloqueado a oficiales:
  - `backend/app/api/v1/endpoints/brand_setup.py`
- Legacy/demo fuera del flujo principal:
- `/internal/demo/*` (y redirección legacy desde `/templates/*`) solo referencia interna, no motor activo por tenant.

## Actualizacion mercadotecnia publica e interna (Ejecucion 47)
- Landing principal COMERCIA | Estado: funcional
  - Seccion publica de mercadotecnia enfocada en explicacion comercial + formulario de solicitud.
  - No muestra metodologia interna, scoring interno ni precotizacion al prospecto.
  - Endpoint de captura publica: `POST /api/v1/comercia/marketing-prospects`.
- Prospectos MKT internos (panel global) | Estado: funcional
  - Ruta: `/reinpia/marketing/prospectos`.
  - Lista prospectos por estatus/urgencia/fecha/canal, detalle ejecutivo y actualizacion comercial.
  - Endpoints internos:
    - `GET /api/v1/reinpia/marketing-prospects`
    - `GET /api/v1/reinpia/marketing-prospects/{id}`
    - `PUT /api/v1/reinpia/marketing-prospects/{id}`
- Motor de precotizacion interna | Estado: funcional
  - Servicio: `backend/app/services/marketing_prospects_service.py`
  - Genera diagnostico en 10 secciones, rango de precio sugerido, servicios recomendados y riesgos.
  - Salida solo interna (no expuesta en landing publica).
  - Incluye `main_goal` persistido y `status_history` para trazabilidad comercial basica.

## Actualizacion clientes comerciales y candados de plan (Ejecucion 48)
- Catalogo publico de planes COMERCIA | Estado: funcional
  - Endpoint: `GET /api/v1/comercia/commercial-plans/catalog`
  - Devuelve planes y add-ons con precio `price_with_tax_mxn` (IVA incluido).
- Landing principal COMERCIA (planes y precios) | Estado: funcional
  - Renderiza 6 planes oficiales (sin comision/con comision) y add-ons con IVA incluido.
- Clientes comerciales (panel global) | Estado: funcional
  - Ruta: `/reinpia/clientes-comerciales`
  - Alta/edicion de cliente comercial (marca padre/hijas)
  - Asignacion de marcas a cuenta comercial
  - Vista ejecutiva de uso vs limites por plan.
- Solicitudes de crecimiento (upgrade/add-ons) | Estado: funcional
  - Endpoint tenant/global: `POST /api/v1/commercial-plans/requests`
  - Endpoints globales: listado/alta de solicitudes y gestion de cuentas comerciales.
- Candados por plan | Estado: funcional
  - Creacion/asignacion de marcas validada contra limite de cuenta comercial.
  - Alta de usuarios bloqueada al exceder limite.
  - Alta de productos bloqueada al exceder limite.
  - Alta de sucursales POS bloqueada al exceder limite.
- Botones de crecimiento en panel de marca | Estado: funcional
  - `BrandChannelPages` agrega acciones para:
    - solicitar upgrade a Growth/Premium
    - solicitar add-ons (usuario extra, sucursal extra, 500 creditos IA).

## Actualizacion dashboard de marca por plan y consumo (Ejecucion 49)
- Dashboard de marca | Estado: funcional
  - resumen ejecutivo de plan contratado, estado, activacion y soporte.
  - KPIs de ventas/comision/neto segun modelo comercial.
- Consumo y limites | Estado: funcional
  - tarjetas de uso/capacidad para marcas, usuarios, agentes IA, productos y sucursales.
  - detalle de sucursales activas/inactivas y creditos IA con medidor.
  - endpoint: `GET /api/v1/commercial-plans/tenant/{tenant_id}/usage`.
- Comision por venta | Estado: funcional
  - bloque siempre visible (activa o desactivada), porcentaje y ventas sujetas.
- Soporte por plan | Estado: funcional
  - canal por correo o chat segun plan.
  - base visual para escalamiento a persona (sin Telegram productivo en esta fase).
- Add-ons en panel de marca | Estado: funcional
  - bloque "Expandir capacidad" con deteccion de recursos cerca del limite.
  - CTAs: solicitar add-on y mejorar plan.
- Paneles global vs marca | Estado: funcional
  - `Prospectos MKT` queda exclusivo de panel global REINPIA.
  - panel de marca enfocado en operacion, consumo y soporte de su tenant.
- Modulos avanzados por contrato | Estado: funcional
  - Logistica, Jornada laboral y NFC operativo ocultos por defecto.
  - solo visibles cuando flags de `admin_settings.features` estan habilitados.

## Actualizacion contable y comisionistas (Ejecucion 50)
- Panel `Pagos / Contador` | Estado: funcional
  - resumen por cliente principal
  - resumen por comisionista
  - detalle por operacion
  - conciliacion: generado, distribuido, pagado, por pagar
- Filtros financieros | Estado: funcional
  - cliente principal
  - marca
  - comisionista
  - periodo
- Comisionistas extendidos | Estado: funcional
  - tipo `interno/externo`
  - asignacion opcional por cliente principal y/o marca
- Liquidaciones de comisionistas | Estado: funcional
  - tabla `commission_agent_settlements`
  - registro de pago restringido a rol global admin
- Roles financieros | Estado: funcional
  - `super_admin`: acceso global completo
  - `contador`: lectura de pagos/comisiones/comisionistas
  - `soporte`: sin visibilidad financiera

## Actualizacion alertas de capacidad critica (Ejecucion 51)
- Centinela de limites | Estado: funcional
  - 80% preventiva, 90% fuerte, 100% critica.
- Dashboard de marca | Estado: funcional
  - barras de consumo por capacidad y mensajes explicitos de uso.
- Accion directa desde alerta | Estado: funcional
  - checkout add-on Stripe test o solicitud de upgrade.
- Notificacion interna | Estado: funcional
  - alertas para marca y panel global, con base para email/Telegram/bot interno.

## Actualizacion UX creditos IA (Ejecucion 52)
- Medidor de creditos IA en dashboard | Estado: funcional
- Alerta 30% / critica 10% en dashboard | Estado: funcional
- Compra directa de creditos IA (extra_500_ai_credits) | Estado: funcional
- Mensaje de bloqueo inteligente de funciones IA no criticas al agotar saldo | Estado: funcional

## Actualizacion add-ons 1 clic por capacidad (Ejecucion 53)
- Mapeo central de capacidad -> add-on | Estado: funcional
  - `frontend/src/utils/capacityActions.ts`
  - usuarios, agentes IA, marcas, productos, sucursales, creditos IA
- Dashboard de marca | Estado: funcional
  - botones contextuales de compra add-on por bloque de consumo (80%+)
  - sugerencia de upgrade en escenarios de riesgo alto
  - alertas operativas con CTA directo de compra
- Panel global de clientes comerciales | Estado: funcional
  - bloque "Marcas en riesgo operativo" con compra add-on y mejora de plan
- Checkout comercial add-ons | Estado: funcional
  - endpoint unificado `POST /api/v1/commercial-plans/create-checkout-session`
  - contexto comercial trazable (`tenant_id`, `client_account_id`, `resource_origin`, `ui_origin`)
- Aplicacion post-compra | Estado: funcional
  - webhook Stripe aplica add-on en tenant/cuenta comercial
  - recalcula capacidad y alertas despues del pago

## Actualizacion arquitectura global alrededor del wizard (Ejecucion 54)
- Wizard oficial de creacion | Estado: conservado
  - `BrandSetupWizard` permanece como motor principal de alta/configuracion inicial.
- Navegacion global por dominios | Estado: funcional
  - separacion explicita en sidebar:
    - Creacion global
    - Administracion global
    - Vision ejecutiva
    - Configuracion global
- Modulo administrativo unico de canales creados | Estado: funcional
  - ruta: `/reinpia/canales-creados`
  - pagina: `ReinpiaCreatedChannelsPage`
  - consolida vista por cliente/marca de landing/publico/distribuidores/WebApp.
- Limpieza de flujo principal | Estado: funcional
  - enlaces legacy de marcas hacia `/tenants/*` retirados del recorrido principal global
  - rutas duplicadas de comisionistas/comisiones eliminadas del router principal.

## Actualizacion add-ons visibles por rol (Ejecucion 55)
- Logistica | Estado: visible con gating comercial
  - ruta: `/admin/logistics`
  - cliente/marca: ve estado y CTA de activacion, sin operacion si no contratado
  - super admin: puede operar y configurar estado/plan/scope
- Jornada laboral | Estado: visible con gating comercial
  - ruta: `/admin/appointments`
  - cliente/marca: ve estado y CTA de activacion, sin operacion si no contratado
  - super admin: puede operar y configurar estado/plan/scope
- NFC / grabado / impresion | Estado: visible con activacion comercial
  - ruta: `/admin/addons/nfc`
  - cliente/marca: resumen + beneficios + CTA
  - super admin: control de estado/plan/scope y acceso operativo base
- Navegacion de marca | Estado: funcional
  - los tres add-ons quedan siempre visibles con etiqueta de estado comercial en menu.

## Actualizacion landing comercial modular (Ejecucion 56)
- Landing principal `/comercia` | Estado: funcional
  - version ligera orientada a claridad ejecutiva y conversion.
  - evita saturacion de detalle tecnico/comercial en una sola pagina.
- Subpagina `/comercia/precios` | Estado: funcional
  - planes base + add-ons con CTA de checkout.
  - incluye oferta comercial de logistica, jornada laboral y NFC (software/equipos/tarjetas).
- Subpagina `/comercia/marketing` | Estado: funcional
  - bloque dedicado a mercadotecnia digital con formulario y CTA.
  - sin exponer metodologia interna sensible ni precotizacion publica.
- Subpagina `/comercia/consultoria` | Estado: funcional
  - diagnostico, revision operativa, automatizacion y solicitud de contacto.
- Navegacion publica | Estado: funcional
  - header/footer conectan Inicio, Precios, Marketing y Consultoria.

## Actualizacion panel global por dominios (Ejecucion 57)
- Navegacion global de ComerCia | Estado: funcional
  - agrupada por dominios:
    - `INICIO`
    - `CREACI�N`
    - `ADMINISTRACI�N`
    - `FINANZAS`
    - `OPERACI�N INTERNA`
- Dominio CREACI�N | Estado: funcional
  - Clientes, Marcas, Nueva marca, Wizard de configuracion.
- Dominio ADMINISTRACI�N | Estado: funcional
  - Clientes comerciales, Marcas activas, Canales creados, Configuracion internacional.
- Dominio FINANZAS | Estado: funcional
  - Pagos, Comisiones, Planes y Add-ons, Tokens IA.
- Dominio OPERACI�N INTERNA | Estado: funcional
  - Soporte, Alertas/Centinela, Seguridad, Prospectos de Marketing, Usuarios internos.
- Limpieza de flujo principal | Estado: funcional
  - rutas legacy/global mezcladas fuera del menu principal.
  - selector de marca ya no redirige a `/tenants/:tenantId/branding` en flujo principal.
## Panel cliente/marca - ajustes de contexto (2026-04-13)

- `Dashboard de marca`:
  - Botones de resumen activos: compra de cr�ditos IA, soporte comercial local y mejora de plan.
  - Se retir� el bloque separado de contexto comercial para evitar duplicidad en la vista principal.
- `Marcas hijas`:
  - Nuevo m�dulo local: `/admin/brands/children`.
  - Muestra marca principal + hijas relacionadas con estado operativo y consumo por marca.
  - Incluye CTAs de crecimiento: mejorar plan, add-on de marca, m�s cr�ditos IA.
- `Ficha de marca activa`:
  - Ruta: `/admin/branding`.
  - Permite cambiar de marca (principal/hija) para revisar salud operativa y branding b�sico.
- `Navegaci�n panel de marca`:
  - Se elimin� el agrupador `Canales`.
  - Los accesos de canal viven bajo `Operaci�n`.
## Panel Global - dominios funcionales (2026-04-14)

El menu global oficial queda agrupado en 5 dominios:

1. INICIO
   - Dashboard global
2. CREACION
   - Clientes
   - Marcas
   - Nueva marca
   - Wizard de configuracion
3. ADMINISTRACION
   - Clientes comerciales
   - Marcas activas
   - Canales creados
   - Configuracion internacional
4. FINANZAS
   - Pagos
   - Comisiones
   - Planes y Add-ons
   - Tokens IA
5. OPERACION INTERNA
   - Soporte
   - Alertas / Centinela
   - Seguridad
   - Prospectos de Marketing
   - Usuarios internos

Limpieza aplicada:
- Sin items duplicados apuntando al mismo destino.
- Sin accesos globales a rutas de panel de marca.
- Sin saturacion por subopciones legacy en el menu principal.
## Modulos de consumo y capacidad IA (2026-04-14)

### Panel de marca

- `Planes` (`/plans`)
  - Plan contratado actual
  - Marcas registradas segun cupo del plan
  - Tokens IA mensuales (asignados, consumidos, restantes)
  - Indicador de gasolina para consumo IA
  - Acciones: upgrade y add-ons

- `Marcas hijas` (`/admin/brands/children`)
  - Lista de marca principal + submarcas
  - Consumo operativo por marca
  - Riesgo comercial (estable/advertencia/critico)
  - Indicador de tokens por marca
  - CTA de recarga IA y crecimiento

### Panel global

- `Clientes comerciales` (`/reinpia/clientes-comerciales`)
  - Planeacion global de tokens IA
  - Tokens distribuidos por marca
  - Tokens de reserva y umbral minimo sugerido
  - Agente centinela de sobreconsumo por marca
## Cierre m�dulos panel de marca (2026-04-14)

### Soporte

- Ruta: `/admin/support`
- Capacidades:
  - alta de ticket
  - adjuntos por ticket
  - historial y estados (`nuevo`, `en revision`, `pendiente de cliente`, `resuelto`, `cerrado`)
  - chat IA por plan (Growth/Premium)
  - base de escalamiento humano/Telegram interno

### Expandir capacidad

- Ruta: `/admin/capacity-expand`
- Cat�logo de expansi�n con:
  - usuario extra
  - agente IA extra
  - marca extra
  - 100 productos extra
  - sucursal extra
  - 500 cr�ditos IA extra
  - soporte premium
- Incluye recomendaci�n por recurso en riesgo + acciones de checkout y upgrade.

### Respuestas y atenci�n

- Ruta: `/admin/respuestas-atencion`
- Captura:
  - tono
  - saludo inicial
  - speech comercial
  - preguntas frecuentes
  - objeciones
  - restricciones
  - horario
  - mensajes de cierre
  - estilo
  - notas y documento base
- Flujo:
  - guardar configuraci�n
  - enviar solicitud a soporte para aplicaci�n por REINPIA
  - no activa agentes manualmente desde el cliente

## Actualizacion Nervia x ComerCia (2026-04-14)
- Nuevo modulo global `Nervia Marketing` en `/reinpia/nervia-marketing`.
- Nuevos endpoints REINPIA:
  - `POST /api/v1/reinpia/nervia-bridge/sync`
  - `GET /api/v1/reinpia/nervia-bridge/report`
  - `GET /api/v1/reinpia/nervia-bridge/feedback`
- El modulo entrega:
  - KPIs globales (clics, impresiones, leads, ventas pagadas, revenue)
  - reporte por marca y top publicaciones
  - recomendaciones para retroalimentar a Nervia en generacion de publicaciones

## Actualizacion aislamiento multiagencia y conector ComerCia (2026-04-14)
- Segmentacion de tenant agregada (`tenant_type`, `owner_scope`, `owner_agency_tenant_id`).
- Aislamiento backend real para vistas Nervia por tipo de operador (`reinpia_admin/super_admin/agency_admin`).
- `agency_admin` solo accede a sus clientes y nunca a clientes internos de REINPIA.
- Conector ComerCia tratado como add-on comercial (`comercia_connector`) con habilitacion por compra/webhook.

## Actualizacion trazabilidad de origen comercial (2026-04-14)
- Nuevos campos en tenant para identificar el origen de cada marca.
- Se soporta clasificacion de cliente interno, cliente de agencia y referencia por comisionista.
- El panel de `Marcas` muestra columna `Origen` para auditoria operativa.


## Cierre Sprint 1 (2026-04-15)
- Men� de marca sin duplicidad funcional en `Plan activo y soporte`.
- `DashboardPage` queda como resumen ejecutivo de marca.
- `PlansPage` queda como detalle de plan y l�mites.
- `BrandCapacityExpansionPage` queda para compra de add-ons y solicitud de upgrade.
- Rutas antes hu�rfanas ahora integradas en navegaci�n:
  - global: `reinpia/operations`, `reinpia/reports/*`
  - marca: `admin/contracts`, `onboarding/sales`, `onboarding/client`
- Correcci�n de textos mojibake en vistas internas cr�ticas.

## Sprint 2 - Bloque 1 (2026-04-15): Módulo de roles y permisos
- Dominio nuevo en panel global:
  - `Roles y permisos` (`/reinpia/roles`)
- Backend nuevo:
  - `GET /api/v1/admin/roles`
  - `GET /api/v1/admin/permissions`
  - `GET /api/v1/admin/role-assignments`
  - `POST /api/v1/admin/role-assignments`
- Catálogo inicial de roles:
  - global: `super_admin`, `contador`, `soporte`, `comercial`, `operaciones`
  - cliente/marca: `client_admin`, `brand_admin`, `brand_operator`, `brand_support_viewer`
- Catálogo inicial de permisos:
  - global: dashboard/clientes/marcas/pagos/comisiones/soporte/prospectos/seguridad/usuarios internos/roles-permisos
  - marca: dashboard/catálogo/distribuidores/consumo/soporte/add-ons/branding/canales/respuestas
- Integración de compatibilidad:
  - mapeo de roles legacy hacia catálogo nuevo
  - guardas de navegación por permiso con fallback por rol legacy

## Modulo de Orquestador IA central (Ejecucion 63 - 2026-04-16)

| Modulo | Estado | Notas |
|---|---|---|
| Cerebro Orquestador IA | Inicial funcional | Decide ejecutar u omitir por evento, plan, autonomia y presupuesto |
| Catalogo de agentes logicos reutilizables | Inicial funcional | `commercial_agent`, `marketing_agent`, `support_agent`, `sentinel_agent`, `growth_agent` |
| Ejecucion por evento | Inicial funcional | Triggers reales (`new_lead`, `new_ticket`, `campaign_request`, `abandoned_cart`, `sentinel_alert`, etc.) |
| Reglas de skip/token saving | Inicial funcional | Evita ejecuciones sin trigger/campana/datos, por low budget o enfriamiento centinela |
| Entitlements IA por plan | Inicial funcional | Capacidades disponibles/activas + autonomia + presupuestos en tenant |
| Trazabilidad orquestador | Inicial funcional | Tabla `ai_orchestrator_executions` con executed/skipped, motivo, tokens usados/ahorrados |
| Panel IA inicial actualizado | Inicial funcional | Capacidades por plan, capacidades activas, ultimas ejecuciones, omisiones, tokens usados y ahorrados |

### Endpoints Orquestador IA
- `GET /api/v1/admin/ai-autonomy/orchestrator/dashboard`
- `POST /api/v1/admin/ai-autonomy/orchestrator/events`
- `GET /api/v1/admin/ai-autonomy/orchestrator/executions`
