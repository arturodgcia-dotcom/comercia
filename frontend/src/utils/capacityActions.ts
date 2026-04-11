export type CapacityResourceCode =
  | "capacity_products"
  | "capacity_users"
  | "capacity_ai_agents"
  | "capacity_branches"
  | "capacity_brands"
  | "capacity_ai_credits";

export type CapacitySuggestion = {
  resource: CapacityResourceCode;
  addonCode: string;
  addonLabel: string;
  thresholdUpgradeRatio: number;
};

const CAPACITY_SUGGESTIONS: Record<CapacityResourceCode, CapacitySuggestion> = {
  capacity_products: {
    resource: "capacity_products",
    addonCode: "extra_100_products",
    addonLabel: "Agregar 100 productos",
    thresholdUpgradeRatio: 0.95,
  },
  capacity_users: {
    resource: "capacity_users",
    addonCode: "extra_user",
    addonLabel: "Agregar usuario",
    thresholdUpgradeRatio: 0.95,
  },
  capacity_ai_agents: {
    resource: "capacity_ai_agents",
    addonCode: "extra_ai_agent",
    addonLabel: "Agregar agente IA",
    thresholdUpgradeRatio: 0.95,
  },
  capacity_branches: {
    resource: "capacity_branches",
    addonCode: "extra_branch",
    addonLabel: "Agregar sucursal",
    thresholdUpgradeRatio: 0.95,
  },
  capacity_brands: {
    resource: "capacity_brands",
    addonCode: "extra_brand",
    addonLabel: "Agregar marca",
    thresholdUpgradeRatio: 0.9,
  },
  capacity_ai_credits: {
    resource: "capacity_ai_credits",
    addonCode: "extra_500_ai_credits",
    addonLabel: "Comprar mas creditos",
    thresholdUpgradeRatio: 0.9,
  },
};

export function resolveCapacitySuggestion(alertCode: string | null | undefined): CapacitySuggestion | null {
  const normalized = String(alertCode || "").trim().toLowerCase();
  if (!normalized) return null;
  const key = (Object.keys(CAPACITY_SUGGESTIONS) as CapacityResourceCode[]).find((candidate) => normalized.includes(candidate));
  return key ? CAPACITY_SUGGESTIONS[key] : null;
}

export function shouldSuggestUpgrade(used: number, limit: number, threshold = 0.95): boolean {
  if (limit <= 0) return false;
  return used / Math.max(limit, 1) >= threshold;
}

