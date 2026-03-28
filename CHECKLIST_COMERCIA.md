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
