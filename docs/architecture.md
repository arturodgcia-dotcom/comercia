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
