# Arquitectura COMERCIA by REINPIA

## 1) Estado actual
Plataforma SaaS multitenant con:
- autenticacion JWT y roles
- ecommerce y catalogo por tenant
- pagos Stripe Plan 1 / Plan 2
- growth comercial (fidelizacion, cupones, memberships, wishlist, reviews)
- operacion comercial (servicios, agendas, distribuidores, recurrencia, logistica, contratos digitales base)

## 2) Flujo de dinero (Stripe)
1. Storefront crea checkout session.
2. Se calcula subtotal, descuentos (cupon/puntos) y total.
3. Si plan tenant = `PLAN_2`, se aplica comision por item:
- <= 2000: 2.5%
- > 2000: 3%
4. Webhook Stripe actualiza `Order` y ejecuta post-procesos (puntos, cupon, citas de servicios).

## 3) Flujo de servicios y agenda
1. Se define `ServiceOffering` por tenant.
2. Cliente compra servicio para si o como regalo desde storefront.
3. Checkout guarda payload de servicio/regalo en `Order`.
4. En pago exitoso se crea `Appointment`, se envia email y placeholder WhatsApp.

## 4) Flujo de regalo (MVP)
Campos de regalo soportados:
- remitente
- anonimo
- mensaje
- receptor (nombre, email, telefono)

Se persisten en `Order` y `Appointment`.

## 5) Flujo de distribuidores
1. Solicitud publica: `DistributorApplication`.
2. Admin aprueba/rechaza.
3. Aprobado crea `DistributorProfile` autorizado.
4. Se gestionan empleados con `DistributorEmployee`.

## 6) Contratos digitales base
- `ContractTemplate` (tenant/global)
- `SignedContract` con firma textual MVP:
  - signed_by_name
  - signed_by_email
  - signature_text
  - signed_at

No hay firma biometrica en esta fase.

## 7) Programacion recurrente
- `RecurringOrderSchedule` + `RecurringOrderItem`
- frecuencia semanal/quincenal/mensual
- base para ejecucion automatica posterior

## 8) Logistica base
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
