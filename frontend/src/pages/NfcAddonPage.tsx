import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../app/AuthContext";
import { AddonModuleAccessCard } from "../components/AddonModuleAccessCard";
import { PageHeader } from "../components/PageHeader";
import { useAdminContextScope } from "../hooks/useAdminContextScope";
import { api } from "../services/api";
import { BrandAdminSettings, Tenant } from "../types/domain";

export function NfcAddonPage() {
  const { token, user } = useAuth();
  const { tenantId: scopedTenantId } = useAdminContextScope();
  const isSuperAdmin = user?.role === "reinpia_admin" || user?.role === "super_admin";
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [tenantId, setTenantId] = useState<number | null>(null);
  const [brandSettings, setBrandSettings] = useState<BrandAdminSettings | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;
    api.getTenants(token).then((list) => {
      setTenants(list);
      const preferred = scopedTenantId && list.some((item) => item.id === scopedTenantId) ? scopedTenantId : list[0]?.id ?? null;
      setTenantId((prev) => prev ?? preferred);
    });
  }, [token, scopedTenantId]);

  const loadBrand = async (selectedTenantId: number) => {
    if (!token) return;
    const settings = await api.getBrandAdminSettings(token, selectedTenantId).catch(() => null);
    setBrandSettings(settings);
  };

  useEffect(() => {
    if (!tenantId) return;
    loadBrand(tenantId).catch((err) => setError(err instanceof Error ? err.message : "No fue posible cargar NFC."));
  }, [tenantId, token]);

  const allowOperational = Boolean(isSuperAdmin || brandSettings?.feature_nfc_operations_enabled);

  return (
    <section>
      <PageHeader title="NFC / grabado / impresion" subtitle="Modulo add-on con activacion comercial controlada por contrato." />
      {error ? <p className="error">{error}</p> : null}
      <article className="card">
        <h3>Marca</h3>
        <select value={tenantId ?? ""} onChange={(event) => setTenantId(Number(event.target.value))} disabled={!isSuperAdmin}>
          {tenants.map((tenant) => (
            <option key={tenant.id} value={tenant.id}>
              {tenant.name}
            </option>
          ))}
        </select>
      </article>

      {tenantId && brandSettings ? (
        <AddonModuleAccessCard
          tenantId={tenantId}
          moduleKey="nfc"
          moduleName="NFC / grabado / impresion"
          description="Gestiona activacion comercial del modulo NFC, personalizacion de tarjetas e impresion."
          benefits={[
            "Control de activacion por marca y sucursal",
            "Base para grabado e impresion de tarjetas",
            "Preparado para operacion escalable cuando este contratado",
          ]}
          status={brandSettings.addon_nfc_status}
          plan={brandSettings.addon_nfc_plan}
          scopeBranchIds={brandSettings.addon_nfc_scope_branch_ids}
          allowOperational={allowOperational}
          onUpdated={async () => {
            if (tenantId) await loadBrand(tenantId);
          }}
        />
      ) : null}

      {allowOperational ? (
        <article className="card">
          <h3>Acceso operativo habilitado</h3>
          <p>El add-on NFC esta activo para esta marca. Puedes continuar con la operacion desde POS y configuracion de canales.</p>
          <div className="row-gap">
            <Link className="button button-outline" to="/admin/channels/pos">
              Ir a POS / WebApp
            </Link>
            <Link className="button button-outline" to="/pos/locations">
              Ver sucursales POS
            </Link>
          </div>
        </article>
      ) : (
        <article className="card">
          <h3>Modulo disponible</h3>
          <p>
            Este modulo es visible para tu marca y requiere contratacion para operar. Puedes solicitar activacion o consultar
            planes disponibles desde esta misma pantalla.
          </p>
        </article>
      )}
    </section>
  );
}
