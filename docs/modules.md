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
