export type IndustrialMasterBrandConfig = {
  brandName: string;
  tagline: string;
  valueProp: string;
  whatsapp: string;
  contactEmail: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
};

export const INDUSTRIAL_MASTER_DEFAULT_BRAND: IndustrialMasterBrandConfig = {
  brandName: "TODOINDUSTRIALMX",
  tagline: "Entregamos soluciones en transmision de potencia",
  valueProp: "Excelente calidad al mejor precio para industria, taller y distribucion",
  whatsapp: "https://wa.me/525511791417",
  contactEmail: "todoindustrialmx@gmail.com",
  primaryColor: "#0d2340",
  secondaryColor: "#1f4f7f",
  accentColor: "#f59e0b",
};

export const INDUSTRIAL_MASTER_BRANDS = ["ZSG", "SKF", "Timken", "FAG", "FULO", "NTN"];

export const INDUSTRIAL_MASTER_CATEGORIES = [
  "Baleros",
  "Chumaceras",
  "Cadenas",
  "Catarinas",
  "Bandas",
  "Acoples",
  "Retenes",
  "Lubricantes",
  "Ferremateriales",
  "Automotriz",
];

export const INDUSTRIAL_MASTER_PRODUCTS = [
  { id: "IND-6205", name: "Balero SKF 6205 2RS", category: "Baleros", price: 185, wholesale: 165 },
  { id: "IND-UCP205", name: "Chumacera ZSG UCP205", category: "Chumaceras", price: 365, wholesale: 330 },
  { id: "IND-ASA60", name: "Cadena ASA 60", category: "Cadenas", price: 290, wholesale: 260 },
  { id: "IND-20B18", name: "Catarina 20B 18 dientes", category: "Catarinas", price: 520, wholesale: 470 },
  { id: "IND-PJ1220", name: "Banda Poly-V FULO PJ1220", category: "Bandas", price: 215, wholesale: 190 },
  { id: "IND-L150", name: "Acople elastomerico L-150", category: "Acoples", price: 485, wholesale: 445 },
];

