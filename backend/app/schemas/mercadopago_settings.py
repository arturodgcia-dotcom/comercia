from pydantic import BaseModel

from app.schemas.common import TimestampSchema


class MercadoPagoSettingsUpsert(BaseModel):
    mercadopago_enabled: bool = False
    mercadopago_public_key: str | None = None
    mercadopago_access_token: str | None = None
    mercadopago_qr_enabled: bool = True
    mercadopago_payment_link_enabled: bool = True
    mercadopago_point_enabled: bool = False
    mercadopago_active_for_pos_only: bool = True


class MercadoPagoSettingsRead(TimestampSchema):
    id: int
    tenant_id: int
    mercadopago_enabled: bool
    mercadopago_public_key: str | None
    mercadopago_access_token: str | None
    mercadopago_qr_enabled: bool
    mercadopago_payment_link_enabled: bool
    mercadopago_point_enabled: bool
    mercadopago_active_for_pos_only: bool
