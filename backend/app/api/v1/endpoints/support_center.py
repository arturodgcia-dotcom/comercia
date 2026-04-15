from datetime import datetime
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.models import Tenant, User
from app.schemas.support_center import (
    ResponseConfigPayload,
    ResponseConfigRead,
    ResponseConfigSubmitResult,
    SUPPORT_STATES,
    SupportChatRequest,
    SupportChatResponse,
    SupportOverviewRead,
    SupportTicketCreate,
    SupportTicketRead,
    SupportTicketStatusUpdate,
)
from app.services.support_center_store import UPLOADS_DIR, to_datetime, utc_now_iso, with_store

router = APIRouter()


def _assert_scope(current_user: User, tenant_id: int) -> None:
    if current_user.role in {"reinpia_admin", "super_admin"}:
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
        tenant_id=int(ticket["tenant_id"]),
        asunto=str(ticket["asunto"]),
        descripcion=str(ticket["descripcion"]),
        categoria=str(ticket["categoria"]),
        prioridad=str(ticket["prioridad"]),
        marca_relacionada=ticket.get("marca_relacionada"),
        correo_contacto=str(ticket["correo_contacto"]),
        telefono_whatsapp=ticket.get("telefono_whatsapp"),
        estado=str(ticket["estado"]),
        respuesta=ticket.get("respuesta"),
        responsable=ticket.get("responsable"),
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
    _assert_scope(current_user, tenant_id)
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
    _assert_scope(current_user, tenant_id)
    if payload.tenant_id != tenant_id:
        raise HTTPException(status_code=400, detail="tenant_id inconsistente")

    def _mutate(store: dict):
        ticket_id = int(store["next_ticket_id"])
        store["next_ticket_id"] = ticket_id + 1
        now = utc_now_iso()
        ticket = {
            "id": ticket_id,
            "tenant_id": tenant_id,
            "asunto": payload.asunto.strip(),
            "descripcion": payload.descripcion.strip(),
            "categoria": payload.categoria.strip(),
            "prioridad": payload.prioridad.strip().lower(),
            "marca_relacionada": payload.marca_relacionada,
            "correo_contacto": payload.correo_contacto.strip().lower(),
            "telefono_whatsapp": payload.telefono_whatsapp,
            "estado": "nuevo",
            "respuesta": None,
            "responsable": None,
            "created_at": now,
            "updated_at": now,
            "attachments": [],
            "mensajes": [],
        }
        store["tickets"].append(ticket)
        return ticket

    created = with_store(_mutate)
    return _serialize_ticket(created)


@router.get("/tenant/{tenant_id}/tickets", response_model=list[SupportTicketRead])
def list_tickets(tenant_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    tenant = db.get(Tenant, tenant_id)
    if not tenant:
        raise HTTPException(status_code=404, detail="marca no encontrada")
    _assert_scope(current_user, tenant_id)

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
    if payload.estado not in SUPPORT_STATES:
        raise HTTPException(status_code=400, detail="estado no valido")

    def _mutate(store: dict):
        for ticket in store.get("tickets", []):
            if int(ticket.get("id", 0)) != ticket_id:
                continue
            _assert_scope(current_user, int(ticket["tenant_id"]))
            ticket["estado"] = payload.estado
            if payload.respuesta is not None:
                ticket["respuesta"] = payload.respuesta
            if payload.responsable is not None:
                ticket["responsable"] = payload.responsable
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
            _assert_scope(current_user, int(ticket["tenant_id"]))
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
    _assert_scope(current_user, tenant_id)
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
                row["estado"] = "en revision"
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


@router.get("/tenant/{tenant_id}/responses-config", response_model=ResponseConfigRead | None)
def get_responses_config(tenant_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    tenant = db.get(Tenant, tenant_id)
    if not tenant:
        raise HTTPException(status_code=404, detail="marca no encontrada")
    _assert_scope(current_user, tenant_id)

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
    _assert_scope(current_user, tenant_id)
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
    _assert_scope(current_user, tenant_id)

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
                "tenant_id": tenant_id,
                "asunto": "Aplicacion de configuracion de respuestas y atencion",
                "descripcion": "Solicitud para que REINPIA aplique speech y estilo en agentes activos.",
                "categoria": "respuestas_y_atencion",
                "prioridad": "media",
                "marca_relacionada": tenant.name,
                "correo_contacto": current_user.email,
                "telefono_whatsapp": None,
                "estado": "nuevo",
                "respuesta": "Solicitud recibida. Nuestro equipo aplicara esta configuracion en tus agentes activos.",
                "responsable": "soporte_reinpia",
                "created_at": now,
                "updated_at": now,
                "attachments": [],
                "mensajes": [],
            }
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
