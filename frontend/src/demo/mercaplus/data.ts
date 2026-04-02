/* ═══════════════════════════════════════════════════════════
   MERCAPLUS DEMO — Datos ficticios completos
   ═══════════════════════════════════════════════════════════ */

export const MP_BRAND = {
  name: "MercaPlus",
  tagline: "Todo para tu negocio y bienestar profesional",
  phone: "01-800-MERCAPLUS",
  email: "hola@mercaplus.demo",
  whatsapp: "+52 55 8000 1234",
  address: "Av. Insurgentes Sur 1234, Col. Del Valle, CDMX",
  primaryColor: "#0d2354",
  accentColor: "#1e6ef7",
};

/* ─── Categorías ─────────────────────────────────────────── */
export interface MpCategory {
  id: string; name: string; slug: string; icon: string;
  description: string; productCount: number;
}
export const MP_CATEGORIES: MpCategory[] = [
  { id: "c1", name: "Belleza", slug: "belleza", icon: "💄", description: "Cosméticos, maquillaje y cuidado de la piel", productCount: 4 },
  { id: "c2", name: "Cuidado Personal", slug: "cuidado-personal", icon: "🧴", description: "Higiene, aromas y rutinas diarias", productCount: 4 },
  { id: "c3", name: "Herramientas Pro", slug: "herramientas-pro", icon: "🔧", description: "Equipos y herramientas para profesionales", productCount: 3 },
  { id: "c4", name: "Equipos", slug: "equipos", icon: "⚙️", description: "Maquinaria ligera y equipos especializados", productCount: 3 },
  { id: "c5", name: "Accesorios", slug: "accesorios", icon: "💼", description: "Complementos y accesorios profesionales", productCount: 3 },
  { id: "c6", name: "Insumos", slug: "insumos", icon: "📦", description: "Consumibles y materiales de trabajo", productCount: 3 },
  { id: "c7", name: "Bienestar", slug: "bienestar", icon: "🌿", description: "Salud, relajación y bienestar integral", productCount: 4 },
  { id: "c8", name: "Servicios", slug: "servicios", icon: "⭐", description: "Asesoría, capacitación y activaciones", productCount: 6 },
];

/* ─── Productos ──────────────────────────────────────────── */
export interface MpProduct {
  id: string; sku: string; name: string; shortDesc: string; longDesc: string;
  category: string; categoryName: string; icon: string; bgColor: string;
  pricePublic: number; priceRetail: number; priceWholesale: number;
  stock: number; unit: string;
  isPublic: boolean; isDist: boolean;
  isPromo: boolean; isNew: boolean; isBestseller: boolean;
  discountPct: number;
  rating: number; reviewCount: number;
  tags: string[];
  stripeIdDemo: string;
}

export const MP_PRODUCTS: MpProduct[] = [
  // ── Belleza ────────────────────────────────────────────────────
  {
    id: "p01", sku: "BEL-001", name: "Sérum Vitamina C Profesional 30ml",
    shortDesc: "Vitamina C estabilizada al 15% con hialurónico.",
    longDesc: "Formulación avanzada con vitamina C estabilizada al 15%, ácido hialurónico y niacinamida. Ilumina, unifica el tono y reduce manchas visibles desde la primera semana. Apto para todo tipo de piel.",
    category: "belleza", categoryName: "Belleza", icon: "✨", bgColor: "#fff8e7",
    pricePublic: 680, priceRetail: 510, priceWholesale: 380,
    stock: 145, unit: "pieza", isPublic: true, isDist: true,
    isPromo: true, isNew: false, isBestseller: true, discountPct: 20,
    rating: 4.8, reviewCount: 312, tags: ["sérum", "vitamina c", "iluminador"],
    stripeIdDemo: "price_demo_bel001",
  },
  {
    id: "p02", sku: "BEL-002", name: "Set Maquillaje HD Studio 18 pzas",
    shortDesc: "Set completo con paleta, brochas e iluminador.",
    longDesc: "Set profesional con 18 piezas: paleta de sombras 12 tonos, 4 brochas de maquillaje, iluminador en polvo y corrector de cobertura completa. Ideal para artistas y uso personal intensivo.",
    category: "belleza", categoryName: "Belleza", icon: "🎨", bgColor: "#fce8f3",
    pricePublic: 1250, priceRetail: 900, priceWholesale: 680,
    stock: 78, unit: "set", isPublic: true, isDist: true,
    isPromo: false, isNew: true, isBestseller: false, discountPct: 0,
    rating: 4.6, reviewCount: 87, tags: ["maquillaje", "set", "profesional"],
    stripeIdDemo: "price_demo_bel002",
  },
  {
    id: "p03", sku: "BEL-003", name: "Crema Antiedad Premium 50ml",
    shortDesc: "Retinol + colágeno marino de efecto tensor.",
    longDesc: "Crema de noche con retinol 0.3%, colágeno marino y péptidos bioactivos. Reduce líneas de expresión y mejora la firmeza en 4 semanas. Dermatológicamente probada.",
    category: "belleza", categoryName: "Belleza", icon: "🧪", bgColor: "#eef5ff",
    pricePublic: 890, priceRetail: 650, priceWholesale: 490,
    stock: 210, unit: "pieza", isPublic: true, isDist: true,
    isPromo: true, isNew: false, isBestseller: true, discountPct: 15,
    rating: 4.7, reviewCount: 198, tags: ["antiedad", "retinol", "noche"],
    stripeIdDemo: "price_demo_bel003",
  },
  {
    id: "p04", sku: "BEL-004", name: "Labiales Mate Larga Duración Pack x6",
    shortDesc: "6 tonos comerciales, resistente al agua 8 hrs.",
    longDesc: "Pack de 6 labiales mate formulados con vitamina E y aceite de argán. Duración de hasta 8 horas, resistentes al agua. Tonos seleccionados para máxima rotación comercial.",
    category: "belleza", categoryName: "Belleza", icon: "💋", bgColor: "#ffe8f0",
    pricePublic: 420, priceRetail: 290, priceWholesale: 210,
    stock: 320, unit: "pack", isPublic: true, isDist: true,
    isPromo: false, isNew: false, isBestseller: true, discountPct: 0,
    rating: 4.5, reviewCount: 441, tags: ["labial", "mate", "pack"],
    stripeIdDemo: "price_demo_bel004",
  },
  // ── Cuidado Personal ──────────────────────────────────────────
  {
    id: "p05", sku: "CUI-001", name: "Perfume Oud Royal Intense 100ml",
    shortDesc: "Fragancia oriental masculina de larga duración.",
    longDesc: "Perfume EDP con notas de oud, sándalo y vainilla. Concentración al 20% para duración de 10-12 horas. Presentación en frasco premium con atomizador de precisión.",
    category: "cuidado-personal", categoryName: "Cuidado Personal", icon: "🌹", bgColor: "#f5f0e8",
    pricePublic: 1480, priceRetail: 1080, priceWholesale: 820,
    stock: 92, unit: "frasco", isPublic: true, isDist: true,
    isPromo: true, isNew: false, isBestseller: true, discountPct: 18,
    rating: 4.9, reviewCount: 263, tags: ["perfume", "oud", "masculino"],
    stripeIdDemo: "price_demo_cui001",
  },
  {
    id: "p06", sku: "CUI-002", name: "Kit Barbería Profesional 7 piezas",
    shortDesc: "Navaja + tijeras + peine + bálsamo + aceite.",
    longDesc: "Kit completo de barbería: navaja de acero inoxidable, tijeras de precisión 6.5\", peine profesional, bálsamo para barba 60ml, aceite nutritivo 30ml y cepillo de cerdas naturales. Estuche de cuero PU incluido.",
    category: "cuidado-personal", categoryName: "Cuidado Personal", icon: "✂️", bgColor: "#e8f0e8",
    pricePublic: 980, priceRetail: 720, priceWholesale: 540,
    stock: 156, unit: "kit", isPublic: true, isDist: true,
    isPromo: false, isNew: true, isBestseller: false, discountPct: 0,
    rating: 4.7, reviewCount: 134, tags: ["barbería", "kit", "profesional"],
    stripeIdDemo: "price_demo_cui002",
  },
  {
    id: "p07", sku: "CUI-003", name: "Shampoo Reconstructor Queratina 500ml",
    shortDesc: "Queratina hidrolizada + biotina, uso profesional.",
    longDesc: "Fórmula sin sulfatos con queratina hidrolizada al 5% y biotina. Reconstruye la fibra capilar dañada por químicos o calor. Para uso profesional y en casa. Apto para cabellos teñidos y procesados.",
    category: "cuidado-personal", categoryName: "Cuidado Personal", icon: "🫧", bgColor: "#e8f4f8",
    pricePublic: 380, priceRetail: 265, priceWholesale: 195,
    stock: 480, unit: "frasco", isPublic: true, isDist: true,
    isPromo: true, isNew: false, isBestseller: true, discountPct: 12,
    rating: 4.6, reviewCount: 519, tags: ["shampoo", "queratina", "capilar"],
    stripeIdDemo: "price_demo_cui003",
  },
  {
    id: "p08", sku: "CUI-004", name: "Desodorante Clinical Extra Forte 72h",
    shortDesc: "Sin parabenos, protección intensa y piel suave.",
    longDesc: "Desodorante clínico de triple acción: anti-transpirante 72h, hidratante y dermatológicamente probado. Sin parabenos, sin sales de aluminio agresivas. Apto para piel sensible.",
    category: "cuidado-personal", categoryName: "Cuidado Personal", icon: "🌿", bgColor: "#f0ffe8",
    pricePublic: 210, priceRetail: 148, priceWholesale: 108,
    stock: 890, unit: "pieza", isPublic: true, isDist: true,
    isPromo: false, isNew: false, isBestseller: true, discountPct: 0,
    rating: 4.4, reviewCount: 672, tags: ["desodorante", "72h", "clínico"],
    stripeIdDemo: "price_demo_cui004",
  },
  // ── Herramientas Pro ──────────────────────────────────────────
  {
    id: "p09", sku: "HER-001", name: "Plancha Cerámica Profesional 450°F",
    shortDesc: "Placas flotantes de cerámica + ionizador.",
    longDesc: "Plancha profesional de temperatura ajustable hasta 450°F. Placas flotantes de cerámica recubierta con turmalina para brillo extremo y sin frizz. Sistema ionizador activo, calentamiento en 15 segundos.",
    category: "herramientas-pro", categoryName: "Herramientas Pro", icon: "💫", bgColor: "#ffe8e8",
    pricePublic: 1680, priceRetail: 1200, priceWholesale: 920,
    stock: 67, unit: "pieza", isPublic: true, isDist: true,
    isPromo: true, isNew: false, isBestseller: true, discountPct: 22,
    rating: 4.8, reviewCount: 287, tags: ["plancha", "cerámica", "profesional"],
    stripeIdDemo: "price_demo_her001",
  },
  {
    id: "p10", sku: "HER-002", name: "Secadora Iónica Pro 2200W Silenciosa",
    shortDesc: "Difusor, concentrador y 6 niveles de calor.",
    longDesc: "Secadora profesional 2200W con motor DC de ultra-silencioso. Tecnología iónica para reducir el frizz hasta 80%. 6 niveles de temperatura + 2 velocidades. Incluye difusor, concentrador y gancho.",
    category: "herramientas-pro", categoryName: "Herramientas Pro", icon: "💨", bgColor: "#e8eeff",
    pricePublic: 2200, priceRetail: 1580, priceWholesale: 1180,
    stock: 43, unit: "pieza", isPublic: true, isDist: true,
    isPromo: false, isNew: true, isBestseller: false, discountPct: 0,
    rating: 4.7, reviewCount: 156, tags: ["secadora", "iónica", "2200w"],
    stripeIdDemo: "price_demo_her002",
  },
  {
    id: "p11", sku: "HER-003", name: "Rizador Automático 3D Wave 38mm",
    shortDesc: "Barril cerámico rotativo, 3 temperaturas.",
    longDesc: "Rizador automático con barril de 38mm recubierto en cerámica. Sistema rotativo bidireccional para rizos perfectos sin esfuerzo. 3 configuraciones de temperatura (160°/190°/210°) y temporizador.",
    category: "herramientas-pro", categoryName: "Herramientas Pro", icon: "🌀", bgColor: "#f8e8ff",
    pricePublic: 1450, priceRetail: 1050, priceWholesale: 790,
    stock: 89, unit: "pieza", isPublic: true, isDist: true,
    isPromo: false, isNew: false, isBestseller: true, discountPct: 0,
    rating: 4.5, reviewCount: 203, tags: ["rizador", "automático", "cerámica"],
    stripeIdDemo: "price_demo_her003",
  },
  // ── Equipos ───────────────────────────────────────────────────
  {
    id: "p12", sku: "EQU-001", name: "Vaporizador Facial Ozono Profesional",
    shortDesc: "Ozono + vapor + aromaterapia, cabeza 360°.",
    longDesc: "Vaporizador facial de ozono de 650W. Genera vapor nano-iónico con función de ozono bactericida. Brazo articulado 360° para uso en camilla o mostrador. Timer de 15 min.",
    category: "equipos", categoryName: "Equipos", icon: "☁️", bgColor: "#e8f8ff",
    pricePublic: 4800, priceRetail: 3500, priceWholesale: 2700,
    stock: 28, unit: "equipo", isPublic: true, isDist: true,
    isPromo: true, isNew: false, isBestseller: false, discountPct: 25,
    rating: 4.6, reviewCount: 72, tags: ["vaporizador", "ozono", "facial"],
    stripeIdDemo: "price_demo_equ001",
  },
  {
    id: "p13", sku: "EQU-002", name: "Masajeador Ultrasónico RF 6en1",
    shortDesc: "Radiofrecuencia + ultrasonido + EMS + fotón.",
    longDesc: "Dispositivo estético multimodal: radiofrecuencia bipolar, ultrasonido 1MHz, electroestimulación EMS, fototerapia LED y vibración. Tensado facial, reducción de papada y mejora de textura.",
    category: "equipos", categoryName: "Equipos", icon: "⚡", bgColor: "#fff0e8",
    pricePublic: 6200, priceRetail: 4600, priceWholesale: 3500,
    stock: 18, unit: "equipo", isPublic: true, isDist: true,
    isPromo: false, isNew: true, isBestseller: false, discountPct: 0,
    rating: 4.8, reviewCount: 45, tags: ["radiofrecuencia", "ultrasonido", "estético"],
    stripeIdDemo: "price_demo_equ002",
  },
  {
    id: "p14", sku: "EQU-003", name: "Camilla Eléctrica Multifunción Pro",
    shortDesc: "4 secciones articuladas, respaldo 90°, capacidad 220 kg.",
    longDesc: "Camilla eléctrica profesional con 4 secciones motorizadas. Panel de control lateral y pie. Respaldo ajustable hasta 90°, altura 55–95cm. Tapizado impermeable antibacteriano. Capacidad 220 kg.",
    category: "equipos", categoryName: "Equipos", icon: "🛋️", bgColor: "#f0f4f8",
    pricePublic: 18500, priceRetail: 14000, priceWholesale: 10800,
    stock: 8, unit: "equipo", isPublic: true, isDist: true,
    isPromo: false, isNew: false, isBestseller: false, discountPct: 0,
    rating: 4.9, reviewCount: 34, tags: ["camilla", "eléctrica", "profesional"],
    stripeIdDemo: "price_demo_equ003",
  },
  // ── Accesorios ────────────────────────────────────────────────
  {
    id: "p15", sku: "ACC-001", name: "Set Brochas de Maquillaje 12 pzas",
    shortDesc: "Fibra sintética premium, mango de bambú.",
    longDesc: "Set de 12 brochas profesionales de fibra sintética vegan-friendly. Mango ergonómico de bambú certificado. Incluye: brocha kabuki, blush, contorno, 3 sombras, base, corrector, delineador, difuminador y polvo.",
    category: "accesorios", categoryName: "Accesorios", icon: "🖌️", bgColor: "#fef8e8",
    pricePublic: 580, priceRetail: 420, priceWholesale: 310,
    stock: 234, unit: "set", isPublic: true, isDist: true,
    isPromo: false, isNew: false, isBestseller: true, discountPct: 0,
    rating: 4.7, reviewCount: 389, tags: ["brochas", "maquillaje", "bambú"],
    stripeIdDemo: "price_demo_acc001",
  },
  {
    id: "p16", sku: "ACC-002", name: "Organizador Giratorio Cosméticos 360°",
    shortDesc: "Acrílico cristal, 18 compartimentos, base LED.",
    longDesc: "Organizador de acrílico de alta transparencia con base giratoria 360° y luz LED integrada. 18 compartimentos de distintos tamaños. Capacidad para 80+ productos. Base cargable por USB.",
    category: "accesorios", categoryName: "Accesorios", icon: "🗂️", bgColor: "#eef8ff",
    pricePublic: 780, priceRetail: 560, priceWholesale: 420,
    stock: 112, unit: "pieza", isPublic: true, isDist: true,
    isPromo: true, isNew: false, isBestseller: false, discountPct: 10,
    rating: 4.5, reviewCount: 142, tags: ["organizador", "acrílico", "LED"],
    stripeIdDemo: "price_demo_acc002",
  },
  {
    id: "p17", sku: "ACC-003", name: "Delantal Profesional Estilista Canvas",
    shortDesc: "Canvas 600D, 8 bolsillos, correa ajustable.",
    longDesc: "Delantal de trabajo profesional en canvas de alta resistencia 600D. 8 bolsillos funcionales, correa cervical y cintura ajustables. Resistente al agua y manchas. Disponible en negro y gris Oxford.",
    category: "accesorios", categoryName: "Accesorios", icon: "👘", bgColor: "#f4f4f4",
    pricePublic: 340, priceRetail: 245, priceWholesale: 180,
    stock: 178, unit: "pieza", isPublic: true, isDist: true,
    isPromo: false, isNew: true, isBestseller: false, discountPct: 0,
    rating: 4.6, reviewCount: 95, tags: ["delantal", "profesional", "canvas"],
    stripeIdDemo: "price_demo_acc003",
  },
  // ── Insumos ───────────────────────────────────────────────────
  {
    id: "p18", sku: "INS-001", name: "Tinte Profesional Ammonia Free Caja x12",
    shortDesc: "Sin amoníaco, 48 tonos, cobertura 100%.",
    longDesc: "Tinte profesional sin amoníaco con cobertura 100% de canas. Tecnología Oil-Protect para cuidado del cabello durante el proceso. Caja con 12 tubos de 60ml. Disponible en 48 tonos.",
    category: "insumos", categoryName: "Insumos", icon: "🎨", bgColor: "#fff0e8",
    pricePublic: 1680, priceRetail: 1200, priceWholesale: 890,
    stock: 340, unit: "caja", isPublic: false, isDist: true,
    isPromo: false, isNew: false, isBestseller: true, discountPct: 0,
    rating: 4.8, reviewCount: 213, tags: ["tinte", "sin amoníaco", "profesional"],
    stripeIdDemo: "price_demo_ins001",
  },
  {
    id: "p19", sku: "INS-002", name: "Activador Oxidante 20Vol Garrafa 1L",
    shortDesc: "Para uso con tintes profesionales, estable.",
    longDesc: "Oxidante estabilizado de 20 volúmenes en presentación de 1 litro. Fórmula con agentes acondicionadores que protegen la fibra durante la coloración. Compatibilidad universal con todas las marcas profesionales.",
    category: "insumos", categoryName: "Insumos", icon: "⚗️", bgColor: "#f8f8f0",
    pricePublic: 280, priceRetail: 195, priceWholesale: 145,
    stock: 620, unit: "garrafa", isPublic: false, isDist: true,
    isPromo: true, isNew: false, isBestseller: false, discountPct: 8,
    rating: 4.5, reviewCount: 178, tags: ["oxidante", "20vol", "insumo"],
    stripeIdDemo: "price_demo_ins002",
  },
  {
    id: "p20", sku: "INS-003", name: "Guantes Nitrilo Pro Negro Caja x100",
    shortDesc: "Sin polvo, libre de látex, resistencia química.",
    longDesc: "Guantes de nitrilo negro sin polvo, libres de látex. Alta resistencia química y mecánica. Textura micrograbada en palma para mejor agarre. Tallas S, M, L, XL. Caja de 100 piezas.",
    category: "insumos", categoryName: "Insumos", icon: "🧤", bgColor: "#f0f0f0",
    pricePublic: 320, priceRetail: 220, priceWholesale: 165,
    stock: 1240, unit: "caja", isPublic: true, isDist: true,
    isPromo: false, isNew: false, isBestseller: true, discountPct: 0,
    rating: 4.6, reviewCount: 431, tags: ["guantes", "nitrilo", "negro"],
    stripeIdDemo: "price_demo_ins003",
  },
  // ── Bienestar ─────────────────────────────────────────────────
  {
    id: "p21", sku: "BIE-001", name: "Difusor Ultrasónico Aromaterapia 500ml",
    shortDesc: "7 luces LED, modos timer, apagado automático.",
    longDesc: "Difusor ultrasónico de madera y ABS con depósito de 500ml. Genera niebla fría suave. 7 colores LED ajustables. 4 modos de tiempo (1h/3h/6h/continuo). Ideal para consultorios, spas y oficinas.",
    category: "bienestar", categoryName: "Bienestar", icon: "🌸", bgColor: "#f8f0ff",
    pricePublic: 680, priceRetail: 490, priceWholesale: 370,
    stock: 203, unit: "pieza", isPublic: true, isDist: true,
    isPromo: true, isNew: false, isBestseller: true, discountPct: 15,
    rating: 4.7, reviewCount: 328, tags: ["difusor", "aromaterapia", "ultrasónico"],
    stripeIdDemo: "price_demo_bie001",
  },
  {
    id: "p22", sku: "BIE-002", name: "Colágeno Marino Hidrolizado 300g",
    shortDesc: "Tipo I y III, sabor neutro, solubilidad alta.",
    longDesc: "Colágeno marino hidrolizado de péptidos bioactivos tipos I y III. Sin sabor ni olor. Mezcla instantánea en frío o caliente. Alta biodisponibilidad para piel, articulaciones y cabello. Sin aditivos.",
    category: "bienestar", categoryName: "Bienestar", icon: "💊", bgColor: "#e8f8f0",
    pricePublic: 480, priceRetail: 340, priceWholesale: 255,
    stock: 567, unit: "frasco", isPublic: true, isDist: true,
    isPromo: false, isNew: false, isBestseller: true, discountPct: 0,
    rating: 4.8, reviewCount: 492, tags: ["colágeno", "marino", "suplemento"],
    stripeIdDemo: "price_demo_bie002",
  },
  {
    id: "p23", sku: "BIE-003", name: "Masajeador Eléctrico Shiatsu Cuello",
    shortDesc: "3D kneading, calor infrarojo, control remoto.",
    longDesc: "Masajeador Shiatsu con 8 nodos 3D bi-rotacionales y calor por infrarrojo. Velocidad ajustable. Diseño ergonómico para cuello, hombros, espalda y piernas. Control remoto incluido.",
    category: "bienestar", categoryName: "Bienestar", icon: "🧘", bgColor: "#fff8e8",
    pricePublic: 1100, priceRetail: 800, priceWholesale: 600,
    stock: 89, unit: "pieza", isPublic: true, isDist: true,
    isPromo: true, isNew: true, isBestseller: false, discountPct: 12,
    rating: 4.6, reviewCount: 167, tags: ["masajeador", "shiatsu", "cuello"],
    stripeIdDemo: "price_demo_bie003",
  },
  {
    id: "p24", sku: "BIE-004", name: "Aceites Esenciales Set Inicio 10 pzas 10ml",
    shortDesc: "Lavanda, menta, eucalipto, naranja y más.",
    longDesc: "Set de inicio con 10 aceites esenciales puros 100% (sin sintéticos): lavanda, menta, eucalipto, naranja dulce, árbol de té, geranio, limón, romero, bergamota y sándalo. Frascos de 10ml con válvula cuentagotas.",
    category: "bienestar", categoryName: "Bienestar", icon: "🫙", bgColor: "#fffae8",
    pricePublic: 590, priceRetail: 420, priceWholesale: 315,
    stock: 312, unit: "set", isPublic: true, isDist: true,
    isPromo: false, isNew: false, isBestseller: true, discountPct: 0,
    rating: 4.9, reviewCount: 256, tags: ["aceites", "esenciales", "aromaterapia"],
    stripeIdDemo: "price_demo_bie004",
  },
];

/* ─── Servicios ──────────────────────────────────────────── */
export interface MpService {
  id: string; name: string; description: string; durationMin: number;
  price: number; category: string; icon: string; bgColor: string;
  isNew: boolean; rating: number;
}
export const MP_SERVICES: MpService[] = [
  { id: "s01", name: "Asesoría Comercial Ecommerce", description: "Sesión 1:1 de 90 min para estrategia de ventas online, catálogo, precios y canales.", durationMin: 90, price: 1800, category: "Consultoría", icon: "💡", bgColor: "#fffae8", isNew: false, rating: 4.9 },
  { id: "s02", name: "Capacitación Express POS", description: "Capacitación presencial o remota de 2 hrs para dominar el sistema de punto de venta.", durationMin: 120, price: 1200, category: "Capacitación", icon: "📲", bgColor: "#e8f4ff", isNew: false, rating: 4.8 },
  { id: "s03", name: "Diagnóstico Operativo Marca", description: "Revisión completa de procesos, catálogo, logística y pagos con informe ejecutivo.", durationMin: 180, price: 2800, category: "Diagnóstico", icon: "🔍", bgColor: "#f0f8f0", isNew: true, rating: 4.7 },
  { id: "s04", name: "Activación Ecommerce Completo", description: "Setup completo de tienda online: productos, pagos, logística, branding y pruebas.", durationMin: 480, price: 8500, category: "Implementación", icon: "🚀", bgColor: "#f0f0ff", isNew: false, rating: 4.9 },
  { id: "s05", name: "Activación POS + Membresías", description: "Configuración de punto de venta físico, sistema de membresías y primer cierre de caja.", durationMin: 240, price: 3500, category: "Implementación", icon: "🏪", bgColor: "#fff4e8", isNew: false, rating: 4.8 },
  { id: "s06", name: "Onboarding Logística Express", description: "Activación de módulo logístico, integración con couriers y primera ruta de entrega.", durationMin: 180, price: 2200, category: "Logística", icon: "🚛", bgColor: "#e8fff0", isNew: true, rating: 4.7 },
];

/* ─── Promociones ────────────────────────────────────────── */
export interface MpPromo {
  id: string; title: string; subtitle: string; badge: string;
  bg: string; textColor: string; icon: string; cta: string; productIds: string[];
}
export const MP_PROMOS: MpPromo[] = [
  { id: "pr1", title: "Temporada de Belleza", subtitle: "Hasta 25% en productos seleccionados de belleza y cuidado personal", badge: "⚡ Flash Sale 48 hrs", bg: "linear-gradient(135deg,#4a1565,#9b28c7)", textColor: "#fff", icon: "💄", cta: "Ver ofertas", productIds: ["p01","p03","p05"] },
  { id: "pr2", title: "Equipa tu Cabina", subtitle: "Las mejores herramientas profesionales con precio de mayoreo abierto", badge: "🔥 Temporada Pro", bg: "linear-gradient(135deg,#0d2354,#1e6ef7)", textColor: "#fff", icon: "⚙️", cta: "Ver equipos", productIds: ["p09","p10","p12"] },
  { id: "pr3", title: "Bienestar & Autocuidado", subtitle: "Inicia tu rutina de bienestar con los mejores productos del mes", badge: "🌿 Nuevo ingreso", bg: "linear-gradient(135deg,#064e3b,#10b981)", textColor: "#fff", icon: "🌸", cta: "Explorar", productIds: ["p21","p22","p24"] },
];

/* ─── Pedidos demo ───────────────────────────────────────── */
export interface MpOrder {
  id: string; date: string; status: "entregado" | "en camino" | "procesando" | "cancelado";
  items: { productId: string; name: string; qty: number; price: number }[];
  subtotal: number; shipping: number; total: number;
  channel: "público" | "distribuidor";
  tracking?: string;
}
export const MP_ORDERS: MpOrder[] = [
  { id: "ORD-001", date: "2025-03-15", status: "entregado", channel: "público", tracking: "MP001234MX", subtotal: 1930, shipping: 0, total: 1930, items: [{ productId: "p01", name: "Sérum Vitamina C", qty: 2, price: 680 }, { productId: "p05", name: "Perfume Oud Royal", qty: 1, price: 1480 }] },
  { id: "ORD-002", date: "2025-03-22", status: "en camino", channel: "distribuidor", tracking: "MP002345MX", subtotal: 8920, shipping: 150, total: 9070, items: [{ productId: "p18", name: "Tinte Profesional Caja x12", qty: 5, price: 890 }, { productId: "p19", name: "Activador Oxidante 1L", qty: 8, price: 145 }, { productId: "p20", name: "Guantes Nitrilo Caja x100", qty: 6, price: 165 }] },
  { id: "ORD-003", date: "2025-03-28", status: "procesando", channel: "público", subtotal: 2730, shipping: 99, total: 2829, items: [{ productId: "p02", name: "Set Maquillaje HD Studio", qty: 2, price: 1250 }, { productId: "p15", name: "Set Brochas 12pzas", qty: 1, price: 580 }] },
  { id: "ORD-004", date: "2025-02-10", status: "entregado", channel: "distribuidor", tracking: "MP004561MX", subtotal: 14600, shipping: 250, total: 14850, items: [{ productId: "p09", name: "Plancha Cerámica Pro", qty: 12, price: 920 }, { productId: "p06", name: "Kit Barbería Pro 7pzas", qty: 8, price: 540 }] },
  { id: "ORD-005", date: "2025-01-18", status: "entregado", channel: "público", tracking: "MP005678MX", subtotal: 1260, shipping: 0, total: 1260, items: [{ productId: "p22", name: "Colágeno Marino 300g", qty: 2, price: 480 }, { productId: "p24", name: "Aceites Esenciales Set 10pzas", qty: 1, price: 590 }] },
];

/* ─── Usuarios demo ──────────────────────────────────────── */
export const MP_USERS = {
  public: { name: "Sofía Ramírez", email: "sofia@demo.com", points: 1240, tier: "Silver", orders: 8 },
  distributor: { name: "Carlos Importaciones S.A.", email: "carlos@distdemo.com", rfc: "CIS900101AAA", creditLimit: 50000, currentBalance: 12500, orders: 47, repName: "Ing. Carlos Torres" },
  pos: { name: "Juan López", location: "Sucursal Centro CDMX", role: "Cajero" },
  admin: { name: "Administrador Demo", email: "admin@mercaplus.demo", role: "Brand Admin" },
};

/* ─── Reviews demo ───────────────────────────────────────── */
export interface MpReview { author: string; rating: number; date: string; comment: string; verified: boolean; }
export const MP_REVIEWS: Record<string, MpReview[]> = {
  p01: [
    { author: "Alejandra V.", rating: 5, date: "2025-03-10", comment: "Increíble sérum, mi piel se ve luminosa desde la primera semana. Lo recomiendo 100%.", verified: true },
    { author: "Marisol G.", rating: 5, date: "2025-03-05", comment: "Lo usé por 30 días y mis manchas se redujeron notablemente. El mejor que he probado.", verified: true },
    { author: "Patricia H.", rating: 4, date: "2025-02-18", comment: "Muy buena textura, se absorbe rápido y no deja residuo graso. Le falta un poco más de hidratación.", verified: false },
  ],
  p05: [
    { author: "Roberto M.", rating: 5, date: "2025-03-12", comment: "Duración real de 10+ horas, lo tengo ya de colección. El frasco es premium.", verified: true },
    { author: "Diego C.", rating: 5, date: "2025-02-28", comment: "Me lo recomendó un amigo y no me arrepiento. Proyección excelente.", verified: true },
  ],
};

/* ─── FAQ ────────────────────────────────────────────────── */
export const MP_FAQ = [
  { q: "¿Cuánto tarda el envío a todo el país?", a: "Envíos estándar en 3–5 días hábiles. Zonas metropolitanas en 24–48 hrs. Envío gratis en pedidos mayores a $699." },
  { q: "¿Cómo me registro como distribuidor?", a: "Completa el formulario de solicitud comercial con RFC, datos fiscales y tu compra mínima inicial. En 24–48 hrs te contactamos para activar tu cuenta." },
  { q: "¿Puedo devolver un producto?", a: "Sí, tienes 30 días desde la entrega para solicitar devolución por defecto o insatisfacción. Proceso 100% online desde tu cuenta." },
  { q: "¿Qué métodos de pago aceptan?", a: "Tarjeta crédito/débito, transferencia SPEI, Mercado Pago (QR, link, tarjeta), efectivo en punto de venta y crédito para distribuidores autorizados." },
  { q: "¿Los precios de distribuidor requieren mínimo de compra?", a: "Sí, el pedido mínimo de apertura es $3,000 MXN. A partir de $8,000 obtienes precios mayoreo y envío incluido." },
  { q: "¿Tienen aplicación móvil?", a: "Contamos con WebApp progresiva (PWA) instalable en iOS y Android directamente desde el navegador, sin necesidad de tienda de apps." },
  { q: "¿Cómo funciona el programa de puntos?", a: "Acumulas 1 punto por cada $10 de compra. Con 500 puntos obtienes $50 de descuento. Los miembros Gold acumulan 1.5x y Platinum 2x." },
  { q: "¿Los servicios son presenciales o remotos?", a: "La mayoría están disponibles en formato remoto (Zoom/Meet). Los de instalación y configuración también tienen modalidad presencial en CDMX y área metropolitana." },
];

/* ─── Utilidades ─────────────────────────────────────────── */
export const formatMXN = (n: number) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", minimumFractionDigits: 0 }).format(n);

export const getProductById = (id: string) => MP_PRODUCTS.find((p) => p.id === id);
export const getProductsByCategory = (slug: string) => MP_PRODUCTS.filter((p) => p.category === slug);
export const getPromoProducts = () => MP_PRODUCTS.filter((p) => p.isPromo);
export const getNewProducts = () => MP_PRODUCTS.filter((p) => p.isNew);
export const getBestsellers = () => MP_PRODUCTS.filter((p) => p.isBestseller);
export const getDistProducts = () => MP_PRODUCTS.filter((p) => p.isDist);
export const getPublicProducts = () => MP_PRODUCTS.filter((p) => p.isPublic);
