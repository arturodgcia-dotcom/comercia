import { FormEvent, useState } from "react";
import { useAuth } from "../app/AuthContext";
import { api } from "../services/api";

type AddonModuleKey = "logistics" | "workday" | "nfc";

type Props = {
  tenantId: number;
  moduleKey: AddonModuleKey;
  moduleName: string;
  description: string;
  benefits: string[];
  status: string;
  plan: string | null | undefined;
  scopeBranchIds: number[];
  allowOperational: boolean;
  onUpdated?: () => Promise<void> | void;
};

const STATUS_LABELS: Record<string, string> = {
  deshabilitado: "No contratado",
  configurando: "Requiere activacion",
  activo: "Disponible",
  suspendido: "Suspendido",
};

export function AddonModuleAccessCard(props: Props) {
  const { token, user } = useAuth();
  const isSuperAdmin = user?.role === "reinpia_admin" || user?.role === "super_admin";
  const [statusDraft, setStatusDraft] = useState(props.status || "deshabilitado");
  const [planDraft, setPlanDraft] = useState(props.plan || "");
  const [scopeDraft, setScopeDraft] = useState(props.scopeBranchIds.join(","));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const requestActivation = async (kind: "activar" | "consultar") => {
    if (!token) return;
    try {
      setLoading(true);
      setError("");
      setMessage("");
      await api.createCommercialPlanRequest(token, {
        tenant_id: props.tenantId,
        request_type: "addon",
        addon_id: props.moduleKey,
        notes: `${kind === "activar" ? "Solicitud de activacion" : "Consulta de activacion"} de add-on ${props.moduleName}`,
      });
      setMessage(kind === "activar" ? "Solicitud de activacion enviada a ComerCia." : "Consulta enviada al equipo ComerCia.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No fue posible registrar la solicitud.");
    } finally {
      setLoading(false);
    }
  };

  const saveAdmin = async (event: FormEvent) => {
    event.preventDefault();
    if (!token || !isSuperAdmin) return;
    try {
      setLoading(true);
      setError("");
      setMessage("");
      const scope = scopeDraft
        .split(",")
        .map((item) => Number(item.trim()))
        .filter((value) => Number.isFinite(value) && value > 0);
      const payload: Record<string, unknown> = {};
      if (props.moduleKey === "logistics") {
        payload.addon_logistics_status = statusDraft;
        payload.addon_logistics_plan = planDraft || null;
        payload.addon_logistics_scope_branch_ids = scope;
      } else if (props.moduleKey === "workday") {
        payload.addon_workday_status = statusDraft;
        payload.addon_workday_plan = planDraft || null;
        payload.addon_workday_scope_branch_ids = scope;
      } else {
        payload.addon_nfc_status = statusDraft;
        payload.addon_nfc_plan = planDraft || null;
        payload.addon_nfc_scope_branch_ids = scope;
      }
      await api.updateBrandAdminSettings(token, props.tenantId, payload);
      setMessage("Configuracion del add-on actualizada.");
      if (props.onUpdated) await props.onUpdated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No fue posible actualizar el add-on.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <article className="card">
      <h3>{props.moduleName}</h3>
      <p>{props.description}</p>
      <p><strong>Estado:</strong> {STATUS_LABELS[props.status] || props.status}</p>
      <p><strong>Plan:</strong> {props.plan || "No contratado"}</p>
      <p><strong>Sucursales scope:</strong> {props.scopeBranchIds.length ? props.scopeBranchIds.join(", ") : "Sin definir"}</p>
      <ul className="marketing-list">
        {props.benefits.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      {!props.allowOperational ? (
        <div className="row-gap">
          <button className="button" type="button" disabled={loading} onClick={() => void requestActivation("activar")}>
            Activar add-on
          </button>
          <button className="button button-outline" type="button" disabled={loading} onClick={() => void requestActivation("consultar")}>
            Consultar activacion
          </button>
        </div>
      ) : null}
      {isSuperAdmin ? (
        <form className="detail-form" onSubmit={(event) => void saveAdmin(event)}>
          <label>
            Estado comercial
            <select value={statusDraft} onChange={(event) => setStatusDraft(event.target.value)}>
              <option value="deshabilitado">deshabilitado</option>
              <option value="configurando">configurando</option>
              <option value="activo">activo</option>
              <option value="suspendido">suspendido</option>
            </select>
          </label>
          <label>
            Plan add-on
            <input value={planDraft} onChange={(event) => setPlanDraft(event.target.value)} />
          </label>
          <label>
            Scope sucursales (IDs)
            <input value={scopeDraft} onChange={(event) => setScopeDraft(event.target.value)} />
          </label>
          <button className="button button-outline" type="submit" disabled={loading}>
            Guardar configuracion
          </button>
        </form>
      ) : null}
      {message ? <p>{message}</p> : null}
      {error ? <p className="error">{error}</p> : null}
    </article>
  );
}
