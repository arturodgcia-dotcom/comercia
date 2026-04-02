import { useMemo } from "react";
import { useAuth } from "../app/AuthContext";

const STORAGE_MODE_KEY = "comercia_admin_mode";
const STORAGE_BRAND_KEY = "comercia_admin_brand_id";

export function useAdminContextScope() {
  const { user } = useAuth();
  const isGlobalAdmin = user?.role === "reinpia_admin";
  const storedMode = sessionStorage.getItem(STORAGE_MODE_KEY);
  const mode = isGlobalAdmin && storedMode === "global" ? "global" : "brand";
  const storedBrandId = Number(sessionStorage.getItem(STORAGE_BRAND_KEY) ?? "");
  const selectedBrandId = Number.isFinite(storedBrandId) && storedBrandId > 0 ? storedBrandId : null;

  const tenantId = useMemo(() => {
    if (isGlobalAdmin) {
      return selectedBrandId;
    }
    return user?.tenant_id ?? null;
  }, [isGlobalAdmin, selectedBrandId, user?.tenant_id]);

  return {
    mode,
    isGlobalAdmin,
    tenantId,
  };
}
