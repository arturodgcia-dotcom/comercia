from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.models import PosEmployee, PosLocation, PosSale, User
from app.schemas.pos import (
    PosCustomerCreate,
    PosCustomerRead,
    PosEmployeeCreate,
    PosEmployeeRead,
    PosEmployeeUpdate,
    PosLocationCreate,
    PosLocationRead,
    PosLocationUpdate,
    PosPaymentConfirmRequest,
    PosPaymentCreateRequest,
    PosPaymentTransactionRead,
    PosSaleCreate,
    PosSaleRead,
)
from app.services.pos_payment_service import (
    confirm_mercadopago_payment,
    create_mercadopago_payment_link,
    create_mercadopago_qr_charge_placeholder,
    list_pos_payments_by_tenant,
    register_pos_sale_payment,
)
from app.services.pos_service import create_pos_sale
from app.services.security_watch_service import create_security_alert, log_security_event

router = APIRouter()


@router.get("/locations/by-tenant/{tenant_id}", response_model=list[PosLocationRead])
def list_locations_by_tenant(tenant_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return db.scalars(select(PosLocation).where(PosLocation.tenant_id == tenant_id).order_by(PosLocation.id.desc())).all()


@router.post("/locations", response_model=PosLocationRead)
def create_location(payload: PosLocationCreate, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    row = PosLocation(**payload.model_dump())
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


@router.put("/locations/{location_id}", response_model=PosLocationRead)
def update_location(
    location_id: int, payload: PosLocationUpdate, db: Session = Depends(get_db), _: User = Depends(get_current_user)
):
    row = db.get(PosLocation, location_id)
    if not row:
        raise HTTPException(status_code=404, detail="ubicacion POS no encontrada")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(row, key, value)
    db.commit()
    db.refresh(row)
    return row


@router.get("/employees/by-location/{location_id}", response_model=list[PosEmployeeRead])
def list_employees_by_location(location_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return db.scalars(
        select(PosEmployee).where(PosEmployee.pos_location_id == location_id).order_by(PosEmployee.id.desc())
    ).all()


@router.post("/employees", response_model=PosEmployeeRead)
def create_employee(payload: PosEmployeeCreate, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    row = PosEmployee(**payload.model_dump())
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


@router.put("/employees/{employee_id}", response_model=PosEmployeeRead)
def update_employee(
    employee_id: int, payload: PosEmployeeUpdate, db: Session = Depends(get_db), _: User = Depends(get_current_user)
):
    row = db.get(PosEmployee, employee_id)
    if not row:
        raise HTTPException(status_code=404, detail="empleado POS no encontrado")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(row, key, value)
    db.commit()
    db.refresh(row)
    return row


@router.post("/sales", response_model=PosSaleRead)
def create_sale(payload: PosSaleCreate, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    sale = create_pos_sale(
        db,
        tenant_id=payload.tenant_id,
        pos_location_id=payload.pos_location_id,
        customer_id=payload.customer_id,
        employee_id=payload.employee_id,
        currency=payload.currency,
        payment_method=payload.payment_method,
        notes=payload.notes,
        items=[item.model_dump() for item in payload.items],
        use_loyalty_points=payload.use_loyalty_points,
        register_membership=payload.register_membership,
    )
    if float(sale.total_amount) >= 50000:
        event = log_security_event(
            db,
            event_type="abnormal_pos_activity",
            severity="high",
            tenant_id=sale.tenant_id,
            source_ip=None,
            payload={"pos_sale_id": sale.id, "total_amount": float(sale.total_amount)},
            auto_commit=False,
        )
        create_security_alert(
            db,
            alert_type="abnormal_pos_activity",
            title="Venta POS inusual detectada",
            message=f"Venta POS #{sale.id} con monto alto: {sale.total_amount}.",
            severity="high",
            tenant_id=sale.tenant_id,
            security_event_id=event.id,
            auto_commit=False,
        )
        db.commit()
    return sale


@router.post("/payments/mercadopago/link", response_model=PosPaymentTransactionRead)
def create_mercadopago_link(
    payload: PosPaymentCreateRequest, db: Session = Depends(get_db), _: User = Depends(get_current_user)
):
    try:
        return create_mercadopago_payment_link(
            db,
            tenant_id=payload.tenant_id,
            amount=payload.amount,
            currency=payload.currency,
            pos_location_id=payload.pos_location_id,
            customer_id=payload.customer_id,
            employee_id=payload.employee_id,
            sale_payload=payload.sale_payload,
            notes=payload.notes,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/payments/mercadopago/qr", response_model=PosPaymentTransactionRead)
def create_mercadopago_qr(
    payload: PosPaymentCreateRequest, db: Session = Depends(get_db), _: User = Depends(get_current_user)
):
    try:
        return create_mercadopago_qr_charge_placeholder(
            db,
            tenant_id=payload.tenant_id,
            amount=payload.amount,
            currency=payload.currency,
            pos_location_id=payload.pos_location_id,
            customer_id=payload.customer_id,
            employee_id=payload.employee_id,
            sale_payload=payload.sale_payload,
            notes=payload.notes,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/payments/mercadopago/confirm", response_model=PosPaymentTransactionRead)
def confirm_mercadopago(
    payload: PosPaymentConfirmRequest, db: Session = Depends(get_db), _: User = Depends(get_current_user)
):
    row = confirm_mercadopago_payment(
        db,
        external_reference=payload.external_reference,
        paid=payload.paid,
        provider_payload=payload.provider_payload,
        notes=payload.notes,
    )
    if not row:
        raise HTTPException(status_code=404, detail="transaccion POS no encontrada")
    return register_pos_sale_payment(db, transaction=row)


@router.get("/payments/by-tenant/{tenant_id}", response_model=list[PosPaymentTransactionRead])
def list_pos_payments(tenant_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return list_pos_payments_by_tenant(db, tenant_id=tenant_id)


@router.get("/sales/by-tenant/{tenant_id}", response_model=list[PosSaleRead])
def list_sales_by_tenant(tenant_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return db.scalars(select(PosSale).where(PosSale.tenant_id == tenant_id).order_by(PosSale.id.desc())).all()


@router.get("/sales/by-location/{location_id}", response_model=list[PosSaleRead])
def list_sales_by_location(location_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return db.scalars(
        select(PosSale).where(PosSale.pos_location_id == location_id).order_by(PosSale.id.desc())
    ).all()


@router.get("/customers/by-tenant/{tenant_id}", response_model=list[PosCustomerRead])
def list_pos_customers(tenant_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    from app.models.models import Customer

    return db.scalars(select(Customer).where(Customer.tenant_id == tenant_id).order_by(Customer.id.desc()).limit(200)).all()


@router.post("/customers", response_model=PosCustomerRead)
def create_pos_customer(payload: PosCustomerCreate, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    from app.models.models import Customer

    row = Customer(**payload.model_dump(), loyalty_points=0)
    db.add(row)
    db.commit()
    db.refresh(row)
    return row
