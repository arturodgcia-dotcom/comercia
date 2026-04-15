import { User } from "../types/domain";

const LEGACY_ROLE_PERMISSION_MAP: Record<string, string[]> = {
  reinpia_admin: ["*"],
  super_admin: ["*"],
  contador: [
    "global.view_dashboard",
    "global.view_clients",
    "global.view_brands",
    "global.view_payments",
    "global.view_commissions",
  ],
  soporte: [
    "global.view_dashboard",
    "global.view_support",
    "brand.view_dashboard",
    "brand.open_support",
    "brand.view_consumption_limits",
  ],
  comercial: ["global.view_dashboard", "global.view_clients", "global.view_marketing_prospects"],
  operaciones: ["global.view_dashboard", "global.view_brands", "global.view_support", "global.view_security"],
  agency_admin: ["global.view_dashboard", "global.view_brands", "global.view_support", "global.view_security"],
  tenant_admin: [
    "brand.view_dashboard",
    "brand.manage_catalog",
    "brand.manage_distributors",
    "brand.view_consumption_limits",
    "brand.open_support",
    "brand.buy_addons",
    "brand.edit_branding",
    "brand.view_channels",
    "brand.manage_responses_attention",
  ],
  brand_admin: [
    "brand.view_dashboard",
    "brand.manage_catalog",
    "brand.manage_distributors",
    "brand.view_consumption_limits",
    "brand.open_support",
    "brand.buy_addons",
    "brand.edit_branding",
    "brand.view_channels",
    "brand.manage_responses_attention",
  ],
  tenant_staff: [
    "brand.view_dashboard",
    "brand.manage_catalog",
    "brand.manage_distributors",
    "brand.view_consumption_limits",
    "brand.open_support",
    "brand.view_channels",
    "brand.manage_responses_attention",
  ],
  brand_operator: [
    "brand.view_dashboard",
    "brand.manage_catalog",
    "brand.manage_distributors",
    "brand.view_consumption_limits",
    "brand.open_support",
    "brand.view_channels",
    "brand.manage_responses_attention",
  ],
  distributor_user: ["brand.view_dashboard", "brand.view_consumption_limits", "brand.open_support", "brand.view_channels"],
  brand_support_viewer: ["brand.view_dashboard", "brand.view_consumption_limits", "brand.open_support", "brand.view_channels"],
};

export function hasPermission(user: User | null | undefined, permissionKey: string): boolean {
  if (!user) return false;
  const normalizedPermission = permissionKey.trim().toLowerCase();
  const explicit = (user.permissions ?? []).map((permission) => permission.trim().toLowerCase());
  if (explicit.includes("*") || explicit.includes(normalizedPermission)) return true;

  const roleKey = (user.role ?? "").trim().toLowerCase();
  const legacyPermissions = LEGACY_ROLE_PERMISSION_MAP[roleKey] ?? [];
  return legacyPermissions.includes("*") || legacyPermissions.includes(normalizedPermission);
}
