# Modulos ComerCia - Estado

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
| Automation bots/WhatsApp base | Inicial funcional | eventos, canales y templates sin proveedor externo |
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
| Diagnóstico inteligente | Inicial funcional | modulo independiente para evaluar SEO, AEO e identidad por marca |
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

## Endpoints diagnóstico inteligente
- `POST /api/v1/brand-diagnostics/{tenant_id}/analyze`
- `GET /api/v1/brand-diagnostics/{tenant_id}/latest`
- `GET /api/v1/brand-diagnostics/{tenant_id}`
- `POST /api/v1/brand-diagnostics/{tenant_id}/improvement-plan`
- `GET /api/v1/reinpia/diagnostics`

## Actualizacion modulo Diagnóstico inteligente
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

## Actualizacion: trust/compliance y conversion en landing
Nuevos componentes y capacidades:
- `CookieConsentBanner` + `CookiePreferencesModal` con persistencia local de consentimiento.
- Paginas legales publicas de privacidad, cookies y proteccion de datos.
- Seccion de video YouTube configurable por entorno (`VITE_COMERCIA_YOUTUBE_URL`).
- Formulario de atencion al cliente separado del diagnostico comercial.
- Lía evolucionada a experiencia conversacional comercial (diagnostico + recomendacion + CTA de cierre).
- Footer de landing reforzado con enlaces legales y de contacto.

Nuevos endpoints:
- `POST /api/v1/comercia/customer-contact-leads`
- `GET /api/v1/reinpia/customer-contact-leads`

## Actualizacion UX comercial
- Lía migrada a widget flotante conversacional con acciones de cierre.
- Diagnostico comercial presentado como modal/subflujo.
- Seccion "Contáctanos" separada y orientada a conversion.
- Copy de retos comerciales ajustado (se elimina etiqueta "Dolor").

## Modulo interno de seguimiento
- `ReinpiaCommercialInboxPage` centraliza contacto, leads de Lía, diagnosticos y solicitudes de asesoria.
- Filtros por canal y estatus + edicion de estatus desde detalle.

## Actualizacion navegacion por contexto (Ejecucion 33)
- El panel admin se divide en dos contextos:
  - Administracion General de ComerCia (global)
  - Panel de Operacion de Marca (marca activa)
- `reinpia_admin` puede alternar contexto y marca activa desde selector persistente.
- `tenant_admin` y `tenant_staff` solo ven el menu de marca.
- Monedas se ubica por contexto:
  - Global: "Monedas y tipos de cambio"
  - Marca: "Moneda de operación"

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
  - Marca: modulo funcional `Moneda de operación`.
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
