import json
import re
from dataclasses import dataclass
from datetime import datetime
from html import unescape
from html.parser import HTMLParser
from urllib.error import HTTPError, URLError
from urllib.parse import urlparse
from urllib.request import Request, urlopen

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.models import (
    BrandDiagnostic,
    Category,
    Product,
    ServiceOffering,
    StorefrontConfig,
    Tenant,
    TenantBranding,
)


@dataclass
class DiagnosticContext:
    tenant_id: int
    brand_name: str
    slug: str
    business_type: str
    language: str
    hero_title: str
    hero_subtitle: str
    cta_primary: str
    cta_secondary: str
    sections: list[dict[str, str]]
    contact_whatsapp: str
    contact_email: str
    product_count: int
    service_count: int
    category_count: int
    landing_enabled: bool
    has_existing_landing: bool
    missing_data: list[str]
    source: dict[str, object]
    analysis_type: str = "internal_brand"
    source_url: str | None = None


class _ExternalHtmlParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.in_title = False
        self.current_heading: str | None = None
        self.current_anchor = False
        self.current_button = False
        self.title_parts: list[str] = []
        self.meta_description = ""
        self.headings: list[str] = []
        self.paragraphs: list[str] = []
        self.ctas: list[str] = []
        self.forms_count = 0

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        attrs_map = {k.lower(): (v or "") for k, v in attrs}
        tag_lower = tag.lower()
        if tag_lower == "title":
            self.in_title = True
        if tag_lower in {"h1", "h2", "h3"}:
            self.current_heading = tag_lower
        if tag_lower == "a":
            self.current_anchor = True
            label = attrs_map.get("aria-label", "").strip()
            if label:
                self.ctas.append(label)
        if tag_lower == "button":
            self.current_button = True
        if tag_lower == "input":
            input_type = attrs_map.get("type", "").lower()
            if input_type in {"submit", "button"}:
                value = attrs_map.get("value", "").strip()
                if value:
                    self.ctas.append(value)
        if tag_lower == "meta":
            name = attrs_map.get("name", "").lower()
            if name == "description":
                self.meta_description = attrs_map.get("content", "").strip()
        if tag_lower == "form":
            self.forms_count += 1

    def handle_endtag(self, tag: str) -> None:
        tag_lower = tag.lower()
        if tag_lower == "title":
            self.in_title = False
        if tag_lower in {"h1", "h2", "h3"}:
            self.current_heading = None
        if tag_lower == "a":
            self.current_anchor = False
        if tag_lower == "button":
            self.current_button = False

    def handle_data(self, data: str) -> None:
        value = unescape(data or "").strip()
        if not value:
            return
        if self.in_title:
            self.title_parts.append(value)
        if self.current_heading:
            self.headings.append(value)
        if self.current_anchor or self.current_button:
            self.ctas.append(value)
        if len(value.split()) >= 4:
            self.paragraphs.append(value)


def _safe_json_load(raw: str | None) -> dict:
    if not raw:
        return {}
    try:
        parsed = json.loads(raw)
        return parsed if isinstance(parsed, dict) else {}
    except Exception:
        return {}


def _normalize_text(value: str | None) -> str:
    return (value or "").strip()


def _validate_external_url(url: str) -> str:
    parsed = urlparse((url or "").strip())
    if parsed.scheme not in {"http", "https"} or not parsed.netloc:
        raise ValueError("La URL debe iniciar con http:// o https:// y ser valida.")
    return parsed.geturl()


def _extract_external_page_content(url: str, timeout_seconds: int = 12) -> dict[str, object]:
    normalized_url = _validate_external_url(url)
    req = Request(
        normalized_url,
        headers={
            "User-Agent": "COMERCIA-Diagnostics/1.0 (+https://reinpia.com)",
            "Accept": "text/html,application/xhtml+xml",
        },
    )
    try:
        with urlopen(req, timeout=timeout_seconds) as response:  # noqa: S310
            content_type = response.headers.get("Content-Type", "")
            if "text/html" not in content_type and "application/xhtml+xml" not in content_type:
                raise ValueError("La URL no devolvio contenido HTML legible para diagnostico.")
            raw = response.read()
    except HTTPError as exc:
        raise ValueError(f"La URL devolvio error HTTP {exc.code}.") from exc
    except URLError as exc:
        raise ValueError("No fue posible conectar con la URL externa.") from exc
    except TimeoutError as exc:
        raise ValueError("La URL tardo demasiado en responder (timeout).") from exc
    except Exception as exc:  # noqa: BLE001
        raise ValueError("No se pudo leer la URL externa con exito.") from exc

    html = raw.decode("utf-8", errors="ignore")
    if not html.strip():
        raise ValueError("La URL respondio, pero el HTML esta vacio.")

    parser = _ExternalHtmlParser()
    parser.feed(html)
    parser.close()

    title = " ".join(parser.title_parts).strip()
    headings = [h.strip() for h in parser.headings if h.strip()]
    text_chunks = [chunk.strip() for chunk in parser.paragraphs if chunk.strip()]
    ctas = [cta.strip() for cta in parser.ctas if cta.strip()]

    combined_text = " ".join([title, parser.meta_description, *headings, *text_chunks, *ctas]).strip()
    contact_email_match = re.search(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}", combined_text)
    contact_whatsapp_match = re.search(r"(whatsapp|wa\.me|\+?\d[\d\s\-]{7,}\d)", combined_text, flags=re.IGNORECASE)

    return {
        "url": normalized_url,
        "title": title,
        "meta_description": parser.meta_description.strip(),
        "headings": headings[:20],
        "text_chunks": text_chunks[:60],
        "ctas": ctas[:25],
        "forms_count": parser.forms_count,
        "contact_email": contact_email_match.group(0) if contact_email_match else "",
        "contact_whatsapp": contact_whatsapp_match.group(0) if contact_whatsapp_match else "",
    }


def collect_diagnostic_context(db: Session, tenant_id: int) -> DiagnosticContext:
    tenant = db.get(Tenant, tenant_id)
    if not tenant:
        raise ValueError("Marca no encontrada")

    branding = db.scalar(select(TenantBranding).where(TenantBranding.tenant_id == tenant_id))
    storefront = db.scalar(select(StorefrontConfig).where(StorefrontConfig.tenant_id == tenant_id))

    payload = _safe_json_load(storefront.config_json if storefront else None)
    landing_draft = payload.get("landing_draft", {}) if isinstance(payload.get("landing_draft"), dict) else {}
    identity_data = payload.get("identity_data", {}) if isinstance(payload.get("identity_data"), dict) else {}
    admin_settings = payload.get("admin_settings", {}) if isinstance(payload.get("admin_settings"), dict) else {}
    language_config = admin_settings.get("language", {}) if isinstance(admin_settings.get("language"), dict) else {}

    sections_raw = landing_draft.get("sections", [])
    sections: list[dict[str, str]] = []
    if isinstance(sections_raw, list):
        for item in sections_raw:
            if not isinstance(item, dict):
                continue
            title = _normalize_text(str(item.get("title", "")))
            body = _normalize_text(str(item.get("body", "")))
            if title or body:
                sections.append({"title": title, "body": body})

    hero_title = _normalize_text(landing_draft.get("hero_title") if isinstance(landing_draft, dict) else None)
    hero_subtitle = _normalize_text(landing_draft.get("hero_subtitle") if isinstance(landing_draft, dict) else None)
    cta_primary = _normalize_text(landing_draft.get("cta_primary") if isinstance(landing_draft, dict) else None)
    cta_secondary = _normalize_text(landing_draft.get("cta_secondary") if isinstance(landing_draft, dict) else None)
    contact_cta = _normalize_text(landing_draft.get("contact_cta") if isinstance(landing_draft, dict) else None)

    if not hero_title:
        hero_title = _normalize_text(branding.hero_title if branding else None)
    if not hero_subtitle:
        hero_subtitle = _normalize_text(branding.hero_subtitle if branding else None)
    if not cta_primary:
        cta_primary = "Solicitar diagnostico"
    if not cta_secondary:
        cta_secondary = "Conocer mas"

    missing_data: list[str] = []
    if not hero_title:
        missing_data.append("Falta titular principal de la landing.")
    if not hero_subtitle:
        missing_data.append("Falta subtitulo comercial de la landing.")
    if not sections:
        missing_data.append("Faltan secciones estructuradas de contenido en la landing.")
    if not (branding and (branding.contact_email or branding.contact_whatsapp)) and not contact_cta:
        missing_data.append("No se detecto bloque claro de contacto o diagnostico.")

    categories = db.scalars(select(Category).where(Category.tenant_id == tenant_id)).all()
    products = db.scalars(select(Product).where(Product.tenant_id == tenant_id, Product.is_active.is_(True))).all()
    services = db.scalars(
        select(ServiceOffering).where(ServiceOffering.tenant_id == tenant_id, ServiceOffering.is_active.is_(True))
    ).all()

    category_count = len(categories)
    product_count = len(products)
    service_count = len(services)

    context_source = {
        "analysis_type": "internal_brand",
        "source_url": None,
        "tenant": {"id": tenant.id, "name": tenant.name, "slug": tenant.slug, "business_type": tenant.business_type},
        "branding": {
            "primary_color": branding.primary_color if branding else None,
            "secondary_color": branding.secondary_color if branding else None,
            "hero_title": branding.hero_title if branding else None,
            "hero_subtitle": branding.hero_subtitle if branding else None,
            "contact_email": branding.contact_email if branding else None,
            "contact_whatsapp": branding.contact_whatsapp if branding else None,
        },
        "landing_draft": landing_draft,
        "language": language_config,
        "catalog": {"categories": category_count, "products": product_count, "services": service_count},
    }

    return DiagnosticContext(
        tenant_id=tenant.id,
        brand_name=tenant.name,
        slug=tenant.slug,
        business_type=tenant.business_type,
        language=str(language_config.get("primary", "es")),
        hero_title=hero_title,
        hero_subtitle=hero_subtitle,
        cta_primary=cta_primary,
        cta_secondary=cta_secondary,
        sections=sections,
        contact_whatsapp=_normalize_text(branding.contact_whatsapp if branding else None),
        contact_email=_normalize_text(branding.contact_email if branding else None),
        product_count=product_count,
        service_count=service_count,
        category_count=category_count,
        landing_enabled=bool(storefront.landing_enabled) if storefront else True,
        has_existing_landing=bool(identity_data.get("has_existing_landing", False)),
        missing_data=missing_data,
        source=context_source,
        analysis_type="internal_brand",
        source_url=None,
    )


def collect_external_url_context(db: Session, tenant_id: int, url: str) -> DiagnosticContext:
    tenant = db.get(Tenant, tenant_id)
    if not tenant:
        raise ValueError("Marca no encontrada")

    extracted = _extract_external_page_content(url)
    headings: list[str] = extracted.get("headings", []) if isinstance(extracted.get("headings"), list) else []
    text_chunks: list[str] = extracted.get("text_chunks", []) if isinstance(extracted.get("text_chunks"), list) else []
    ctas: list[str] = extracted.get("ctas", []) if isinstance(extracted.get("ctas"), list) else []

    hero_title = _normalize_text(str(extracted.get("title", "")))
    hero_subtitle = _normalize_text(str(extracted.get("meta_description", "")))
    cta_primary = _normalize_text(ctas[0] if ctas else "")
    cta_secondary = _normalize_text(ctas[1] if len(ctas) > 1 else "")

    sections: list[dict[str, str]] = []
    for idx, heading in enumerate(headings[:6]):
        body = text_chunks[idx] if idx < len(text_chunks) else ""
        sections.append({"title": _normalize_text(heading), "body": _normalize_text(body)})

    if not sections and text_chunks:
        sections.append({"title": "Contenido principal", "body": _normalize_text(" ".join(text_chunks[:3]))})

    missing_data: list[str] = []
    if not hero_title:
        missing_data.append("No se detecto title o titular principal en la URL externa.")
    if not hero_subtitle:
        missing_data.append("No se detecto meta description en la URL externa.")
    if not cta_primary:
        missing_data.append("No se detectaron CTA claros en la URL externa.")
    if not sections:
        missing_data.append("No se detectaron secciones semanticas suficientes en la URL externa.")
    if not extracted.get("contact_email") and not extracted.get("contact_whatsapp") and int(extracted.get("forms_count", 0)) <= 0:
        missing_data.append("No se detecto contacto directo o formulario visible.")

    categories = db.scalars(select(Category).where(Category.tenant_id == tenant_id)).all()
    products = db.scalars(select(Product).where(Product.tenant_id == tenant_id, Product.is_active.is_(True))).all()
    services = db.scalars(
        select(ServiceOffering).where(ServiceOffering.tenant_id == tenant_id, ServiceOffering.is_active.is_(True))
    ).all()

    context_source = {
        "analysis_type": "external_url",
        "source_url": extracted.get("url"),
        "tenant": {"id": tenant.id, "name": tenant.name, "slug": tenant.slug, "business_type": tenant.business_type},
        "extracted": extracted,
        "catalog": {"categories": len(categories), "products": len(products), "services": len(services)},
    }

    return DiagnosticContext(
        tenant_id=tenant.id,
        brand_name=tenant.name,
        slug=tenant.slug,
        business_type=tenant.business_type,
        language="es",
        hero_title=hero_title,
        hero_subtitle=hero_subtitle,
        cta_primary=cta_primary,
        cta_secondary=cta_secondary,
        sections=sections,
        contact_whatsapp=_normalize_text(str(extracted.get("contact_whatsapp", ""))),
        contact_email=_normalize_text(str(extracted.get("contact_email", ""))),
        product_count=len(products),
        service_count=len(services),
        category_count=len(categories),
        landing_enabled=True,
        has_existing_landing=False,
        missing_data=missing_data,
        source=context_source,
        analysis_type="external_url",
        source_url=str(extracted.get("url") or ""),
    )


def _score_to_int(value: float) -> int:
    return max(0, min(100, int(round(value))))


def _criterion(status: str, criterion: str, detail: str) -> dict[str, str]:
    return {"status": status, "criterion": criterion, "detail": detail}


def run_diagnostic(context: DiagnosticContext) -> dict:
    full_text = " ".join(
        [
            context.hero_title,
            context.hero_subtitle,
            context.cta_primary,
            context.cta_secondary,
            " ".join(section.get("title", "") for section in context.sections),
            " ".join(section.get("body", "") for section in context.sections),
        ]
    ).strip()
    text_lower = full_text.lower()

    seo_findings: list[dict[str, str]] = []
    seo_score = 0.0

    if len(context.hero_title) >= 18:
        seo_score += 16
        seo_findings.append(_criterion("ok", "Titular principal", "La landing tiene titular principal con enfoque comercial."))
    else:
        seo_findings.append(_criterion("warning", "Titular principal", "El titular principal es corto o no esta definido claramente."))

    if len(context.hero_subtitle) >= 24:
        seo_score += 14
        seo_findings.append(_criterion("ok", "Subtitulo", "Existe subtitulo con contexto de propuesta de valor."))
    else:
        seo_findings.append(_criterion("warning", "Subtitulo", "Falta subtitulo descriptivo o es muy breve."))

    if context.cta_primary:
        seo_score += 12
        seo_findings.append(_criterion("ok", "CTA principal", "Se detecta llamado principal a la accion."))
    else:
        seo_findings.append(_criterion("warning", "CTA principal", "No se detecta CTA principal claro."))

    if len(context.sections) >= 3:
        seo_score += 14
        seo_findings.append(_criterion("ok", "Estructura de secciones", "La landing contiene bloques suficientes para posicionamiento semantico."))
    else:
        seo_findings.append(_criterion("warning", "Estructura de secciones", "Conviene ampliar secciones de valor, oferta y confianza."))

    if context.contact_email or context.contact_whatsapp:
        seo_score += 10
        seo_findings.append(_criterion("ok", "Contacto", "Se detecta canal de contacto visible para conversion."))
    else:
        seo_findings.append(_criterion("warning", "Contacto", "Falta contacto visible o formulario claro en la propuesta."))

    if context.category_count > 0 or context.product_count > 0 or context.service_count > 0:
        seo_score += 12
        seo_findings.append(_criterion("ok", "Oferta indexable", "Existe oferta comercial (productos/servicios/categorias) asociada a la marca."))
    else:
        seo_findings.append(_criterion("warning", "Oferta indexable", "No se detecta oferta comercial estructurada para descubrimiento."))

    if any(word in text_lower for word in ["beneficio", "valor", "ventaja", "resultado", "solucion"]):
        seo_score += 12
        seo_findings.append(_criterion("ok", "Propuesta de valor", "El mensaje incluye lenguaje de valor comercial."))
    else:
        seo_findings.append(_criterion("warning", "Propuesta de valor", "La propuesta de valor puede ser mas explicita."))

    if context.language.lower().startswith("es"):
        seo_score += 10
        seo_findings.append(_criterion("ok", "Idioma", "La configuracion de idioma principal esta definida en espanol."))
    else:
        seo_findings.append(_criterion("info", "Idioma", "Revisa que el idioma principal coincida con el mercado objetivo."))

    aeo_findings: list[dict[str, str]] = []
    aeo_score = 0.0

    if any(token in text_lower for token in ["somos", "ofrecemos", "plataforma", "servicios", "ecommerce", "formacion"]):
        aeo_score += 18
        aeo_findings.append(_criterion("ok", "Que hace la marca", "El contenido responde que hace la marca."))
    else:
        aeo_findings.append(_criterion("warning", "Que hace la marca", "No queda totalmente claro que hace la marca en una sola lectura."))

    if any(token in text_lower for token in ["para", "dirigido", "empresas", "distribuidores", "clientes", "profesionales"]):
        aeo_score += 14
        aeo_findings.append(_criterion("ok", "Audiencia objetivo", "El texto indica para quien esta disenada la oferta."))
    else:
        aeo_findings.append(_criterion("warning", "Audiencia objetivo", "Falta especificar mejor la audiencia principal."))

    if any(token in text_lower for token in ["beneficio", "ahorro", "resultado", "mejora", "rentabilidad"]):
        aeo_score += 14
        aeo_findings.append(_criterion("ok", "Beneficios concretos", "La narrativa incluye beneficios reutilizables por asistentes de IA."))
    else:
        aeo_findings.append(_criterion("warning", "Beneficios concretos", "Conviene explicitar beneficios medibles en lenguaje directo."))

    qna_signals = sum(1 for section in context.sections if "?" in section.get("title", "") or "como" in section.get("title", "").lower())
    if qna_signals > 0:
        aeo_score += 12
        aeo_findings.append(_criterion("ok", "Bloques tipo pregunta/respuesta", "Se detectan bloques con formato util para motores de respuesta."))
    else:
        aeo_findings.append(_criterion("warning", "Bloques tipo pregunta/respuesta", "Agrega FAQ o bloques de respuesta directa para fortalecer AEO."))

    avg_sentence_len = len(full_text.split()) / max(1, len([s for s in full_text.replace("?", ".").split(".") if s.strip()]))
    if avg_sentence_len <= 24:
        aeo_score += 12
        aeo_findings.append(_criterion("ok", "Claridad semantica", "El contenido tiene una longitud de oracion razonable para comprension por IA."))
    else:
        aeo_findings.append(_criterion("warning", "Claridad semantica", "Hay oraciones extensas; conviene simplificar para mejorar interpretacion automatica."))

    if context.cta_primary and context.cta_secondary:
        aeo_score += 14
        aeo_findings.append(_criterion("ok", "Intencion comercial", "La intencion comercial esta explicita con llamados a accion claros."))
    else:
        aeo_findings.append(_criterion("warning", "Intencion comercial", "Falta reforzar llamados a la accion y siguiente paso."))

    if context.business_type in {"products", "services", "mixed"}:
        aeo_score += 16
        aeo_findings.append(_criterion("ok", "Contexto de negocio", "El contexto de industria/tipo de negocio esta identificado."))
    else:
        aeo_findings.append(_criterion("warning", "Contexto de negocio", "Define con mas precision el tipo de negocio para respuestas mas certeras."))

    branding_findings: list[dict[str, str]] = []
    branding_score = 0.0

    if context.hero_title and context.hero_subtitle:
        branding_score += 18
        branding_findings.append(_criterion("ok", "Promesa de marca", "Existe promesa principal y soporte narrativo en la cabecera."))
    else:
        branding_findings.append(_criterion("warning", "Promesa de marca", "La promesa central de marca necesita mayor definicion."))

    if any(token in text_lower for token in ["diferente", "especializado", "premium", "inteligente", "profesional"]):
        branding_score += 14
        branding_findings.append(_criterion("ok", "Diferenciacion", "El mensaje presenta elementos de diferenciacion comercial."))
    else:
        branding_findings.append(_criterion("warning", "Diferenciacion", "Falta enfatizar que hace unica a la marca frente a competidores."))

    if context.business_type == "services" and (context.service_count > 0 or "servicio" in text_lower):
        branding_score += 14
        branding_findings.append(_criterion("ok", "Alineacion con industria", "La narrativa esta alineada con un negocio de servicios."))
    elif context.business_type == "products" and (context.product_count > 0 or "producto" in text_lower):
        branding_score += 14
        branding_findings.append(_criterion("ok", "Alineacion con industria", "La narrativa esta alineada con un negocio de productos."))
    elif context.business_type == "mixed" and (context.product_count > 0 or context.service_count > 0):
        branding_score += 14
        branding_findings.append(_criterion("ok", "Alineacion con industria", "La narrativa soporta oferta mixta de productos y servicios."))
    else:
        branding_findings.append(_criterion("warning", "Alineacion con industria", "El mensaje no refleja totalmente el tipo de negocio actual."))

    if context.cta_primary:
        branding_score += 14
        branding_findings.append(_criterion("ok", "Consistencia de CTA", "El llamado principal es coherente con la propuesta de marca."))
    else:
        branding_findings.append(_criterion("warning", "Consistencia de CTA", "Falta CTA principal consistente con la promesa de marca."))

    if len(context.brand_name) >= 4 and any(char.isalpha() for char in context.brand_name):
        branding_score += 10
        branding_findings.append(_criterion("ok", "Identidad nominal", "El nombre de marca esta definido y usable en comunicacion comercial."))
    else:
        branding_findings.append(_criterion("warning", "Identidad nominal", "El nombre de marca requiere mayor claridad o consistencia."))

    if context.category_count + context.product_count + context.service_count >= 3:
        branding_score += 12
        branding_findings.append(_criterion("ok", "Coherencia oferta-mensaje", "La oferta visible respalda la promesa comercial de marca."))
    else:
        branding_findings.append(_criterion("warning", "Coherencia oferta-mensaje", "Amplia la oferta visible para reforzar credibilidad comercial."))

    if context.contact_email or context.contact_whatsapp:
        branding_score += 10
        branding_findings.append(_criterion("ok", "Confianza comercial", "La marca ofrece un canal de contacto directo para cierre."))
    else:
        branding_findings.append(_criterion("warning", "Confianza comercial", "Agrega contacto directo para reforzar confianza y cierre."))

    if len(context.sections) >= 3:
        branding_score += 8
        branding_findings.append(_criterion("ok", "Narrativa estructurada", "La narrativa de marca tiene estructura comercial suficiente."))
    else:
        branding_findings.append(_criterion("warning", "Narrativa estructurada", "Falta estructura en bloques para explicar oferta y diferenciales."))

    seo = _score_to_int(seo_score - (len(context.missing_data) * 2))
    aeo = _score_to_int(aeo_score - (len(context.missing_data) * 2))
    branding = _score_to_int(branding_score - (len(context.missing_data) * 2))
    global_score = _score_to_int((seo + aeo + branding) / 3)

    high_priority: list[str] = []
    medium_priority: list[str] = []
    low_priority: list[str] = []

    if seo < 70:
        high_priority.append("Refinar titular, subtitulo y bloques de valor para mejorar descubrimiento organico.")
    if aeo < 70:
        high_priority.append("Agregar bloque FAQ/respuestas directas para mejorar visibilidad en asistentes de IA.")
    if branding < 75:
        medium_priority.append("Fortalecer diferenciacion de marca y beneficios concretos por audiencia.")
    if not (context.contact_email or context.contact_whatsapp):
        high_priority.append("Habilitar un canal de contacto visible con CTA comercial en la landing.")
    if len(context.sections) < 3:
        medium_priority.append("Incluir secciones minimas: propuesta de valor, beneficios, oferta principal y contacto.")
    if context.has_existing_landing:
        low_priority.append("Mantener alineado el copy del preview interno con la landing externa declarada.")
    if context.product_count + context.service_count == 0:
        high_priority.append("Publicar oferta base (productos/servicios) para reforzar posicionamiento y conversion.")

    if not high_priority:
        high_priority.append("Mantener ciclo de mejora continua con revision mensual de SEO/AEO/branding.")
    if not medium_priority:
        medium_priority.append("Ajustar estilo de titulares para mayor claridad comercial por industria.")
    if not low_priority:
        low_priority.append("Documentar casos de exito y testimonios para aumentar prueba social.")

    next_actions = [
        "Priorizar 2 mejoras de alta prioridad en la proxima iteracion de landing.",
        "Validar consistencia entre propuesta de valor, audiencia y CTA principal.",
        "Reanalizar despues de aplicar mejoras para medir avance de score.",
    ]

    subject = "La landing externa evaluada" if context.analysis_type == "external_url" else "La marca"
    summary = (
        f"{subject} obtuvo un score global de {global_score}/100. "
        f"SEO {seo}, AEO {aeo} e identidad {branding}. "
        "El diagnostico sugiere reforzar claridad comercial, bloques de respuesta para IA y coherencia de propuesta."
    )

    return {
        "analysis_type": context.analysis_type,
        "source_url": context.source_url,
        "tenant_id": context.tenant_id,
        "brand_name": context.brand_name,
        "analyzed_at": datetime.utcnow(),
        "status": "completed",
        "scores": {"seo": seo, "aeo": aeo, "branding": branding, "global": global_score},
        "findings": {"seo": seo_findings, "aeo": aeo_findings, "branding": branding_findings},
        "recommendations": {"high_priority": high_priority, "medium_priority": medium_priority, "low_priority": low_priority},
        "summary": summary,
        "next_actions": next_actions,
        "missing_data": context.missing_data,
        "raw_context": context.source,
    }


def persist_diagnostic_result(db: Session, result: dict) -> BrandDiagnostic:
    row = BrandDiagnostic(
        tenant_id=int(result["tenant_id"]),
        status=str(result.get("status", "completed")),
        analyzed_at=result.get("analyzed_at") or datetime.utcnow(),
        seo_score=int(result["scores"]["seo"]),
        aeo_score=int(result["scores"]["aeo"]),
        branding_score=int(result["scores"]["branding"]),
        global_score=int(result["scores"]["global"]),
        findings_json=json.dumps(result.get("findings", {}), ensure_ascii=False),
        recommendations_json=json.dumps(result.get("recommendations", {}), ensure_ascii=False),
        summary=str(result.get("summary", "")),
        next_actions_json=json.dumps(result.get("next_actions", []), ensure_ascii=False),
        context_json=json.dumps(result.get("raw_context", {}), ensure_ascii=False),
        missing_data_json=json.dumps(result.get("missing_data", []), ensure_ascii=False),
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


def parse_diagnostic_row(row: BrandDiagnostic) -> dict:
    findings = _safe_json_load(row.findings_json)
    recommendations = _safe_json_load(row.recommendations_json)
    context_payload = _safe_json_load(row.context_json)
    try:
        next_actions = json.loads(row.next_actions_json or "[]")
    except Exception:
        next_actions = []
    try:
        missing_data = json.loads(row.missing_data_json or "[]")
    except Exception:
        missing_data = []
    try:
        improvement_plan = json.loads(row.improvement_plan_json or "{}") if row.improvement_plan_json else None
    except Exception:
        improvement_plan = None

    tenant_data = context_payload.get("tenant", {}) if isinstance(context_payload, dict) else {}
    analysis_type = str(context_payload.get("analysis_type") or "internal_brand") if isinstance(context_payload, dict) else "internal_brand"
    source_url = context_payload.get("source_url") if isinstance(context_payload, dict) else None
    return {
        "id": row.id,
        "tenant_id": row.tenant_id,
        "brand_name": str(tenant_data.get("name") or f"Tenant {row.tenant_id}"),
        "analysis_type": analysis_type,
        "source_url": str(source_url) if source_url else None,
        "analyzed_at": row.analyzed_at,
        "status": row.status,
        "scores": {"seo": row.seo_score, "aeo": row.aeo_score, "branding": row.branding_score, "global": row.global_score},
        "findings": findings if isinstance(findings, dict) else {},
        "recommendations": recommendations if isinstance(recommendations, dict) else {},
        "summary": row.summary,
        "next_actions": next_actions if isinstance(next_actions, list) else [],
        "missing_data": missing_data if isinstance(missing_data, list) else [],
        "raw_context": context_payload if isinstance(context_payload, dict) else {},
        "improvement_plan": improvement_plan,
        "created_at": row.created_at,
        "updated_at": row.updated_at,
    }
