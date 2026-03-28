# Modulos COMERCIA - Estado Actual

| Modulo | Estado | Implementacion actual |
|---|---|---|
| Autenticacion y usuarios | Inicial funcional | JWT login/me, roles base |
| Tenants / Marcas | Inicial funcional | CRUD + plan + storefront init |
| Branding por tenant | Inicial funcional | Config visual/contacto |
| Ecommerce multitenant | Inicial funcional | CRUD categorias/productos + aislamiento tenant |
| Pagos Stripe | Inicial funcional | Checkout Plan1/Plan2 + webhook + dashboard |
| Fidelizacion | Inicial funcional | LoyaltyProgram + account + apply points |
| Membresias | Inicial funcional | MembershipPlan CRUD por tenant |
| Cupones | Inicial funcional | Coupon CRUD + validate + consumo |
| Banners dinamicos | Inicial funcional | Target, position, priority, vigencia |
| Wishlist | Inicial funcional | Alta/lista/borrado por cliente |
| Reviews + moderacion | Inicial funcional | Submit pending + approve admin |
| Upsell / recomendaciones | Inicial funcional | helpers home-data y checkout-upsell |
| Dashboard central REINPIA | Inicial funcional | admin shell + payments + growth modules |
| Logistica | Base arquitectura | pendiente funcional |
| Bots / Agentes | Base arquitectura | pendiente funcional |

## Endpoints growth clave
- `/api/v1/loyalty/*`
- `/api/v1/memberships/*`
- `/api/v1/coupons/*`
- `/api/v1/banners/*`
- `/api/v1/wishlist/*`
- `/api/v1/reviews/*`
- `/api/v1/storefront/{slug}/home-data`
- `/api/v1/storefront/{slug}/checkout-upsell`

## Estado de calidad
- backend compila
- frontend build estable
- swagger actualizado con rutas growth
- migraciones alembic hasta `20260328_04`
