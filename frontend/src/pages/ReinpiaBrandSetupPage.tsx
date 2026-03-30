import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../app/AuthContext";
import { PageHeader } from "../components/PageHeader";
import { BrandChannelSettings, BrandSetupStepState, BrandSetupWorkflow } from "../types/domain";
import { api } from "../services/api";

const STEP_ORDER = [
  "brand_identity",
  "landing_setup",
  "public_storefront",
  "distributor_storefront",
  "pos_setup",
  "final_review",
];

const STEP_LABELS: Record<string, string> = {
  brand_identity: "Identidad de marca",
  landing_setup: "Landing de marca",
  public_storefront: "Ecommerce público",
  distributor_storefront: "Ecommerce distribuidores/comercios",
  pos_setup: "POS / WebApp",
  final_review: "Revisión final y publicación",
};

export function ReinpiaBrandSetupPage() {
  const { token } = useAuth();
  const { tenantId } = useParams();
  const tenantNumericId = Number(tenantId);
  const [workflow, setWorkflow] = useState<BrandSetupWorkflow | null>(null);
  const [channelSettings, setChannelSettings] = useState<BrandChannelSettings | null>(null);
  const [promptMaster, setPromptMaster] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("premium_moderno");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!token || Number.isNaN(tenantNumericId)) return;
    Promise.all([
      api.getBrandSetupWorkflow(token, tenantNumericId),
      api.getBrandChannelSettings(token, tenantNumericId),
    ])
      .then(([workflowData, channelData]) => {
        setWorkflow(workflowData);
        setPromptMaster(workflowData.prompt_master ?? "");
        setSelectedTemplate(workflowData.selected_template ?? "premium_moderno");
        setChannelSettings(channelData);
      })
      .catch((err) =>
        setError(err instanceof Error ? err.message : "No fue posible cargar el workflow de marca.")
      );
  }, [token, tenantNumericId]);

  const completion = useMemo(() => {
    if (!workflow || workflow.steps.length === 0) return 0;
    const approved = workflow.steps.filter((step) => step.approved).length;
    return Math.round((approved / workflow.steps.length) * 100);
  }, [workflow]);

  const updateSteps = async (
    steps: BrandSetupStepState[],
    extra?: { current_step?: string; is_published?: boolean }
  ) => {
    if (!token || !workflow) return;
    const updated = await api.updateBrandSetupWorkflow(token, workflow.tenant_id, {
      steps,
      prompt_master: promptMaster,
      selected_template: selectedTemplate,
      ...extra,
    });
    setWorkflow(updated);
    setMessage("Workflow actualizado.");
  };

  const updateStep = async (code: string, mode: "approve" | "review" | "redo", notes?: string) => {
    if (!workflow) return;
    const nextSteps = workflow.steps.map((step) => {
      if (step.code !== code) return step;
      if (mode === "approve") {
        return { ...step, status: "approved", approved: true, review_notes: notes ?? step.review_notes };
      }
      if (mode === "review") {
        return { ...step, status: "in_review", approved: false, review_notes: notes ?? step.review_notes };
      }
      return { ...step, status: "pending", approved: false, review_notes: notes ?? "Rehacer solicitado" };
    });
    await updateSteps(nextSteps, { current_step: code });
  };

  const handleUpload = async (event: ChangeEvent<HTMLInputElement>, stepCode: string, assetType: string) => {
    if (!token || !workflow) return;
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      setSaving(true);
      setError("");
      const uploaded = await api.uploadBrandAsset(token, workflow.tenant_id, stepCode, assetType, file);
      setWorkflow((previous) =>
        previous ? { ...previous, assets: [...previous.assets, uploaded] } : previous
      );
      setMessage(`Archivo cargado: ${uploaded.file_name}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No fue posible cargar el archivo.");
    } finally {
      setSaving(false);
      event.target.value = "";
    }
  };

  const saveChannelSettings = async () => {
    if (!token || !workflow || !channelSettings) return;
    try {
      setSaving(true);
      setError("");
      const updated = await api.updateBrandChannelSettings(token, workflow.tenant_id, channelSettings);
      setChannelSettings(updated);
      setMessage("Configuración NFC / Mercado Pago / MFA actualizada.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No fue posible guardar la configuración.");
    } finally {
      setSaving(false);
    }
  };

  const publishBrand = async () => {
    if (!workflow) return;
    const allApproved = workflow.steps.every((step) => step.approved);
    if (!allApproved) {
      setError("Para publicar, primero debes aprobar todos los pasos.");
      return;
    }
    await updateSteps(workflow.steps, { is_published: true, current_step: "final_review" });
    setMessage("Marca publicada correctamente.");
  };

  if (error && !workflow) return <p className="error">{error}</p>;
  if (!workflow || !channelSettings) return <p>Cargando workflow de marca...</p>;

  return (
    <section>
      <PageHeader
        title={`Setup guiado: ${workflow.tenant_name}`}
        subtitle="Revisa, aprueba, regenera o rehace cada módulo antes de publicar."
      />
      <div className="row-gap">
        <Link className="button button-outline" to="/reinpia/tenants">
          Volver a marcas
        </Link>
        <Link className="button button-outline" to={`/store/${workflow.tenant_slug}`}>
          Ver preview storefront
        </Link>
      </div>

      <article className="card">
        <h3>Estado general</h3>
        <p>Progreso aprobado: {completion}%</p>
        <p>Paso actual: {STEP_LABELS[workflow.current_step] ?? workflow.current_step}</p>
        <label>
          Prompt maestro / brief de marca
          <textarea value={promptMaster} onChange={(event) => setPromptMaster(event.target.value)} />
        </label>
        <label>
          Plantilla base
          <select value={selectedTemplate} onChange={(event) => setSelectedTemplate(event.target.value)}>
            <option value="premium_moderno">Premium moderno</option>
            <option value="retail_fuerte">Retail fuerte</option>
            <option value="servicios_ejecutivo">Servicios ejecutivo</option>
          </select>
        </label>
      </article>

      <div className="card-grid">
        {STEP_ORDER.map((stepCode) => {
          const step = workflow.steps.find((item) => item.code === stepCode) ?? {
            code: stepCode,
            title: STEP_LABELS[stepCode] ?? stepCode,
            status: "pending",
            approved: false,
            review_notes: "",
          };
          const assets = workflow.assets.filter((asset) => asset.step_code === stepCode);
          return (
            <article key={step.code} className="card">
              <h3>{step.title}</h3>
              <p>Estado: {step.status}</p>
              <p>Aprobado: {step.approved ? "Sí" : "No"}</p>
              <label>
                Nota de revisión
                <textarea
                  value={step.review_notes ?? ""}
                  onChange={(event) => {
                    const nextSteps = workflow.steps.map((item) =>
                      item.code === step.code ? { ...item, review_notes: event.target.value } : item
                    );
                    setWorkflow((previous) => (previous ? { ...previous, steps: nextSteps } : previous));
                  }}
                />
              </label>
              <label>
                Cargar archivo de este paso
                <input type="file" onChange={(event) => handleUpload(event, step.code, "generic_asset")} />
              </label>
              <p>Assets cargados: {assets.length}</p>
              <div className="row-gap">
                <button className="button button-outline" type="button" onClick={() => updateStep(step.code, "review", step.review_notes ?? undefined)}>
                  Marcar en revisión
                </button>
                <button className="button button-outline" type="button" onClick={() => updateStep(step.code, "redo", step.review_notes ?? undefined)}>
                  Rehacer
                </button>
                <button className="button" type="button" onClick={() => updateStep(step.code, "approve", step.review_notes ?? undefined)}>
                  Aprobar
                </button>
              </div>
            </article>
          );
        })}
      </div>

      <article className="card">
        <h3>Servicios opcionales por marca</h3>
        <label className="checkbox">
          <input
            type="checkbox"
            checked={channelSettings.nfc_enabled}
            onChange={(event) => setChannelSettings((previous) => previous ? { ...previous, nfc_enabled: event.target.checked } : previous)}
          />
          Activar NFC (servicio opcional)
        </label>
        <label>
          Costo de activación NFC
          <input
            type="number"
            value={channelSettings.nfc_setup_fee}
            onChange={(event) => setChannelSettings((previous) => previous ? { ...previous, nfc_setup_fee: Number(event.target.value) } : previous)}
          />
        </label>
        <label className="checkbox">
          <input
            type="checkbox"
            checked={channelSettings.mercadopago_enabled}
            onChange={(event) => setChannelSettings((previous) => previous ? { ...previous, mercadopago_enabled: event.target.checked } : previous)}
          />
          Activar cobros digitales con Mercado Pago
        </label>
        <label>
          Mercado Pago public key
          <input
            value={channelSettings.mercadopago_public_key ?? ""}
            onChange={(event) => setChannelSettings((previous) => previous ? { ...previous, mercadopago_public_key: event.target.value } : previous)}
          />
        </label>
        <label>
          Mercado Pago access token
          <input
            value={channelSettings.mercadopago_access_token ?? ""}
            onChange={(event) => setChannelSettings((previous) => previous ? { ...previous, mercadopago_access_token: event.target.value } : previous)}
          />
        </label>
        <label className="checkbox">
          <input
            type="checkbox"
            checked={channelSettings.mfa_totp_enabled}
            onChange={(event) => setChannelSettings((previous) => previous ? { ...previous, mfa_totp_enabled: event.target.checked } : previous)}
          />
          Habilitar MFA TOTP (Google Authenticator)
        </label>
        <button className="button" type="button" onClick={saveChannelSettings} disabled={saving}>
          Guardar servicios opcionales
        </button>
      </article>

      <div className="row-gap">
        <button className="button button-outline" type="button" onClick={() => updateSteps(workflow.steps)}>
          Guardar progreso
        </button>
        <button className="button" type="button" onClick={publishBrand}>
          Publicar marca
        </button>
      </div>

      {message ? <p>{message}</p> : null}
      {error ? <p className="error">{error}</p> : null}
    </section>
  );
}
