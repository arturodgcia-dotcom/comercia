import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../app/AuthContext";
import { PageHeader } from "../components/PageHeader";
import {
  BrandChannelSettings,
  BrandEcommerceData,
  BrandGeneratedContent,
  BrandIdentityData,
  BrandLandingDraft,
  BrandPosSetupData,
  BrandSetupStepState,
  BrandSetupWorkflow,
} from "../types/domain";
import { api } from "../services/api";

const STEP_CODES = [
  "brand_identity",
  "base_content",
  "landing_setup",
  "ecommerce_setup",
  "pos_setup",
  "final_review",
] as const;

const STEP_LABELS: Record<(typeof STEP_CODES)[number], string> = {
  brand_identity: "Identidad de marca",
  base_content: "Contenido base (prompt + IA)",
  landing_setup: "Landing",
  ecommerce_setup: "Ecommerce",
  pos_setup: "POS / WebApp",
  final_review: "Revision y publicacion",
};

const defaultIdentity: BrandIdentityData = {
  brand_name: "",
  business_description: "",
  business_type: "mixed",
  primary_color: "#0447A6",
  secondary_color: "#DCE8FB",
  brand_tone: "profesional",
  logo_asset_id: null,
  base_image_asset_ids: [],
};

const defaultGenerated: BrandGeneratedContent = {
  prompt_master: "",
  value_proposition: "",
  communication_tone: "profesional",
  suggested_sections: [],
  base_copy: "",
};

const defaultLanding: BrandLandingDraft = {
  hero_title: "",
  hero_subtitle: "",
  cta_primary: "Solicitar diagnostico",
  cta_secondary: "Hablar con un asesor",
  sections: [
    { title: "Seccion 1", body: "" },
    { title: "Seccion 2", body: "" },
    { title: "Seccion 3", body: "" },
  ],
  contact_cta: "",
};

const defaultEcommerce: BrandEcommerceData = {
  catalog_mode: "manual",
  categories_ready: false,
  products_ready: false,
  massive_upload_enabled: false,
  notes: "",
};

const defaultPosSetup: BrandPosSetupData = {
  pos_enabled: true,
  payment_methods: ["efectivo", "mercado_pago_qr"],
  qr_enabled: true,
  payment_link_enabled: true,
  notes: "",
};

export function BrandSetupWizard() {
  const { token } = useAuth();
  const { tenantId } = useParams();
  const tenantNumericId = Number(tenantId);
  const [workflow, setWorkflow] = useState<BrandSetupWorkflow | null>(null);
  const [channelSettings, setChannelSettings] = useState<BrandChannelSettings | null>(null);
  const [identity, setIdentity] = useState<BrandIdentityData>(defaultIdentity);
  const [generated, setGenerated] = useState<BrandGeneratedContent>(defaultGenerated);
  const [landingDraft, setLandingDraft] = useState<BrandLandingDraft>(defaultLanding);
  const [ecommerceData, setEcommerceData] = useState<BrandEcommerceData>(defaultEcommerce);
  const [posSetupData, setPosSetupData] = useState<BrandPosSetupData>(defaultPosSetup);
  const [selectedStep, setSelectedStep] = useState<(typeof STEP_CODES)[number]>("brand_identity");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const load = async () => {
    if (!token || Number.isNaN(tenantNumericId)) return;
    setLoading(true);
    try {
      setError("");
      const [workflowData, channelData] = await Promise.all([
        api.getBrandSetupWorkflow(token, tenantNumericId),
        api.getBrandChannelSettings(token, tenantNumericId),
      ]);
      setWorkflow(workflowData);
      setChannelSettings(channelData);
      setIdentity(workflowData.identity_data ?? { ...defaultIdentity, brand_name: workflowData.tenant_name });
      setGenerated(workflowData.generated_content ?? defaultGenerated);
      setLandingDraft(workflowData.landing_draft ?? defaultLanding);
      setEcommerceData(workflowData.ecommerce_data ?? defaultEcommerce);
      setPosSetupData(workflowData.pos_setup_data ?? defaultPosSetup);
      setSelectedStep((workflowData.current_step as (typeof STEP_CODES)[number]) ?? "brand_identity");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No fue posible cargar el wizard.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, tenantNumericId]);

  const stepIndexMap = useMemo(
    () => Object.fromEntries(STEP_CODES.map((code, index) => [code, index])) as Record<string, number>,
    []
  );

  const firstPendingIndex = useMemo(() => {
    if (!workflow) return 0;
    const idx = workflow.steps.findIndex((step) => !step.approved);
    return idx === -1 ? STEP_CODES.length - 1 : idx;
  }, [workflow]);

  const completion = useMemo(() => {
    if (!workflow || workflow.steps.length === 0) return 0;
    const approvedCount = workflow.steps.filter((step) => step.approved).length;
    return Math.round((approvedCount / workflow.steps.length) * 100);
  }, [workflow]);

  const isLocked = (code: (typeof STEP_CODES)[number]) => {
    const index = stepIndexMap[code];
    return index > firstPendingIndex;
  };

  const setStep = (code: (typeof STEP_CODES)[number]) => {
    if (!isLocked(code)) {
      setSelectedStep(code);
    }
  };

  const uploadAsset = async (event: ChangeEvent<HTMLInputElement>, assetType: "logo" | "base_image") => {
    if (!token || !workflow) return;
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      setSaving(true);
      const uploaded = await api.uploadBrandAsset(token, workflow.tenant_id, "brand_identity", assetType, file);
      setWorkflow((prev) => (prev ? { ...prev, assets: [...prev.assets, uploaded] } : prev));
      if (assetType === "logo") {
        setIdentity((prev) => ({ ...prev, logo_asset_id: uploaded.id }));
      } else {
        setIdentity((prev) => ({ ...prev, base_image_asset_ids: [...prev.base_image_asset_ids, uploaded.id] }));
      }
      setMessage(`Archivo cargado: ${uploaded.file_name}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No fue posible cargar el archivo.");
    } finally {
      setSaving(false);
      event.target.value = "";
    }
  };

  const approveCurrentStep = async (code: (typeof STEP_CODES)[number], customMessage: string) => {
    if (!token || !workflow) return;
    const approved = await api.approveBrandSetupStep(token, workflow.tenant_id, code);
    setWorkflow(approved);
    setSelectedStep((approved.current_step as (typeof STEP_CODES)[number]) ?? code);
    setMessage(customMessage);
  };

  const saveIdentityAndContinue = async (event: FormEvent) => {
    event.preventDefault();
    if (!token || !workflow) return;
    if (
      !identity.brand_name.trim() ||
      !identity.business_description.trim() ||
      !identity.brand_tone.trim() ||
      !identity.primary_color ||
      !identity.secondary_color
    ) {
      setError("Completa los campos obligatorios de identidad antes de continuar.");
      return;
    }
    try {
      setSaving(true);
      setError("");
      const updated = await api.updateBrandSetupWorkflow(token, workflow.tenant_id, { identity_data: identity });
      setWorkflow(updated);
      await approveCurrentStep("brand_identity", "Identidad aprobada. Continuamos al paso 2.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No fue posible guardar identidad.");
    } finally {
      setSaving(false);
    }
  };

  const generateContent = async () => {
    if (!token || !workflow) return;
    if (!generated.prompt_master.trim()) {
      setError("Escribe el prompt del negocio para generar la propuesta.");
      return;
    }
    try {
      setSaving(true);
      setError("");
      const updated = await api.generateBrandSetupContent(token, workflow.tenant_id, generated.prompt_master);
      setWorkflow(updated);
      setGenerated(updated.generated_content ?? generated);
      setMessage("Propuesta de contenido generada. Revísala y aprueba para continuar.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No fue posible generar contenido.");
    } finally {
      setSaving(false);
    }
  };

  const approveContentAndContinue = async () => {
    if (!token || !workflow) return;
    if (!generated.value_proposition.trim() || !generated.base_copy.trim()) {
      setError("Completa la propuesta de valor y el copy base antes de aprobar.");
      return;
    }
    try {
      setSaving(true);
      setError("");
      const updated = await api.updateBrandSetupWorkflow(token, workflow.tenant_id, {
        prompt_master: generated.prompt_master,
        generated_content: generated,
      });
      setWorkflow(updated);
      await approveCurrentStep("base_content", "Contenido base aprobado. Continuamos al paso 3.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No fue posible aprobar contenido.");
    } finally {
      setSaving(false);
    }
  };

  const generateLanding = async (regenerate = false) => {
    if (!token || !workflow) return;
    try {
      setSaving(true);
      setError("");
      const updated = await api.generateBrandSetupLanding(token, workflow.tenant_id, regenerate);
      setWorkflow(updated);
      setLandingDraft(updated.landing_draft ?? defaultLanding);
      setMessage(regenerate ? "Landing regenerada." : "Landing generada. Revisa y aprueba.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No fue posible generar landing.");
    } finally {
      setSaving(false);
    }
  };

  const approveLandingAndContinue = async () => {
    if (!token || !workflow) return;
    if (!landingDraft.hero_title.trim() || !landingDraft.hero_subtitle.trim() || !landingDraft.contact_cta.trim()) {
      setError("Completa hero y CTA de contacto antes de aprobar.");
      return;
    }
    try {
      setSaving(true);
      setError("");
      const updated = await api.updateBrandSetupWorkflow(token, workflow.tenant_id, {
        landing_draft: landingDraft,
      });
      setWorkflow(updated);
      await approveCurrentStep("landing_setup", "Landing aprobada. Continuamos al paso 4.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No fue posible aprobar landing.");
    } finally {
      setSaving(false);
    }
  };

  const saveEcommerceAndContinue = async () => {
    if (!token || !workflow) return;
    if (!ecommerceData.categories_ready || !ecommerceData.products_ready) {
      setError("Marca categorías y productos listos antes de continuar.");
      return;
    }
    try {
      setSaving(true);
      setError("");
      const updated = await api.updateBrandSetupWorkflow(token, workflow.tenant_id, {
        ecommerce_data: ecommerceData,
      });
      setWorkflow(updated);
      await approveCurrentStep("ecommerce_setup", "Ecommerce aprobado. Continuamos al paso 5.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No fue posible guardar configuración ecommerce.");
    } finally {
      setSaving(false);
    }
  };

  const savePosAndContinue = async () => {
    if (!token || !workflow || !channelSettings) return;
    if (!posSetupData.payment_methods.length) {
      setError("Selecciona al menos un método de pago POS.");
      return;
    }
    try {
      setSaving(true);
      setError("");
      await api.updateBrandChannelSettings(token, workflow.tenant_id, channelSettings);
      const updated = await api.updateBrandSetupWorkflow(token, workflow.tenant_id, {
        pos_setup_data: posSetupData,
      });
      setWorkflow(updated);
      await approveCurrentStep("pos_setup", "POS/WebApp aprobado. Continuamos a revisión final.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No fue posible guardar POS/WebApp.");
    } finally {
      setSaving(false);
    }
  };

  const publishBrand = async () => {
    if (!token || !workflow) return;
    const previousReady = workflow.steps
      .filter((step) => step.code !== "final_review")
      .every((step) => step.approved);
    if (!previousReady) {
      setError("Debes aprobar todos los pasos antes de publicar.");
      return;
    }
    try {
      setSaving(true);
      setError("");
      const approvedFinal = await api.approveBrandSetupStep(token, workflow.tenant_id, "final_review");
      const published = await api.updateBrandSetupWorkflow(token, workflow.tenant_id, {
        is_published: true,
        current_step: "final_review",
      });
      setWorkflow({ ...published, steps: approvedFinal.steps });
      setMessage("Marca publicada correctamente.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No fue posible publicar la marca.");
    } finally {
      setSaving(false);
    }
  };

  if (loading || !workflow || !channelSettings) {
    return <p>Cargando wizard de setup...</p>;
  }

  const step = workflow.steps.find((row) => row.code === selectedStep);

  return (
    <section>
      <PageHeader
        title={`Wizard de setup: ${workflow.tenant_name}`}
        subtitle="Flujo secuencial tipo SaaS para construir, revisar y publicar la marca."
      />

      <article className="card">
        <div className="row-gap" style={{ justifyContent: "space-between" }}>
          <p>Progreso: {completion}%</p>
          <p>
            Paso {stepIndexMap[selectedStep] + 1} de {STEP_CODES.length}
          </p>
        </div>
        <div className="row-gap">
          {STEP_CODES.map((code) => (
            <button
              key={code}
              type="button"
              className={isLocked(code) ? "button button-outline" : code === selectedStep ? "button" : "button button-outline"}
              onClick={() => setStep(code)}
              disabled={isLocked(code)}
            >
              {stepIndexMap[code] + 1}. {STEP_LABELS[code]}
            </button>
          ))}
        </div>
      </article>

      {selectedStep === "brand_identity" ? (
        <form className="card" onSubmit={saveIdentityAndContinue}>
          <h3>Step 1: Identidad de marca</h3>
          <label>
            Nombre de marca
            <input value={identity.brand_name} onChange={(event) => setIdentity((prev) => ({ ...prev, brand_name: event.target.value }))} required />
          </label>
          <label>
            Descripción del negocio
            <textarea value={identity.business_description} onChange={(event) => setIdentity((prev) => ({ ...prev, business_description: event.target.value }))} required />
          </label>
          <label>
            Tipo de negocio
            <select value={identity.business_type} onChange={(event) => setIdentity((prev) => ({ ...prev, business_type: event.target.value }))}>
              <option value="services">Servicios</option>
              <option value="products">Productos</option>
              <option value="mixed">Mixto</option>
            </select>
          </label>
          <label>
            Color principal
            <input type="color" value={identity.primary_color} onChange={(event) => setIdentity((prev) => ({ ...prev, primary_color: event.target.value }))} />
          </label>
          <label>
            Color secundario
            <input type="color" value={identity.secondary_color} onChange={(event) => setIdentity((prev) => ({ ...prev, secondary_color: event.target.value }))} />
          </label>
          <label>
            Tono de marca
            <select value={identity.brand_tone} onChange={(event) => setIdentity((prev) => ({ ...prev, brand_tone: event.target.value }))}>
              <option value="profesional">Profesional</option>
              <option value="cercano">Cercano</option>
              <option value="premium">Premium</option>
              <option value="tecnico">Tecnico</option>
            </select>
          </label>
          <label>
            Logo
            <input type="file" accept="image/*" onChange={(event) => uploadAsset(event, "logo")} />
          </label>
          <label>
            Imágenes base (opcional)
            <input type="file" accept="image/*" onChange={(event) => uploadAsset(event, "base_image")} />
          </label>
          <p className="muted">Logo cargado: {identity.logo_asset_id ? "Si" : "No"} | Imágenes base: {identity.base_image_asset_ids.length}</p>
          <button className="button" type="submit" disabled={saving}>
            Guardar y continuar
          </button>
        </form>
      ) : null}

      {selectedStep === "base_content" ? (
        <article className="card">
          <h3>Step 2: Contenido base (prompt + IA)</h3>
          <label>
            Prompt de negocio (obligatorio)
            <textarea
              value={generated.prompt_master}
              onChange={(event) => setGenerated((prev) => ({ ...prev, prompt_master: event.target.value }))}
            />
          </label>
          <div className="row-gap">
            <button className="button" type="button" onClick={generateContent} disabled={saving}>
              Generar propuesta de marca
            </button>
          </div>
          <label>
            Propuesta de valor
            <textarea value={generated.value_proposition} onChange={(event) => setGenerated((prev) => ({ ...prev, value_proposition: event.target.value }))} />
          </label>
          <label>
            Tono de comunicación
            <input value={generated.communication_tone} onChange={(event) => setGenerated((prev) => ({ ...prev, communication_tone: event.target.value }))} />
          </label>
          <label>
            Copy base
            <textarea value={generated.base_copy} onChange={(event) => setGenerated((prev) => ({ ...prev, base_copy: event.target.value }))} />
          </label>
          <label>
            Secciones sugeridas (una por línea)
            <textarea
              value={generated.suggested_sections.join("\n")}
              onChange={(event) =>
                setGenerated((prev) => ({
                  ...prev,
                  suggested_sections: event.target.value
                    .split("\n")
                    .map((line) => line.trim())
                    .filter(Boolean),
                }))
              }
            />
          </label>
          <button className="button" type="button" onClick={approveContentAndContinue} disabled={saving}>
            Aprobar y continuar
          </button>
        </article>
      ) : null}

      {selectedStep === "landing_setup" ? (
        <article className="card">
          <h3>Step 3: Landing</h3>
          <div className="row-gap">
            <button className="button" type="button" onClick={() => generateLanding(false)} disabled={saving}>
              Generar landing
            </button>
            <button className="button button-outline" type="button" onClick={() => generateLanding(true)} disabled={saving}>
              Regenerar landing
            </button>
          </div>
          <section className="marketing-hero" style={{ marginTop: "12px" }}>
            <input className="input-inline" value={landingDraft.hero_title} onChange={(event) => setLandingDraft((prev) => ({ ...prev, hero_title: event.target.value }))} />
            <textarea className="input-inline" value={landingDraft.hero_subtitle} onChange={(event) => setLandingDraft((prev) => ({ ...prev, hero_subtitle: event.target.value }))} />
          </section>
          <div className="card-grid">
            {landingDraft.sections.map((section, index) => (
              <article key={`${section.title}-${index}`} className="card marketing-card">
                <input value={section.title} onChange={(event) => {
                  const next = [...landingDraft.sections];
                  next[index] = { ...next[index], title: event.target.value };
                  setLandingDraft((prev) => ({ ...prev, sections: next }));
                }} />
                <textarea value={section.body} onChange={(event) => {
                  const next = [...landingDraft.sections];
                  next[index] = { ...next[index], body: event.target.value };
                  setLandingDraft((prev) => ({ ...prev, sections: next }));
                }} />
              </article>
            ))}
          </div>
          <label>
            CTA de contacto final
            <input value={landingDraft.contact_cta} onChange={(event) => setLandingDraft((prev) => ({ ...prev, contact_cta: event.target.value }))} />
          </label>
          <div className="row-gap">
            <Link className="button button-outline" to={`/store/${workflow.tenant_slug}`}>Ver preview web</Link>
            <button className="button" type="button" onClick={approveLandingAndContinue} disabled={saving}>
              Aprobar y continuar
            </button>
          </div>
        </article>
      ) : null}

      {selectedStep === "ecommerce_setup" ? (
        <article className="card">
          <h3>Step 4: Ecommerce</h3>
          <label>
            Modo de carga
            <select value={ecommerceData.catalog_mode} onChange={(event) => setEcommerceData((prev) => ({ ...prev, catalog_mode: event.target.value }))}>
              <option value="manual">Manual</option>
              <option value="bulk">Carga masiva</option>
            </select>
          </label>
          <label className="checkbox">
            <input type="checkbox" checked={ecommerceData.categories_ready} onChange={(event) => setEcommerceData((prev) => ({ ...prev, categories_ready: event.target.checked }))} />
            Categorías configuradas
          </label>
          <label className="checkbox">
            <input type="checkbox" checked={ecommerceData.products_ready} onChange={(event) => setEcommerceData((prev) => ({ ...prev, products_ready: event.target.checked }))} />
            Productos/servicios cargados
          </label>
          <label className="checkbox">
            <input type="checkbox" checked={ecommerceData.massive_upload_enabled} onChange={(event) => setEcommerceData((prev) => ({ ...prev, massive_upload_enabled: event.target.checked }))} />
            Habilitar carga masiva
          </label>
          <label>
            Notas
            <textarea value={ecommerceData.notes ?? ""} onChange={(event) => setEcommerceData((prev) => ({ ...prev, notes: event.target.value }))} />
          </label>
          <div className="row-gap">
            <Link className="button button-outline" to="/products">Ir a productos</Link>
            <Link className="button button-outline" to="/categories">Ir a categorias</Link>
            <Link className="button button-outline" to="/admin/catalog/bulk-upload">Ir a carga masiva</Link>
            <button className="button" type="button" onClick={saveEcommerceAndContinue} disabled={saving}>
              Guardar y continuar
            </button>
          </div>
        </article>
      ) : null}

      {selectedStep === "pos_setup" ? (
        <article className="card">
          <h3>Step 5: POS / WebApp</h3>
          <label className="checkbox">
            <input type="checkbox" checked={posSetupData.pos_enabled} onChange={(event) => setPosSetupData((prev) => ({ ...prev, pos_enabled: event.target.checked }))} />
            POS habilitado
          </label>
          <p>Métodos de pago</p>
          {["efectivo", "transferencia", "mercado_pago_qr", "mercado_pago_link"].map((method) => (
            <label key={method} className="checkbox">
              <input
                type="checkbox"
                checked={posSetupData.payment_methods.includes(method)}
                onChange={(event) =>
                  setPosSetupData((prev) => ({
                    ...prev,
                    payment_methods: event.target.checked
                      ? [...prev.payment_methods, method]
                      : prev.payment_methods.filter((value) => value !== method),
                  }))
                }
              />
              {method}
            </label>
          ))}
          <label className="checkbox">
            <input type="checkbox" checked={posSetupData.qr_enabled} onChange={(event) => setPosSetupData((prev) => ({ ...prev, qr_enabled: event.target.checked }))} />
            Cobro por QR
          </label>
          <label className="checkbox">
            <input type="checkbox" checked={posSetupData.payment_link_enabled} onChange={(event) => setPosSetupData((prev) => ({ ...prev, payment_link_enabled: event.target.checked }))} />
            Cobro por link
          </label>
          <label className="checkbox">
            <input
              type="checkbox"
              checked={channelSettings.mercadopago_enabled}
              onChange={(event) => setChannelSettings((prev) => (prev ? { ...prev, mercadopago_enabled: event.target.checked } : prev))}
            />
            Mercado Pago activo para POS
          </label>
          <label>
            Notas POS
            <textarea value={posSetupData.notes ?? ""} onChange={(event) => setPosSetupData((prev) => ({ ...prev, notes: event.target.value }))} />
          </label>
          <div className="row-gap">
            <Link className="button button-outline" to="/pos">Abrir POS</Link>
            <Link className="button button-outline" to="/admin/settings/payments/mercadopago">Configurar Mercado Pago</Link>
            <button className="button" type="button" onClick={savePosAndContinue} disabled={saving}>
              Guardar y continuar
            </button>
          </div>
        </article>
      ) : null}

      {selectedStep === "final_review" ? (
        <article className="card">
          <h3>Step 6: Revisión y publicación</h3>
          <ul className="marketing-list">
            {workflow.steps.map((row) => (
              <li key={row.code}>
                {STEP_LABELS[row.code as (typeof STEP_CODES)[number]] ?? row.code}: {row.approved ? "✔" : "Pendiente"}
              </li>
            ))}
          </ul>
          <div className="row-gap">
            <Link className="button button-outline" to={`/store/${workflow.tenant_slug}`}>
              Preview final
            </Link>
            <button className="button" type="button" onClick={publishBrand} disabled={saving}>
              Publicar marca
            </button>
          </div>
        </article>
      ) : null}

      <article className="card">
        <h3>Estado del paso actual</h3>
        <p>Paso: {STEP_LABELS[selectedStep]}</p>
        <p>Status: {step?.status ?? "pending"}</p>
        <p>Aprobado: {step?.approved ? "Si" : "No"}</p>
      </article>

      {message ? <p>{message}</p> : null}
      {error ? <p className="error">{error}</p> : null}
    </section>
  );
}
