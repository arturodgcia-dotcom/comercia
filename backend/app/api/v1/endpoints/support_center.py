import json
from datetime import datetime
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.models import CommercialClientAccount, Tenant, User
from app.schemas.support_center import (
    ResponseConfigPayload,
    ResponseConfigRead,
    ResponseConfigSubmitResult,
    SUPPORT_CATEGORIES,
    SUPPORT_ORIGINS,
    SUPPORT_PRIORITIES,
    SUPPORT_STATES,
    SupportBackofficeAssigneeRead,
    SupportBackofficeSummaryRead,
    SupportBackofficeTicketRead,
    SupportChatRequest,
    SupportChatResponse,
    SupportOverviewRead,
    SupportTicketBackofficeUpdate,
    SupportTicketCreate,
    SupportTicketRead,
    SupportTicketStatusUpdate,
    SupportTicketTimelineEventRead,
)
from app.services.role_permissions_service import has_permission, role_matches_any_alias
from app.services.support_center_store import UPLOADS_DIR, to_datetime, utc_now_iso, with_store

router = APIRouter()
BACKOFFICE_ALLOWED_ROLES = {"super_admin", "soporte", "operaciones"}
ASSIGNABLE_ROLE_KEYS = {"soporte", "operaciones", "comercial", "super_admin"}


def _normalize(value: str | None) -> str:
    return (value or "").strip().lower()


def _normalize_state(value: str | None) -> str:
    normalized = _normalize(value)
    if normalized == "pendiente de cliente":
        return "en espera cliente"
    if normalized == "abierto":
        return "pendiente"
    return normalized


def _is_open_status(state: str | None) -> bool:
    return _normalize_state(state) not in {"resuelto", "cerrado"}


def _priority_sla_minutes(priority: str | None) -> int:
    normalized = _normalize(priority)
    if normalized == "urgente":
        return 120
    if normalized == "alta":
        return 480
    if normalized == "media":
        return 1440
    return 2880


def _minutes_since(value: str | None) -> int:
    dt = to_datetime(value)
    return max(0, int((datetime.utcnow() - dt).total_seconds() // 60))


def _parse_limits(raw_json: str | None) -> dict[str, int]:
    if not raw_json:
        return {}
    try:
        payload = json.loads(raw_json)
    except Exception:
        return {}
    if not isinstance(payload, dict):
        return {}
    usage: dict[str, int] = {}
    for key in ("brands", "users", "ai_agents", "products", "branches", "ai_tokens"):
        value = payload.get(key)
        if isinstance(value, (int, float)):
            usage[key] = int(value)
    return usage


def _assert_backoffice_access(db: Session, current_user: User) -> None:
    if role_matches_any_alias(current_user.role, BACKOFFICE_ALLOWED_ROLES):
        return
    if has_permission(db, current_user, "global.view_support"):
        return
    raise HTTPException(status_code=403, detail="sin permisos para soporte global")


def _assert_scope(db: Session, current_user: User, tenant_id: int) -> None:
    if role_matches_any_alias(current_user.role, {"super_admin"}):
        return
    if has_permission(db, current_user, "global.view_support"):
        return
    if current_user.tenant_id != tenant_id:
        raise HTTPException(status_code=403, detail="sin permisos para esta marca")


def _plan_tier(tenant: Tenant) -> str:
    key = str(tenant.commercial_plan_key or "").lower()
    if "premium" in key:
        return "premium"
    if "growth" in key:
        return "growth"
    return "basic"


def _chat_enabled(tier: str) -> bool:
    return tier in {"growth", "premium"}


def _build_overview(tenant: Tenant) -> SupportOverviewRead:
    tier = _plan_tier(tenant)
    return SupportOverviewRead(
        tenant_id=tenant.id,
        plan_tier=tier,
        support_channel="ticket y correo" if tier == "basic" else "ticket + chat IA + escalamiento",
        official_email="soporte@comercia.mx",
        chat_enabled=_chat_enabled(tier),
        escalation_enabled=tier in {"growth", "premium"},
        human_escalation_hint="Escalamiento preparado a atencion humana/Telegram interno.",
    )


def _serialize_ticket(ticket: dict) -> SupportTicketRead:
    return SupportTicketRead(
        id=int(ticket["id"]),
        folio=ticket.get("folio"),
        tenant_id=int(ticket["tenant_id"]),
        asunto=str(ticket["asunto"]),
        descripcion=str(ticket["descripcion"]),
        categoria=str(ticket["categoria"]),
        prioridad=str(ticket["prioridad"]),
        marca_relacionada=ticket.get("marca_relacionada"),
        correo_contacto=str(ticket["correo_contacto"]),
        telefono_whatsapp=ticket.get("telefono_whatsapp"),
        estado=_normalize_state(ticket.get("estado")),
        respuesta=ticket.get("respuesta"),
        responsable=ticket.get("responsable"),
        responsable_user_id=ticket.get("responsable_user_id"),
        origen=ticket.get("origen"),
        created_at=to_datetime(ticket.get("created_at")),
        updated_at=to_datetime(ticket.get("updated_at")),
        attachments=[
            {
                "id": int(item["id"]),
                "file_name": str(item["file_name"]),
                "stored_path": str(item["stored_path"]),
                "uploaded_at": to_datetime(item.get("uploaded_at")),
            }
            for item in ticket.get("attachments", [])
        ],
        mensajes=[
            {
                "id": int(item["id"]),
                "role": str(item["role"]),
                "message": str(item["message"]),
                "created_at": to_datetime(item.get("created_at")),
            }
            for item in ticket.get("mensajes", [])
        ],
    )


def _serialize_timeline_event(raw: dict) -> SupportTicketTimelineEventRead:
    return SupportTicketTimelineEventRead(
        id=int(raw.get("id", 0)),
        ticket_id=int(raw.get("ticket_id", 0)),
        event_type=str(raw.get("event_type", "evento")),
        actor_user_id=raw.get("actor_user_id"),
        actor_name=raw.get("actor_name"),
        actor_role=raw.get("actor_role"),
        note=raw.get("note"),
        created_at=to_datetime(raw.get("created_at")),
    )


def _add_timeline_event(
    store: dict,
    *,
    ticket_id: int,
    event_type: str,
    actor_user: User | None,
    note: str | None = None,
) -> None:
    event_id = int(store.get("next_timeline_event_id", 1))
    store["next_timeline_event_id"] = event_id + 1
    store.setdefault("timeline_events", []).append(
        {
            "id": event_id,
            "ticket_id": ticket_id,
            "event_type": event_type,
            "actor_user_id": actor_user.id if actor_user else None,
            "actor_name": actor_user.full_name if actor_user else None,
            "actor_role": actor_user.role if actor_user else None,
            "note": note,
            "created_at": utc_now_iso(),
        }
    )


def _load_backoffice_context(db: Session):
    tenants = db.scalars(select(Tenant)).all()
    tenant_by_id = {tenant.id: tenant for tenant in tenants}
    client_ids = {int(tenant.commercial_client_account_id or 0) for tenant in tenants if tenant.commercial_client_account_id}
    client_rows = (
        db.scalars(select(CommercialClientAccount).where(CommercialClientAccount.id.in_(tuple(client_ids)))).all()
        if client_ids
        else []
    )
    client_by_id = {row.id: row for row in client_rows}
    return tenant_by_id, client_by_id


def _to_backoffice_ticket(
    ticket: dict,
    tenant_by_id: dict[int, Tenant],
    client_by_id: dict[int, CommercialClientAccount],
    previous_count_by_tenant: dict[int, int],
    timeline_events_by_ticket: dict[int, list[dict]],
) -> SupportBackofficeTicketRead:
    base = _serialize_ticket(ticket)
    tenant = tenant_by_id.get(base.tenant_id)
    client = client_by_id.get(int(tenant.commercial_client_account_id or 0)) if tenant else None
    created_iso = ticket.get("created_at")
    last_response_iso = ticket.get("ultima_respuesta_at") or created_iso
    time_open = _minutes_since(created_iso)
    time_without_response = _minutes_since(last_response_iso)
    sla_minutes = _priority_sla_minutes(ticket.get("prioridad"))
    overdue = _is_open_status(ticket.get("estado")) and time_without_response > sla_minutes

    return SupportBackofficeTicketRead(
        **base.model_dump(),
        cliente_principal=client.legal_name if client else (tenant.name if tenant else None),
        cliente_principal_id=client.id if client else None,
        marca=tenant.name if tenant else base.marca_relacionada,
        ultima_respuesta_at=to_datetime(ticket.get("ultima_respuesta_at")) if ticket.get("ultima_respuesta_at") else None,
        tiempo_abierto_min=time_open,
        tiempo_sin_respuesta_min=time_without_response,
        vencido_sla=overdue,
        total_tickets_previos_marca=previous_count_by_tenant.get(base.tenant_id, 0),
        plan_activo=(tenant.commercial_plan_key if tenant and tenant.commercial_plan_key else None),
        uso_plan=_parse_limits(tenant.commercial_limits_json if tenant else None),
        timeline=[_serialize_timeline_event(row) for row in timeline_events_by_ticket.get(base.id, [])],
    )


def _ai_support_reply(message: str) -> tuple[str, bool]:
    text = message.lower()
    if "error" in text or "falla" in text or "no funciona" in text:
        return ("Revisamos un posible incidente tecnico. Te recomendamos adjuntar captura y pasos para reproducir.", True)
    if "pago" in text or "factura" in text:
        return ("Para temas de pago/facturacion validaremos el historial de cobro. Te ayudamos a escalar con el equipo financiero.", True)
    if "token" in text or "ia" in text:
        return ("Detectamos una consulta sobre consumo IA. Podemos revisar capacidad y recomendar add-ons o upgrade.", False)
    if "distribuidor" in text:
        return ("Podemos apoyarte con alta/autorizacion de distribuidores y validacion contractual.", False)
    return ("Gracias por tu mensaje. Nuestro asistente sugiere revisar ticket y, si es necesario, escalar a un especialista humano.", False)


@router.get("/tenant/{tenant_id}/overview", response_model=SupportOverviewRead)
def support_overview(tenant_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    tenant = db.get(Tenant, tenant_id)
    if not tenant:
        raise HTTPException(status_code=404, detail="marca no encontrada")
    _assert_scope(db, current_user, tenant_id)
    return _build_overview(tenant)


@router.post("/tenant/{tenant_id}/tickets", response_model=SupportTicketRead)
def create_ticket(
    tenant_id: int,
    payload: SupportTicketCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    tenant = db.get(Tenant, tenant_id)
    if not tenant:
        raise HTTPException(status_code=404, detail="marca no encontrada")
    _assert_scope(db, current_user, tenant_id)
    if payload.tenant_id != tenant_id:
        raise HTTPException(status_code=400, detail="tenant_id inconsistente")

    category = _normalize(payload.categoria)
    priority = _normalize(payload.prioridad)
    origin = _normalize(payload.origen)
    if category not in SUPPORT_CATEGORIES:
        category = "operacion"
    if priority not in SUPPORT_PRIORITIES:
        priority = "media"
    if origin not in SUPPORT_ORIGINS:
        origin = "cliente"

    def _mutate(store: dict):
        ticket_id = int(store["next_ticket_id"])
        store["next_ticket_id"] = ticket_id + 1
        now = utc_now_iso()
        ticket = {
            "id": ticket_id,
            "folio": f"SUP-{ticket_id:06d}",
            "tenant_id": tenant_id,
            "asunto": payload.asunto.strip(),
            "descripcion": payload.descripcion.strip(),
            "categoria": category,
            "prioridad": priority,
            "marca_relacionada": payload.marca_relacionada,
            "correo_contacto": payload.correo_contacto.strip().lower(),
            "telefono_whatsapp": payload.telefono_whatsapp,
            "estado": "nuevo",
            "respuesta": None,
            "responsable": None,
            "responsable_user_id": None,
            "origen": origin,
            "ultima_respuesta_at": now,
            "created_at": now,
            "updated_at": now,
            "attachments": [],
            "mensajes": [],
        }
        store.setdefault("tickets", []).append(ticket)
        _add_timeline_event(
            store,
            ticket_id=ticket_id,
            event_type="creado",
            actor_user=current_user,
            note=f"Ticket creado con prioridad {priority} y categoria {category}.",
        )
        return ticket

    created = with_store(_mutate)
    return _serialize_ticket(created)


@router.get("/tenant/{tenant_id}/tickets", response_model=list[SupportTicketRead])
def list_tickets(tenant_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    tenant = db.get(Tenant, tenant_id)
    if not tenant:
        raise HTTPException(status_code=404, detail="marca no encontrada")
    _assert_scope(db, current_user, tenant_id)

    def _read(store: dict):
        return [row for row in store.get("tickets", []) if int(row.get("tenant_id", 0)) == tenant_id]

    rows = with_store(_read)
    rows.sort(key=lambda item: item.get("id", 0), reverse=True)
    return [_serialize_ticket(row) for row in rows]


@router.put("/tickets/{ticket_id}/status", response_model=SupportTicketRead)
def update_ticket_status(
    ticket_id: int,
    payload: SupportTicketStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    normalized_state = _normalize_state(payload.estado)
    if normalized_state not in SUPPORT_STATES:
        raise HTTPException(status_code=400, detail="estado no valido")

    def _mutate(store: dict):
        for ticket in store.get("tickets", []):
            if int(ticket.get("id", 0)) != ticket_id:
                continue
            _assert_scope(db, current_user, int(ticket["tenant_id"]))
            previous_state = _normalize_state(ticket.get("estado"))
            ticket["estado"] = normalized_state
            if payload.respuesta is not None:
                ticket["respuesta"] = payload.respuesta
                ticket["ultima_respuesta_at"] = utc_now_iso()
                _add_timeline_event(
                    store,
                    ticket_id=ticket_id,
                    event_type="respuesta enviada",
                    actor_user=current_user,
                    note=payload.respuesta,
                )
            if payload.responsable is not None:
                ticket["responsable"] = payload.responsable
            if payload.responsable_user_id is not None:
                ticket["responsable_user_id"] = payload.responsable_user_id
            if previous_state != normalized_state:
                _add_timeline_event(
                    store,
                    ticket_id=ticket_id,
                    event_type="cambio de estado",
                    actor_user=current_user,
                    note=f"{previous_state or 'sin estado'} -> {normalized_state}",
                )
            if payload.comentario_interno:
                _add_timeline_event(
                    store,
                    ticket_id=ticket_id,
                    event_type="comentario interno",
                    actor_user=current_user,
                    note=payload.comentario_interno,
                )
            ticket["updated_at"] = utc_now_iso()
            return ticket
        return None

    updated = with_store(_mutate)
    if not updated:
        raise HTTPException(status_code=404, detail="ticket no encontrado")
    return _serialize_ticket(updated)


@router.post("/tickets/{ticket_id}/attachments", response_model=SupportTicketRead)
async def upload_ticket_attachment(
    ticket_id: int,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    suffix = Path(file.filename or "adjunto.bin").suffix.lower()
    allowed = {".png", ".jpg", ".jpeg", ".webp", ".pdf", ".txt", ".md", ".csv"}
    if suffix not in allowed:
        raise HTTPException(status_code=400, detail="tipo de archivo no permitido")

    data = await file.read()
    if len(data) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="archivo excede 5MB")

    def _mutate(store: dict):
        for ticket in store.get("tickets", []):
            if int(ticket.get("id", 0)) != ticket_id:
                continue
            _assert_scope(db, current_user, int(ticket["tenant_id"]))
            attachment_id = int(store["next_attachment_id"])
            store["next_attachment_id"] = attachment_id + 1
            file_name = f"ticket_{ticket_id}_att_{attachment_id}{suffix}"
            abs_path = UPLOADS_DIR / file_name
            abs_path.write_bytes(data)
            attachment = {
                "id": attachment_id,
                "file_name": file.filename or file_name,
                "stored_path": str(abs_path),
                "uploaded_at": utc_now_iso(),
            }
            ticket.setdefault("attachments", []).append(attachment)
            ticket["updated_at"] = utc_now_iso()
            _add_timeline_event(
                store,
                ticket_id=ticket_id,
                event_type="comentario interno",
                actor_user=current_user,
                note=f"Adjunto agregado: {attachment['file_name']}",
            )
            return ticket
        return None

    updated = with_store(_mutate)
    if not updated:
        raise HTTPException(status_code=404, detail="ticket no encontrado")
    return _serialize_ticket(updated)


@router.post("/tickets/{ticket_id}/chat", response_model=SupportChatResponse)
def support_chat(
    ticket_id: int,
    payload: SupportChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    target_ticket_holder: dict[str, dict] = {}

    def _resolve_ticket(store: dict):
        for ticket in store.get("tickets", []):
            if int(ticket.get("id", 0)) == ticket_id:
                target_ticket_holder["ticket"] = ticket
                return ticket
        return None

    ticket = with_store(_resolve_ticket)
    if not ticket:
        raise HTTPException(status_code=404, detail="ticket no encontrado")
    tenant_id = int(ticket["tenant_id"])
    _assert_scope(db, current_user, tenant_id)
    tenant = db.get(Tenant, tenant_id)
    if not tenant:
        raise HTTPException(status_code=404, detail="marca no encontrada")
    tier = _plan_tier(tenant)
    if not _chat_enabled(tier):
        raise HTTPException(status_code=403, detail="chat IA disponible solo en planes Growth y Premium")

    reply, escalate = _ai_support_reply(payload.message)

    def _mutate(store: dict):
        for row in store.get("tickets", []):
            if int(row.get("id", 0)) != ticket_id:
                continue
            message_id = int(store["next_message_id"])
            store["next_message_id"] = message_id + 1
            row.setdefault("mensajes", []).append(
                {"id": message_id, "role": "cliente", "message": payload.message.strip(), "created_at": utc_now_iso()}
            )
            row.setdefault("mensajes", []).append(
                {"id": message_id + 1, "role": "ia_soporte", "message": reply, "created_at": utc_now_iso()}
            )
            store["next_message_id"] = message_id + 2
            if escalate:
                row["estado"] = "escalado"
                _add_timeline_event(
                    store,
                    ticket_id=ticket_id,
                    event_type="cambio de estado",
                    actor_user=None,
                    note="Escalado por asistente IA",
                )
            row["ultima_respuesta_at"] = utc_now_iso()
            _add_timeline_event(
                store,
                ticket_id=ticket_id,
                event_type="respuesta enviada",
                actor_user=None,
                note=reply,
            )
            row["updated_at"] = utc_now_iso()
            return row
        return None

    updated = with_store(_mutate)
    if not updated:
        raise HTTPException(status_code=404, detail="ticket no encontrado")

    return SupportChatResponse(
        ticket_id=ticket_id,
        chat_enabled=True,
        response=reply,
        escalate_to_human=escalate,
        channel_hint="Escalamiento disponible a humano (Telegram interno / atencion manual).",
        updated_ticket=_serialize_ticket(updated),
    )


@router.get("/backoffice/summary", response_model=SupportBackofficeSummaryRead)
def backoffice_summary(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    _assert_backoffice_access(db, current_user)

    def _read(store: dict):
        return list(store.get("tickets", []))

    tickets = with_store(_read)
    normalized_states = [_normalize_state(row.get("estado")) for row in tickets]

    overdue_count = 0
    for row in tickets:
        open_minutes = _minutes_since(row.get("ultima_respuesta_at") or row.get("created_at"))
        if _is_open_status(row.get("estado")) and open_minutes > _priority_sla_minutes(row.get("prioridad")):
            overdue_count += 1

    return SupportBackofficeSummaryRead(
        total=len(tickets),
        nuevos=sum(1 for state in normalized_states if state == "nuevo"),
        pendientes=sum(1 for state in normalized_states if state in {"pendiente", "en revision"}),
        en_espera_cliente=sum(1 for state in normalized_states if state in {"en espera cliente", "pendiente de cliente"}),
        resueltos=sum(1 for state in normalized_states if state == "resuelto"),
        escalados=sum(1 for state in normalized_states if state == "escalado"),
        vencidos_sla=overdue_count,
    )


@router.get("/backoffice/assignees", response_model=list[SupportBackofficeAssigneeRead])
def backoffice_assignees(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    _assert_backoffice_access(db, current_user)

    users = db.scalars(select(User).where(User.tenant_id.is_(None), User.is_active.is_(True)).order_by(User.full_name.asc())).all()
    rows: list[SupportBackofficeAssigneeRead] = []
    for user in users:
        if role_matches_any_alias(user.role, ASSIGNABLE_ROLE_KEYS):
            rows.append(
                SupportBackofficeAssigneeRead(
                    user_id=user.id,
                    full_name=user.full_name,
                    email=user.email,
                    role=user.role,
                )
            )
    return rows


@router.get("/backoffice/tickets", response_model=list[SupportBackofficeTicketRead])
def backoffice_tickets(
    estado: str | None = Query(default=None),
    prioridad: str | None = Query(default=None),
    responsable_user_id: int | None = Query(default=None),
    tenant_id: int | None = Query(default=None),
    q: str | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _assert_backoffice_access(db, current_user)
    tenant_by_id, client_by_id = _load_backoffice_context(db)

    search_term = _normalize(q)
    state_filter = _normalize_state(estado)
    priority_filter = _normalize(prioridad)

    def _read(store: dict):
        tickets = list(store.get("tickets", []))
        timeline_events = list(store.get("timeline_events", []))
        return tickets, timeline_events

    tickets, timeline_events = with_store(_read)
    timeline_by_ticket: dict[int, list[dict]] = {}
    for event in timeline_events:
        ticket_id_value = int(event.get("ticket_id", 0))
        timeline_by_ticket.setdefault(ticket_id_value, []).append(event)
    for rows in timeline_by_ticket.values():
        rows.sort(key=lambda row: row.get("created_at", ""), reverse=True)

    per_tenant_count: dict[int, int] = {}
    for row in tickets:
        tid = int(row.get("tenant_id", 0))
        per_tenant_count[tid] = per_tenant_count.get(tid, 0) + 1

    output: list[SupportBackofficeTicketRead] = []
    for row in sorted(tickets, key=lambda item: item.get("updated_at") or "", reverse=True):
        row_state = _normalize_state(row.get("estado"))
        row_priority = _normalize(row.get("prioridad"))
        row_tenant_id = int(row.get("tenant_id", 0))
        row_assignee_id = row.get("responsable_user_id")

        if state_filter and row_state != state_filter:
            continue
        if priority_filter and row_priority != priority_filter:
            continue
        if tenant_id and row_tenant_id != tenant_id:
            continue
        if responsable_user_id is not None and int(row_assignee_id or 0) != responsable_user_id:
            continue
        if search_term:
            searchable = " ".join(
                [
                    str(row.get("folio") or ""),
                    str(row.get("asunto") or ""),
                    str(row.get("descripcion") or ""),
                    str(row.get("categoria") or ""),
                    str(row.get("marca_relacionada") or ""),
                    str(tenant_by_id.get(row_tenant_id).name if tenant_by_id.get(row_tenant_id) else ""),
                ]
            ).lower()
            if search_term not in searchable:
                continue

        previous_tickets = max(0, per_tenant_count.get(row_tenant_id, 1) - 1)
        output.append(
            _to_backoffice_ticket(
                row,
                tenant_by_id,
                client_by_id,
                {row_tenant_id: previous_tickets},
                timeline_by_ticket,
            )
        )
    return output


@router.get("/backoffice/tickets/{ticket_id}", response_model=SupportBackofficeTicketRead)
def backoffice_ticket_detail(ticket_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    _assert_backoffice_access(db, current_user)
    tenant_by_id, client_by_id = _load_backoffice_context(db)

    def _read(store: dict):
        ticket = None
        for row in store.get("tickets", []):
            if int(row.get("id", 0)) == ticket_id:
                ticket = row
                break
        timeline = [row for row in store.get("timeline_events", []) if int(row.get("ticket_id", 0)) == ticket_id]
        return ticket, timeline, list(store.get("tickets", []))

    ticket, timeline, all_tickets = with_store(_read)
    if not ticket:
        raise HTTPException(status_code=404, detail="ticket no encontrado")

    row_tenant_id = int(ticket.get("tenant_id", 0))
    previous_tickets = max(0, sum(1 for row in all_tickets if int(row.get("tenant_id", 0)) == row_tenant_id) - 1)
    timeline.sort(key=lambda row: row.get("created_at", ""), reverse=True)
    timeline_map = {ticket_id: timeline}

    return _to_backoffice_ticket(
        ticket,
        tenant_by_id,
        client_by_id,
        {row_tenant_id: previous_tickets},
        timeline_map,
    )


@router.put("/backoffice/tickets/{ticket_id}", response_model=SupportBackofficeTicketRead)
def backoffice_update_ticket(
    ticket_id: int,
    payload: SupportTicketBackofficeUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _assert_backoffice_access(db, current_user)

    normalized_state = _normalize_state(payload.estado) if payload.estado else None
    if normalized_state and normalized_state not in SUPPORT_STATES:
        raise HTTPException(status_code=400, detail="estado no valido")
    normalized_priority = _normalize(payload.prioridad) if payload.prioridad else None
    if normalized_priority and normalized_priority not in SUPPORT_PRIORITIES:
        raise HTTPException(status_code=400, detail="prioridad no valida")

    assignee_name = None
    if payload.responsable_user_id is not None:
        assignee = db.get(User, payload.responsable_user_id)
        if not assignee or not assignee.is_active:
            raise HTTPException(status_code=404, detail="responsable no encontrado")
        if not role_matches_any_alias(assignee.role, ASSIGNABLE_ROLE_KEYS):
            raise HTTPException(status_code=400, detail="responsable no autorizado para soporte")
        assignee_name = assignee.full_name

    def _mutate(store: dict):
        for row in store.get("tickets", []):
            if int(row.get("id", 0)) != ticket_id:
                continue

            if normalized_state and _normalize_state(row.get("estado")) != normalized_state:
                _add_timeline_event(
                    store,
                    ticket_id=ticket_id,
                    event_type="cambio de estado",
                    actor_user=current_user,
                    note=f"{_normalize_state(row.get('estado'))} -> {normalized_state}",
                )
                row["estado"] = normalized_state

            if normalized_priority and _normalize(row.get("prioridad")) != normalized_priority:
                _add_timeline_event(
                    store,
                    ticket_id=ticket_id,
                    event_type="comentario interno",
                    actor_user=current_user,
                    note=f"Prioridad ajustada a {normalized_priority}.",
                )
                row["prioridad"] = normalized_priority

            if payload.responsable_user_id is not None:
                current_assignee = int(row.get("responsable_user_id") or 0)
                if current_assignee != payload.responsable_user_id:
                    row["responsable_user_id"] = payload.responsable_user_id
                    row["responsable"] = assignee_name
                    _add_timeline_event(
                        store,
                        ticket_id=ticket_id,
                        event_type="reasignado",
                        actor_user=current_user,
                        note=f"Asignado a {assignee_name}.",
                    )

            if payload.comentario_interno:
                _add_timeline_event(
                    store,
                    ticket_id=ticket_id,
                    event_type="comentario interno",
                    actor_user=current_user,
                    note=payload.comentario_interno,
                )

            row["updated_at"] = utc_now_iso()
            return row
        return None

    updated = with_store(_mutate)
    if not updated:
        raise HTTPException(status_code=404, detail="ticket no encontrado")
    return backoffice_ticket_detail(ticket_id, db, current_user)


@router.get("/tenant/{tenant_id}/responses-config", response_model=ResponseConfigRead | None)
def get_responses_config(tenant_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    tenant = db.get(Tenant, tenant_id)
    if not tenant:
        raise HTTPException(status_code=404, detail="marca no encontrada")
    _assert_scope(db, current_user, tenant_id)

    def _read(store: dict):
        for row in store.get("response_configs", []):
            if int(row.get("tenant_id", 0)) == tenant_id:
                return row
        return None

    raw = with_store(_read)
    if not raw:
        return None
    return ResponseConfigRead(
        id=int(raw["id"]),
        tenant_id=tenant_id,
        tono_atencion=str(raw.get("tono_atencion", "")),
        saludo_inicial=str(raw.get("saludo_inicial", "")),
        speech_comercial_base=str(raw.get("speech_comercial_base", "")),
        preguntas_frecuentes=str(raw.get("preguntas_frecuentes", "")),
        objeciones_frecuentes=str(raw.get("objeciones_frecuentes", "")),
        restricciones_respuesta=str(raw.get("restricciones_respuesta", "")),
        horario_atencion=str(raw.get("horario_atencion", "")),
        mensajes_cierre=str(raw.get("mensajes_cierre", "")),
        estilo_deseado=str(raw.get("estilo_deseado", "")),
        notas_adicionales=raw.get("notas_adicionales"),
        documento_base=raw.get("documento_base"),
        last_updated_at=to_datetime(raw.get("last_updated_at")),
        pending_apply=bool(raw.get("pending_apply", False)),
        active_agents_count=int(raw.get("active_agents_count", 0)),
        last_applied_at=to_datetime(raw.get("last_applied_at")) if raw.get("last_applied_at") else None,
    )


@router.put("/tenant/{tenant_id}/responses-config", response_model=ResponseConfigRead)
def save_responses_config(
    tenant_id: int,
    payload: ResponseConfigPayload,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    tenant = db.get(Tenant, tenant_id)
    if not tenant:
        raise HTTPException(status_code=404, detail="marca no encontrada")
    _assert_scope(db, current_user, tenant_id)
    if payload.tenant_id != tenant_id:
        raise HTTPException(status_code=400, detail="tenant_id inconsistente")

    def _mutate(store: dict):
        now = utc_now_iso()
        for row in store.get("response_configs", []):
            if int(row.get("tenant_id", 0)) != tenant_id:
                continue
            row.update(payload.model_dump())
            row["pending_apply"] = True
            row["active_agents_count"] = int(max(0, int(tenant.ai_tokens_included or 0) // 500))
            row["last_updated_at"] = now
            return row
        next_id = int(store["next_response_config_id"])
        store["next_response_config_id"] = next_id + 1
        created = payload.model_dump()
        created.update(
            {
                "id": next_id,
                "pending_apply": True,
                "active_agents_count": int(max(0, int(tenant.ai_tokens_included or 0) // 500)),
                "last_updated_at": now,
                "last_applied_at": None,
            }
        )
        store.setdefault("response_configs", []).append(created)
        return created

    row = with_store(_mutate)
    return ResponseConfigRead(
        id=int(row["id"]),
        tenant_id=tenant_id,
        tono_atencion=str(row.get("tono_atencion", "")),
        saludo_inicial=str(row.get("saludo_inicial", "")),
        speech_comercial_base=str(row.get("speech_comercial_base", "")),
        preguntas_frecuentes=str(row.get("preguntas_frecuentes", "")),
        objeciones_frecuentes=str(row.get("objeciones_frecuentes", "")),
        restricciones_respuesta=str(row.get("restricciones_respuesta", "")),
        horario_atencion=str(row.get("horario_atencion", "")),
        mensajes_cierre=str(row.get("mensajes_cierre", "")),
        estilo_deseado=str(row.get("estilo_deseado", "")),
        notas_adicionales=row.get("notas_adicionales"),
        documento_base=row.get("documento_base"),
        last_updated_at=to_datetime(row.get("last_updated_at")),
        pending_apply=bool(row.get("pending_apply", True)),
        active_agents_count=int(row.get("active_agents_count", 0)),
        last_applied_at=to_datetime(row.get("last_applied_at")) if row.get("last_applied_at") else None,
    )


@router.post("/tenant/{tenant_id}/responses-config/submit", response_model=ResponseConfigSubmitResult)
def submit_responses_config(
    tenant_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    tenant = db.get(Tenant, tenant_id)
    if not tenant:
        raise HTTPException(status_code=404, detail="marca no encontrada")
    _assert_scope(db, current_user, tenant_id)

    def _mutate(store: dict):
        cfg = None
        for row in store.get("response_configs", []):
            if int(row.get("tenant_id", 0)) == tenant_id:
                cfg = row
                break
        if not cfg:
            raise HTTPException(status_code=400, detail="no hay configuracion para enviar")

        ticket_id = int(store["next_ticket_id"])
        store["next_ticket_id"] = ticket_id + 1
        now = utc_now_iso()
        store.setdefault("tickets", []).append(
            {
                "id": ticket_id,
                "folio": f"SUP-{ticket_id:06d}",
                "tenant_id": tenant_id,
                "asunto": "Aplicacion de configuracion de respuestas y atencion",
                "descripcion": "Solicitud para que REINPIA aplique speech y estilo en agentes activos.",
                "categoria": "agentes ia",
                "prioridad": "media",
                "marca_relacionada": tenant.name,
                "correo_contacto": current_user.email,
                "telefono_whatsapp": None,
                "estado": "nuevo",
                "respuesta": "Solicitud recibida. Nuestro equipo aplicara esta configuracion en tus agentes activos.",
                "responsable": "soporte_reinpia",
                "responsable_user_id": None,
                "origen": "interno",
                "ultima_respuesta_at": now,
                "created_at": now,
                "updated_at": now,
                "attachments": [],
                "mensajes": [],
            }
        )
        _add_timeline_event(
            store,
            ticket_id=ticket_id,
            event_type="creado",
            actor_user=current_user,
            note="Solicitud interna de aplicacion de configuracion de respuestas.",
        )
        cfg["pending_apply"] = True
        cfg["last_updated_at"] = now
        return ticket_id

    ticket_id = with_store(_mutate)
    return ResponseConfigSubmitResult(
        tenant_id=tenant_id,
        ticket_id=ticket_id,
        message="Configuracion enviada a soporte. Nuestro equipo aplicara esta configuracion en tus agentes activos.",
    )
