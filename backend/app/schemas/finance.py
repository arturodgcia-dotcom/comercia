from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel


class FinanceClientSummaryRow(BaseModel):
    commercial_client_account_id: int | None = None
    cliente_principal: str
    ventas_totales: Decimal
    ventas_sujetas_comision: Decimal
    comision_total_generada: Decimal
    comision_reinpia: Decimal
    comision_distribuida: Decimal


class FinanceCommissionAgentSummaryRow(BaseModel):
    commission_agent_id: int
    nombre: str
    tipo: str
    marcas_asociadas: list[str]
    porcentaje: Decimal
    comision_generada: Decimal
    comision_pendiente: Decimal
    comision_pagada: Decimal


class FinanceOperationDetailRow(BaseModel):
    order_id: int
    tenant_id: int
    tenant_name: str
    commercial_client_account_id: int | None = None
    cliente_principal: str
    status: str
    total_venta: Decimal
    comision_reinpia: Decimal
    comisionista_id: int | None = None
    comisionista_nombre: str | None = None
    comisionista_porcentaje: Decimal
    comision_distribuida: Decimal
    created_at: datetime


class FinanceDashboardResponse(BaseModel):
    resumen_ejecutivo: list[FinanceClientSummaryRow]
    comisionistas: list[FinanceCommissionAgentSummaryRow]
    detalle_operaciones: list[FinanceOperationDetailRow]
    conciliacion: dict[str, Decimal]


class CommissionSettlementCreate(BaseModel):
    commission_agent_id: int
    amount_paid: Decimal
    tenant_id: int | None = None
    commercial_client_account_id: int | None = None
    period_from: datetime | None = None
    period_to: datetime | None = None
    paid_at: datetime | None = None
    notes: str | None = None


class CommissionSettlementRead(BaseModel):
    id: int
    commission_agent_id: int
    amount_paid: Decimal
    tenant_id: int | None = None
    commercial_client_account_id: int | None = None
    period_from: datetime | None = None
    period_to: datetime | None = None
    paid_at: datetime | None = None
    notes: str | None = None
    created_by_user_id: int | None = None
    created_at: datetime
    updated_at: datetime
