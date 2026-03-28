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
