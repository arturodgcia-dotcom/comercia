import { TenantCommissionRules } from "../types/domain";

export type MonetizationPlanType = "commission" | "subscription";

export type TotalsInput = {
  subtotal: number;
  discount?: number;
  shipping?: number;
};

export type TotalsResult = {
  subtotal: number;
  discount: number;
  shipping: number;
  taxableBase: number;
  commission: number;
  total: number;
  net: number;
  commissionRate: number;
  commissionRule: string;
};

function toNumber(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function resolveCommission(amount: number, rules?: TenantCommissionRules): { rate: number; rule: string } {
  const tiers = rules?.tiers?.length ? rules.tiers : [{ up_to: null, rate: "0", label: "Regla" }];
  for (const tier of tiers) {
    const upTo = tier.up_to == null || tier.up_to === "" ? null : toNumber(tier.up_to, 0);
    const rate = toNumber(tier.rate, 0);
    if (upTo == null || amount <= upTo) {
      return { rate, rule: tier.label || "Regla" };
    }
  }
  const fallback = tiers[tiers.length - 1];
  return { rate: toNumber(fallback.rate, 0), rule: fallback.label || "Regla" };
}

export function calculatePlanTotals(input: TotalsInput, planType: string, rules?: TenantCommissionRules): TotalsResult {
  const subtotal = round2(toNumber(input.subtotal, 0));
  const discount = round2(toNumber(input.discount, 0));
  const shipping = round2(toNumber(input.shipping, 0));
  const taxableBase = Math.max(0, round2(subtotal - discount));

  let commission = 0;
  let commissionRate = 0;
  let commissionRule = "SUBSCRIPTION";

  if (planType === "commission") {
    const commissionDef = resolveCommission(taxableBase, rules);
    commissionRate = commissionDef.rate;
    commissionRule = commissionDef.rule;
    commission = round2(taxableBase * commissionRate);
    const minimum = rules?.minimum_per_operation == null ? 0 : toNumber(rules.minimum_per_operation, 0);
    if (taxableBase > 0 && minimum > commission) {
      commission = round2(minimum);
    }
  }

  const total = round2(taxableBase + shipping);
  const net = round2(total - commission);

  return {
    subtotal,
    discount,
    shipping,
    taxableBase,
    commission,
    total,
    net,
    commissionRate,
    commissionRule,
  };
}
