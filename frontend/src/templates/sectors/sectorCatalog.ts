import { TemplateChannel, TemplateSector } from "../core/types";

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
};

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
  },
};

