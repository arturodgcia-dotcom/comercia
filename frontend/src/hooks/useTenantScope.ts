import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../app/AuthContext";
import { api } from "../services/api";

type TenantOption = {
  tenant_id: number;
  tenant_name: string;
};

export function useTenantScope() {
  const { token, user } = useAuth();
  const isGlobalAdmin = user?.role === "reinpia_admin";
  const [tenantId, setTenantId] = useState<number | null>(user?.tenant_id ?? null);
  const [tenantOptions, setTenantOptions] = useState<TenantOption[]>([]);
  const [scopeError, setScopeError] = useState("");

  useEffect(() => {
    if (!user) return;
    if (!isGlobalAdmin) {
      setTenantId(user.tenant_id ?? null);
      return;
    }
    if (!token) return;
    api.getReinpiaTenantsSummary(token)
      .then((rows) => {
        const normalized = rows.map((row) => ({ tenant_id: row.tenant_id, tenant_name: row.tenant_name }));
        setTenantOptions(normalized);
        setTenantId((previous) => previous ?? normalized[0]?.tenant_id ?? null);
      })
      .catch((err) => setScopeError(err instanceof Error ? err.message : "No fue posible cargar marcas"));
  }, [token, user, isGlobalAdmin]);

  const tenantIdForReports = useMemo(() => {
    if (!isGlobalAdmin) return user?.tenant_id ?? null;
    return tenantId;
  }, [isGlobalAdmin, tenantId, user?.tenant_id]);

  return {
    isGlobalAdmin,
    tenantIdForReports,
    tenantOptions,
    scopeError,
    setTenantIdForReports: setTenantId,
  };
}

