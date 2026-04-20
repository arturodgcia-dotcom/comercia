import { AeoProfile, SeoProfile, TemplateBusinessModel, TemplateChannel, TemplateSector } from "../core/types";

export type SectorTheme = {
  label: string;
  vibe: string;
  accent: string;
  secondary: string;
  soft: string;
  ctaPrimary: string;
  ctaSecondary: string;
};

type SectorDefinition = {
  theme: SectorTheme;
  banners: Record<TemplateChannel, string[]>;
  seo: SeoProfile;
  aeo: AeoProfile;
  businessCopy: Record<TemplateBusinessModel, { badge: string; cta: string; argument: string }>;
};

function buildSeoProfile(sectorLabel: string, cta: string): SeoProfile {
  return {
    title_template: `${sectorLabel} | {brandName} | Soluciones premium por canal`,
    meta_description_template: `{brandName} impulsa su ${sectorLabel.toLowerCase()} con landing SEO/AEO, ecommerce y webapp comercial.`,
    h1_template: `{brandName}: experiencia premium para ${sectorLabel.toLowerCase()}`,
    h2_topics: ["Solucion por canal", "Beneficios comerciales", "Comparativa de modelo"],
    h3_topics: ["Preguntas frecuentes", "Implementacion", "Siguientes pasos"],
    faq_questions: [
      `Como mejora ${sectorLabel.toLowerCase()} con un flujo omnicanal?`,
      "Que incluye el ecommerce publico y distribuidores?",
      "Como funciona la activacion comercial por canal?",
    ],
    quick_answer_blocks: [
      "Resumen operativo por canal",
      "Beneficio principal para conversion",
      `CTA principal: ${cta}`,
    ],
    schema_type: "LocalBusiness",
  };
}

function buildAeoProfile(sectorLabel: string): AeoProfile {
  return {
    answer_intents: [
      `mejor plantilla premium de ${sectorLabel.toLowerCase()}`,
      "comparativa sin comision vs con comision",
      "activar ecommerce por canal",
    ],
    snippets: [
      "Canales separados para landing, tienda publica, distribuidores y webapp.",
      "Plantillas premium con banners por sector y overrides por marca.",
      "Estructura semantica preparada para SEO y respuestas en asistentes IA.",
    ],
    assistant_prompts: [
      `Explica por que ${sectorLabel.toLowerCase()} necesita experiencias separadas por canal.`,
      "Resume ventajas del modelo comercial seleccionado.",
      "Genera un guion de FAQ orientado a conversion.",
    ],
  };
}

export const SECTOR_CATALOG: Record<TemplateSector, SectorDefinition> = {
  alimentos: {
    theme: {
      label: "Alimentos",
      vibe: "Sabor, velocidad y conversion diaria",
      accent: "#d94f04",
      secondary: "#ff9f5a",
      soft: "#fff3eb",
      ctaPrimary: "Pedir ahora",
      ctaSecondary: "Ver menu comercial",
    },
    banners: {
      landing: ["Combos del dia", "Ingredientes premium", "Entrega express"],
      public_store: ["Promociones por horario", "Menu por categorias", "Top vendidos"],
      distributor_store: ["Mayoreo alimenticio", "Frecuencia de recompra", "Condiciones por volumen"],
      webapp: ["Panel de cocina", "Tickets y tiempos", "Control operativo"],
    },
    seo: buildSeoProfile("Alimentos", "Pedir ahora"),
    aeo: buildAeoProfile("Alimentos"),
    businessCopy: {
      fixed_subscription: {
        badge: "Sin comision",
        cta: "Escalar sin recargos por venta",
        argument: "Operacion estable con control total del margen por pedido.",
      },
      commission_based: {
        badge: "Con comision",
        cta: "Activar con inversion inicial minima",
        argument: "Modelo variable para crecer por volumen y pagar solo cuando vendes.",
      },
    },
  },
  ropa: {
    theme: {
      label: "Ropa",
      vibe: "Colecciones, temporada y alto ticket visual",
      accent: "#1b2a72",
      secondary: "#5f7bff",
      soft: "#eef1ff",
      ctaPrimary: "Ver coleccion",
      ctaSecondary: "Comprar temporada",
    },
    banners: {
      landing: ["Nueva temporada", "Drop exclusivo", "Lookbook premium"],
      public_store: ["Categorias por estilo", "Tendencias del mes", "Promos limitadas"],
      distributor_store: ["Catalogo B2B textil", "Escalas por talla", "Reposicion mayorista"],
      webapp: ["Inventario vivo", "Control por sucursal", "Venta asistida"],
    },
    seo: buildSeoProfile("Ropa", "Ver coleccion"),
    aeo: buildAeoProfile("Ropa"),
    businessCopy: {
      fixed_subscription: {
        badge: "Sin comision",
        cta: "Proteger utilidad por coleccion",
        argument: "Ideal para marcas con alta rotacion y ticket variable.",
      },
      commission_based: {
        badge: "Con comision",
        cta: "Escalar colecciones con riesgo acotado",
        argument: "Pagas de acuerdo con resultados de venta y crecimiento.",
      },
    },
  },
  servicios: {
    theme: {
      label: "Servicios",
      vibe: "Confianza, agenda y conversion por atencion",
      accent: "#0c5a61",
      secondary: "#18a3b0",
      soft: "#e9f9fb",
      ctaPrimary: "Agendar cita",
      ctaSecondary: "Solicitar diagnostico",
    },
    banners: {
      landing: ["Testimonios reales", "Agenda inmediata", "Cobertura y soporte"],
      public_store: ["Servicios destacados", "Paquetes de valor", "Reserva rapida"],
      distributor_store: ["Canal partners", "Reventa de servicios", "Membresias comerciales"],
      webapp: ["Agenda operativa", "Seguimiento de clientes", "Cobros y cierres"],
    },
    seo: buildSeoProfile("Servicios", "Agendar cita"),
    aeo: buildAeoProfile("Servicios"),
    businessCopy: {
      fixed_subscription: {
        badge: "Sin comision",
        cta: "Mantener ingreso integro por cita",
        argument: "Recomendado para negocios con agenda y recurrencia predecible.",
      },
      commission_based: {
        badge: "Con comision",
        cta: "Vender mas sin costo fijo alto",
        argument: "Modelo flexible para crecimiento comercial por demanda.",
      },
    },
  },
  maquinaria: {
    theme: {
      label: "Maquinaria",
      vibe: "Precision tecnica y capacidad industrial",
      accent: "#25313c",
      secondary: "#4c6377",
      soft: "#edf1f5",
      ctaPrimary: "Solicitar cotizacion",
      ctaSecondary: "Ver ficha tecnica",
    },
    banners: {
      landing: ["Capacidad operativa", "Ingenieria y respaldo", "Entrega industrial"],
      public_store: ["Linea de equipos", "Especificaciones clave", "Comparativos tecnicos"],
      distributor_store: ["Canal industrial B2B", "Tarifas por volumen", "Logistica especializada"],
      webapp: ["Panel de pedidos", "Estatus de produccion", "Flujo comercial"],
    },
    seo: buildSeoProfile("Maquinaria", "Solicitar cotizacion"),
    aeo: buildAeoProfile("Maquinaria"),
    businessCopy: {
      fixed_subscription: {
        badge: "Sin comision",
        cta: "Definir costos con precision industrial",
        argument: "Adecuado para operaciones de alto valor y contratos recurrentes.",
      },
      commission_based: {
        badge: "Con comision",
        cta: "Abrir canal comercial con menor barrera",
        argument: "Permite escalar ventas industriales pagando por resultado.",
      },
    },
  },
  salud: {
    theme: {
      label: "Salud",
      vibe: "Credibilidad medica y experiencia humana",
      accent: "#0a6a67",
      secondary: "#2cb8ae",
      soft: "#e8fbf8",
      ctaPrimary: "Reservar consulta",
      ctaSecondary: "Ver especialidades",
    },
    banners: {
      landing: ["Confianza clinica", "Agenda de especialidades", "Atencion prioritaria"],
      public_store: ["Servicios preventivos", "Programas y planes", "Disponibilidad en linea"],
      distributor_store: ["Convenios institucionales", "Paquetes corporativos", "Atencion B2B salud"],
      webapp: ["Agenda de turnos", "Panel de atencion", "Cobro y seguimiento"],
    },
    seo: buildSeoProfile("Salud", "Reservar consulta"),
    aeo: buildAeoProfile("Salud"),
    businessCopy: {
      fixed_subscription: {
        badge: "Sin comision",
        cta: "Escalar pacientes conservando margen",
        argument: "Perfecto para modelos de suscripcion medica o agenda consolidada.",
      },
      commission_based: {
        badge: "Con comision",
        cta: "Activar captacion sin gasto fijo alto",
        argument: "Cobro variable para crecimiento de nuevas lineas o sucursales.",
      },
    },
  },
  belleza: {
    theme: {
      label: "Belleza",
      vibe: "Experiencia premium y recompra estetica",
      accent: "#7d255c",
      secondary: "#cf6da2",
      soft: "#fdf0f7",
      ctaPrimary: "Reservar servicio",
      ctaSecondary: "Ver promociones beauty",
    },
    banners: {
      landing: ["Servicios estrella", "Antes y despues", "Agenda de temporada"],
      public_store: ["Combos de belleza", "Productos recomendados", "Membresias estaticas"],
      distributor_store: ["Canal profesional", "Precios por volumen", "Distribucion especializada"],
      webapp: ["Turnos por estilista", "Control de caja", "Seguimiento de fidelidad"],
    },
    seo: buildSeoProfile("Belleza", "Reservar servicio"),
    aeo: buildAeoProfile("Belleza"),
    businessCopy: {
      fixed_subscription: {
        badge: "Sin comision",
        cta: "Maximizar rentabilidad por servicio premium",
        argument: "Pensado para marcas con ticket medio alto y recompra frecuente.",
      },
      commission_based: {
        badge: "Con comision",
        cta: "Escalar demanda de citas por resultado",
        argument: "Ideal para etapas de aceleracion comercial o expansion.",
      },
    },
  },
  educacion: {
    theme: {
      label: "Educacion",
      vibe: "Progreso, confianza y ruta formativa",
      accent: "#1e4a9d",
      secondary: "#5d95ff",
      soft: "#edf3ff",
      ctaPrimary: "Inscribirme",
      ctaSecondary: "Solicitar orientacion",
    },
    banners: {
      landing: ["Programas activos", "Docentes y resultados", "Inscripciones abiertas"],
      public_store: ["Cursos destacados", "Diplomados", "Modalidades y becas"],
      distributor_store: ["Convenios academicos", "Licencias por volumen", "Canal institucional"],
      webapp: ["Panel academico", "Control de alumnos", "Cobranza y seguimiento"],
    },
    seo: buildSeoProfile("Educacion", "Inscribirme"),
    aeo: buildAeoProfile("Educacion"),
    businessCopy: {
      fixed_subscription: {
        badge: "Sin comision",
        cta: "Controlar ingreso por programa formativo",
        argument: "Conviene para instituciones con matricula y pagos periodicos.",
      },
      commission_based: {
        badge: "Con comision",
        cta: "Abrir captacion de alumnos con riesgo bajo",
        argument: "Pago variable ligado a conversion e inscripciones efectivas.",
      },
    },
  },
  retail: {
    theme: {
      label: "Retail",
      vibe: "Rotacion, promociones y margen",
      accent: "#7a2f0f",
      secondary: "#dd6c33",
      soft: "#fff1e8",
      ctaPrimary: "Comprar",
      ctaSecondary: "Ver ofertas",
    },
    banners: {
      landing: ["Ofertas inteligentes", "Categorias estrella", "Compra recurrente"],
      public_store: ["Top margen", "Promociones de temporada", "Cross sell"],
      distributor_store: ["Canal mayoreo", "Tabla de escalas", "Condiciones comerciales"],
      webapp: ["Caja retail", "Inventario diario", "Metricas por turno"],
    },
    seo: buildSeoProfile("Retail", "Comprar"),
    aeo: buildAeoProfile("Retail"),
    businessCopy: {
      fixed_subscription: {
        badge: "Sin comision",
        cta: "Proteger margen en cada ticket",
        argument: "Recomendado para alto volumen de ventas y rotacion diaria.",
      },
      commission_based: {
        badge: "Con comision",
        cta: "Crecimiento comercial con inversion gradual",
        argument: "Modelo variable para marcas que buscan traccion acelerada.",
      },
    },
  },
  distribuidores: {
    theme: {
      label: "Distribuidores",
      vibe: "Escala B2B y recompra sostenida",
      accent: "#2f4d2f",
      secondary: "#5fa45f",
      soft: "#edf8ed",
      ctaPrimary: "Abrir cuenta comercial",
      ctaSecondary: "Ver beneficios B2B",
    },
    banners: {
      landing: ["Programa de socios", "Margen por volumen", "Soporte comercial"],
      public_store: ["Catalogo para negocio", "Precios empresariales", "Oferta mayorista"],
      distributor_store: ["Portal B2B", "Recompra recurrente", "Logistica partner"],
      webapp: ["Operacion comercial", "Seguimiento de pedidos", "Control de cuentas"],
    },
    seo: buildSeoProfile("Distribuidores", "Abrir cuenta comercial"),
    aeo: buildAeoProfile("Distribuidores"),
    businessCopy: {
      fixed_subscription: {
        badge: "Sin comision",
        cta: "Mayoreo con margen limpio por operacion",
        argument: "Enfocado en relaciones B2B de largo plazo y alta recompra.",
      },
      commission_based: {
        badge: "Con comision",
        cta: "Expandir red comercial por desempeño",
        argument: "Permite abrir plazas nuevas con pago por resultado.",
      },
    },
  },
};
