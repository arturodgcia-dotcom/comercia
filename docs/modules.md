# Modulos COMERCIA - Estado

| Modulo | Estado | Notas |
|---|---|---|
| Auth y usuarios | Inicial funcional | JWT login/me + roles |
| Tenants y branding | Inicial funcional | CRUD tenant + branding por tenant |
| Storefront multitenant | Inicial funcional | home-data, distributors, services por slug |
| Catalogo ecommerce | Inicial funcional | categorias/productos CRUD por tenant |
| Pagos Stripe | Inicial funcional | Plan1/Plan2 + comision + webhook |
| Fidelizacion | Inicial funcional | programa, cuenta, puntos |
| Cupones | Inicial funcional | CRUD + validate + uso |
| Memberships | Inicial funcional | CRUD por tenant |
| Banners dinamicos | Inicial funcional | posicion/target/prioridad/vigencia |
| Wishlist | Inicial funcional | add/list/delete |
| Reviews + moderacion | Inicial funcional | submit pending + approve |
| Servicios y agenda | Inicial funcional | servicios CRUD + citas self/gift |
| Distribuidores | Inicial funcional | applications + profiles + employees |
| Contratos digitales | Inicial funcional | templates + firma textual |
| Ordenes recurrentes | Base funcional | schedule + items |
| Logistica | Base funcional | ordenes + eventos + schedule/reschedule/delivered |
| Landing corporativa COMERCIA | Inicial funcional | ruta `/comercia`, enfoque conversion, paquetes y lead form |
| Landing tenant REINPIA | Inicial funcional | ruta `/store/reinpia`, enfoque servicios y canal distribuidor |
| Seed tenant demo REINPIA | Inicial funcional | tenant + branding + banners + 6 servicios de demo |
| Panel global REINPIA | Inicial funcional | dashboard multi-tenant con KPIs, filtros y detalle por tenant |
| Reporting / export CSV | Inicial funcional | exportes de ventas, comisiones, tenants, ordenes, comisionistas y plan purchase leads |
| Seguridad por rol global | Inicial funcional | acceso `/reinpia/*` restringido a `reinpia_admin` |
| Comisionistas comerciales | Inicial funcional | CRUD de agentes, codigo unico, resumen y KPIs |
| Referidos y leads de plan | Inicial funcional | `SalesReferral` + `PlanPurchaseLead` con trazabilidad por codigo |
| Alertas internas | Inicial funcional | alertas para seguimiento comercial y aviso contable |
| Landing COMERCIA lead capture | Inicial funcional | formulario real + soporte `?ref=` + registro backend |
| Modo DEMO de datos | Inicial funcional | seed multi-tenant idempotente para pruebas comerciales y demos |
| Modo APP limpio | Inicial funcional | base minima sin data demo comercial |
| Reset de demo | Inicial funcional | limpieza controlada de tenants/usuarios/datos demo |
| Onboarding vendedor/cliente | Inicial funcional | guias, pasos, progreso y vistas `/onboarding/*` |
| Internacionalizacion (i18n) | Base funcional | ES/EN con selector global y persistencia local |
| Monedas y tipo de cambio | Inicial funcional | settings por tenant + rates manual/refresh + preview |
| POS / WebApp base | Inicial funcional | ubicaciones, empleados, clientes y ventas POS |
| Fidelizacion en POS | Base funcional | uso/suma de puntos en cierre de venta |
| Automation bots/WhatsApp base | Inicial funcional | eventos, canales y templates sin proveedor externo |
| Centinela seguridad/antifraude | Inicial funcional | eventos, reglas, alertas, bloqueos y panel REINPIA security |
| Bots / agentes | Base arquitectura | pendiente implementacion |

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
- `/api/v1/comercia/plan-purchase-leads`
- `/api/v1/comercia/referral/{code}`

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
