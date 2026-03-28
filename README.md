# COMERCIA by REINPIA

Plataforma SaaS multitenant para landing, ecommerce, fidelizacion, distribuidores, servicios y pagos Stripe.

## Stack
- `backend/`: FastAPI + SQLAlchemy + Alembic + JWT + Stripe.
- `frontend/`: React + Vite + TypeScript.
- `docs/`: arquitectura y estado modular.
- `infra/`: Docker base local.

## Arranque local

### Backend
```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Swagger: `http://localhost:8000/docs`

Credenciales seed:
- `admin@reinpia.com`
- `admin123`

### Frontend
```bash
cd frontend
npm install
npm run dev
```

- Admin: `http://localhost:5173`
- Storefront: `http://localhost:5173/store/{tenantSlug}`

## Bloque comercial implementado

### Fidelizacion
- `LoyaltyProgram`
- `LoyaltyRule` extendido
- `CustomerLoyaltyAccount`
- endpoints:
  - `GET/POST/PUT /api/v1/loyalty/program/{tenant_id}`
  - `GET /api/v1/loyalty/account/{tenant_id}/{customer_id}`
  - `POST /api/v1/loyalty/account/{tenant_id}/{customer_id}/apply-points`

### Membresias
- `MembershipPlan`
- endpoints:
  - `GET /api/v1/memberships/by-tenant/{tenant_id}`
  - `POST /api/v1/memberships`
  - `PUT /api/v1/memberships/{id}`

### Cupones
- `Coupon`
- endpoints:
  - `GET /api/v1/coupons/by-tenant/{tenant_id}`
  - `POST /api/v1/coupons`
  - `PUT /api/v1/coupons/{id}`
  - `POST /api/v1/coupons/validate`

### Banners dinamicos
- `Banner` extendido con target/position/priority/vigencia
- endpoints:
  - `GET /api/v1/banners/by-tenant/{tenant_id}`
  - `POST /api/v1/banners`
  - `PUT /api/v1/banners/{id}`

### Wishlist
- `WishlistItem`
- endpoints:
  - `GET /api/v1/wishlist/{tenant_id}/{customer_id}`
  - `POST /api/v1/wishlist`
  - `DELETE /api/v1/wishlist/{id}`

### Reseñas y moderacion
- `ProductReview`
- nuevas reseñas en `is_approved=false`
- storefront solo muestra aprobadas
- endpoints:
  - `GET /api/v1/reviews/product/{product_id}`
  - `POST /api/v1/reviews`
  - `PUT /api/v1/reviews/{id}/approve`

### Recomendaciones / storefront helpers
- `GET /api/v1/storefront/{tenant_slug}/home-data`
- `GET /api/v1/storefront/{tenant_slug}/checkout-upsell`

### Checkout extendido
`POST /api/v1/checkout/create-session` ahora soporta:
- `coupon_code` opcional
- `use_loyalty_points` opcional
- `customer_id` opcional

Persistencia en `Order`:
- `subtotal_amount`
- `discount_amount`
- `commission_amount`
- `total_amount`
- `net_amount`

Post pago webhook:
- suma puntos
- consume puntos usados
- incrementa uso de cupon

## Frontend agregado

### Admin
- `/admin/loyalty`
- `/admin/memberships`
- `/admin/coupons`
- `/admin/banners`
- `/admin/reviews`
- `/admin/payments`

### Storefront
- Home con:
  - banners
  - destacados
  - nuevos
  - promociones
  - mas vendidos (placeholder inteligente)
- Wishlist por producto
- Upsell antes de checkout
- Campo de cupón + opción de puntos
- Product detail:
  - `/store/:tenantSlug/product/:productId`
  - reseñas aprobadas + formulario de reseña

## Documentacion
- [docs/architecture.md](docs/architecture.md)
- [docs/modules.md](docs/modules.md)
- [CHECKLIST_COMERCIA.md](CHECKLIST_COMERCIA.md)
