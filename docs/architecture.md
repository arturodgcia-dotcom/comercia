# Arquitectura COMERCIA by REINPIA

## 1) Alcance actual
COMERCIA opera como SaaS multitenant con:
- autenticacion JWT
- ecommerce por tenant
- pagos Stripe (Plan 1 / Plan 2)
- crecimiento comercial (fidelizacion, cupones, membresias, banners dinamicos, wishlist, reseñas)

## 2) Flujo comercial de crecimiento

1. El storefront consume `/storefront/{slug}/home-data` para renderizar:
- banners por posicion
- destacados, nuevos, promociones
- best sellers placeholder (featured + recent)
- membresias publicables

2. En checkout:
- calcula subtotal
- aplica cupón opcional
- aplica puntos opcionales
- calcula total
- si tenant es PLAN_2 aplica comision por item (2.5% / 3%)

3. Al pago exitoso (webhook):
- order -> `paid`
- incrementa uso de cupón
- consume puntos usados
- acredita puntos del pedido

## 3) Dominio growth agregado
- `LoyaltyProgram`
- `LoyaltyRule` (extendido)
- `MembershipPlan`
- `Coupon`
- `CustomerLoyaltyAccount`
- `Banner` (extendido)
- `WishlistItem`
- `ProductReview`

## 4) Servicios
- `loyalty_service.py`
  - cuenta de fidelidad
  - descuento por puntos
  - enrolamiento de membresia
- `coupon_service.py`
  - validacion/aplicacion de cupon
  - incremento de uso
- `recommendation_service.py`
  - destacados / recientes / promo / best sellers placeholder / upsell

## 5) Moderacion de reseñas
- Toda reseña nueva queda con `is_approved=false`.
- Storefront publica solo aprobadas.
- Admin aprueba desde `/admin/reviews`.

## 6) API growth
- Loyalty:
  - `GET/POST/PUT /api/v1/loyalty/program/{tenant_id}`
  - `GET /api/v1/loyalty/account/{tenant_id}/{customer_id}`
  - `POST /api/v1/loyalty/account/{tenant_id}/{customer_id}/apply-points`
- Memberships:
  - `GET /api/v1/memberships/by-tenant/{tenant_id}`
  - `POST /api/v1/memberships`
  - `PUT /api/v1/memberships/{id}`
- Coupons:
  - `GET /api/v1/coupons/by-tenant/{tenant_id}`
  - `POST /api/v1/coupons`
  - `PUT /api/v1/coupons/{id}`
  - `POST /api/v1/coupons/validate`
- Banners:
  - `GET /api/v1/banners/by-tenant/{tenant_id}`
  - `POST /api/v1/banners`
  - `PUT /api/v1/banners/{id}`
- Wishlist:
  - `GET /api/v1/wishlist/{tenant_id}/{customer_id}`
  - `POST /api/v1/wishlist`
  - `DELETE /api/v1/wishlist/{id}`
- Reviews:
  - `GET /api/v1/reviews/product/{product_id}`
  - `POST /api/v1/reviews`
  - `PUT /api/v1/reviews/{id}/approve`
- Storefront helpers:
  - `GET /api/v1/storefront/{tenant_slug}/home-data`
  - `GET /api/v1/storefront/{tenant_slug}/checkout-upsell`

## 7) Migraciones
- `20260327_01`: esquema base
- `20260327_02`: auth/storefront
- `20260328_03`: pagos
- `20260328_04`: growth comercial

## 8) Validacion ejecutada
- backend compile: `python -m compileall app`
- frontend build: `npm run build`
