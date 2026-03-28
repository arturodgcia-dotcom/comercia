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
| Bots / agentes | Base arquitectura | pendiente implementacion |

## Endpoints operacion comercial (nuevos)
- `/api/v1/services/*`
- `/api/v1/appointments/*`
- `/api/v1/distributors/*`
- `/api/v1/contracts/*`
- `/api/v1/recurring-orders/*`
- `/api/v1/logistics/*`
- `/api/v1/storefront/{tenant_slug}/services`
