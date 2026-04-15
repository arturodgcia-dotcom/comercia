from datetime import datetime

from pydantic import BaseModel, Field


SUPPORT_STATES = ["nuevo", "en revision", "pendiente de cliente", "resuelto", "cerrado"]


class SupportTicketAttachmentRead(BaseModel):
    id: int
    file_name: str
    stored_path: str
    uploaded_at: datetime


class SupportTicketMessageRead(BaseModel):
    id: int
    role: str
    message: str
    created_at: datetime


class SupportTicketCreate(BaseModel):
    tenant_id: int
    asunto: str
    descripcion: str
    categoria: str
    prioridad: str = "media"
    marca_relacionada: str | None = None
    correo_contacto: str
    telefono_whatsapp: str | None = None


class SupportTicketStatusUpdate(BaseModel):
    estado: str
    respuesta: str | None = None
    responsable: str | None = None


class SupportTicketRead(BaseModel):
    id: int
    tenant_id: int
    asunto: str
    descripcion: str
    categoria: str
    prioridad: str
    marca_relacionada: str | None = None
    correo_contacto: str
    telefono_whatsapp: str | None = None
    estado: str
    respuesta: str | None = None
    responsable: str | None = None
    created_at: datetime
    updated_at: datetime
    attachments: list[SupportTicketAttachmentRead] = Field(default_factory=list)
    mensajes: list[SupportTicketMessageRead] = Field(default_factory=list)


class SupportChatRequest(BaseModel):
    message: str


class SupportChatResponse(BaseModel):
    ticket_id: int
    chat_enabled: bool
    response: str
    escalate_to_human: bool
    channel_hint: str
    updated_ticket: SupportTicketRead


class SupportOverviewRead(BaseModel):
    tenant_id: int
    plan_tier: str
    support_channel: str
    official_email: str
    chat_enabled: bool
    escalation_enabled: bool
    human_escalation_hint: str


class ResponseConfigPayload(BaseModel):
    tenant_id: int
    tono_atencion: str
    saludo_inicial: str
    speech_comercial_base: str
    preguntas_frecuentes: str
    objeciones_frecuentes: str
    restricciones_respuesta: str
    horario_atencion: str
    mensajes_cierre: str
    estilo_deseado: str
    notas_adicionales: str | None = None
    documento_base: str | None = None


class ResponseConfigRead(ResponseConfigPayload):
    id: int
    last_updated_at: datetime
    pending_apply: bool
    active_agents_count: int
    last_applied_at: datetime | None = None


class ResponseConfigSubmitResult(BaseModel):
    tenant_id: int
    ticket_id: int
    message: str
