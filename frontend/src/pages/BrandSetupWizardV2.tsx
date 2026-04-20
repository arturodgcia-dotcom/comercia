import { FormEvent, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../app/AuthContext";
import { PageHeader } from "../components/PageHeader";
import { ApiError, api } from "../services/api";
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
import { FamilyPreview } from "../wizard-v2/components/FamilyPreview";
import { getWizardV2FamilyRegistry } from "../wizard-v2/familyRegistry";
import { normalizeWizardV2Model, resolveWizardV2Templates } from "../wizard-v2/familyResolver";
import { WizardV2FamilyId, WizardV2ResolveInput, WizardV2Sector, WizardV2Style } from "../wizard-v2/types";

type StepCode =
  | "brand_identity"
  | "sector_selection"
  | "business_goal"
  | "visual_style"
  | "landing_setup"
  | "ecommerce_setup"
  | "distributors_setup"
  | "pos_setup"
  | "final_review";

const STEP_ORDER: StepCode[] = [
  "brand_identity",
  "sector_selection",
  "business_goal",
  "visual_style",
  "landing_setup",
  "ecommerce_setup",
  "distributors_setup",
  "pos_setup",
  "final_review",
];

const STEP_LABEL: Record<StepCode, string> = {
  brand_identity: "Identidad / marca",
  sector_selection: "Giro / sector",
  business_goal: "Objetivo comercial",
  visual_style: "Estilo visual",
  landing_setup: "Landing",
  ecommerce_setup: "Ecommerce publico",
  distributors_setup: "Ecommerce distribuidores",
  pos_setup: "WebApp / POS",
  final_review: "Revision final",
};

const defaultIdentity: BrandIdentityData = {
  brand_name: "",
  business_description: "",
  business_type: "mixed",
  sector: "retail",
  visual_style: "impacto",
  business_goal: "conversion",
  has_existing_landing: false,
  existing_landing_url: "",
  primary_color: "#213B7E",
  secondary_color: "#D9E4FF",
  brand_tone: "premium",
  logo_asset_id: null,
  base_image_asset_ids: [],
};

const defaultGenerated: BrandGeneratedContent = {
  prompt_master: "",
  value_proposition: "",
  communication_tone: "premium",
  suggested_sections: [],
  base_copy: "",
};

const defaultLanding: BrandLandingDraft = {
  hero_title: "",
  hero_subtitle: "",
  cta_primary: "Solicitar propuesta",
  cta_secondary: "Hablar con asesor",
  sections: [
    { title: "Propuesta de valor", body: "" },
    { title: "Diferenciadores", body: "" },
    { title: "Prueba social", body: "" },
  ],
  contact_cta: "",
  seo_title: "",
  seo_description: "",
  faq_items: ["", "", ""],
  quick_answer_blocks: ["", "", ""],
  schema_type: "LocalBusiness",
};

const defaultEcommerce: BrandEcommerceData = {
  catalog_mode: "manual",
  categories_ready: false,
  products_ready: false,
  distributor_catalog_ready: false,
  volume_rules_ready: false,
  recurring_orders_ready: false,
  massive_upload_enabled: false,
  notes: "",
};

const defaultPos: BrandPosSetupData = {
  pos_enabled: true,
  payment_methods: ["efectivo", "mercado_pago_qr"],
  qr_enabled: true,
  payment_link_enabled: true,
  notes: "",
};

function isStepCode(value: string): value is StepCode {
  return STEP_ORDER.includes(value as StepCode);
}

function uiError(error: unknown, fallback: string): string {
  if (error instanceof ApiError) return `${fallback} ${error.message}`;
  if (error instanceof Error) return `${fallback} ${error.message}`;
  return fallback;
}

function normalizeSector(value?: string | null): WizardV2Sector {
  const raw = String(value ?? "").trim().toLowerCase();
  const allowed: WizardV2Sector[] = ["alimentos", "ropa", "servicios", "maquinaria", "salud", "belleza", "educacion", "retail"];
  if (allowed.includes(raw as WizardV2Sector)) return raw as WizardV2Sector;
  return "retail";
}

function normalizeStyle(value?: string | null): WizardV2Style {
  const raw = String(value ?? "").trim().toLowerCase();
  if (raw === "impacto" || raw === "editorial" || raw === "minimal") return raw;
  return "impacto";
}

export function BrandSetupWizardV2() {
  const { token } = useAuth();
  const { tenantId } = useParams();
  const tenantNumericId = Number(tenantId);

  const [workflow, setWorkflow] = useState<BrandSetupWorkflow | null>(null);
  const [channelSettings, setChannelSettings] = useState<BrandChannelSettings | null>(null);
  const [identity, setIdentity] = useState<BrandIdentityData>(defaultIdentity);
  const [generated, setGenerated] = useState<BrandGeneratedContent>(defaultGenerated);
  const [landingDraft, setLandingDraft] = useState<BrandLandingDraft>(defaultLanding);
  const [ecommerceData, setEcommerceData] = useState<BrandEcommerceData>(defaultEcommerce);
  const [posSetupData, setPosSetupData] = useState<BrandPosSetupData>(defaultPos);
  const [selectedStep, setSelectedStep] = useState<StepCode>("brand_identity");
  const [selectedFamilyId, setSelectedFamilyId] = useState<WizardV2FamilyId | null>(null);
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
      setPosSetupData(workflowData.pos_setup_data ?? defaultPos);
      setSelectedFamilyId(null);
      if (isStepCode(workflowData.current_step)) setSelectedStep(workflowData.current_step);
    } catch (err) {
      setError(uiError(err, "No fue posible cargar wizard v2."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, tenantNumericId]);

  const businessModel = normalizeWizardV2Model(workflow?.billing_model);
  const resolverInput: WizardV2ResolveInput = useMemo(
    () => ({
      sector: normalizeSector(identity.sector),
      style: normalizeStyle(identity.visual_style),
      business_goal: String(identity.business_goal ?? "conversion"),
      business_model: businessModel,
      preferred_family_id: selectedFamilyId,
    }),
    [identity.business_goal, identity.sector, identity.visual_style, businessModel, selectedFamilyId]
  );
  const resolved = useMemo(() => resolveWizardV2Templates(resolverInput), [resolverInput]);
  const families = useMemo(() => getWizardV2FamilyRegistry(businessModel), [businessModel]);

  const steps = useMemo(
    () => (workflow?.steps ?? []).filter((step) => isStepCode(step.code)) as BrandSetupStepState[],
    [workflow?.steps]
  );
  const activeCodes = useMemo(() => steps.map((step) => step.code as StepCode), [steps]);
  const firstPendingIndex = useMemo(() => {
    const idx = steps.findIndex((row) => !row.approved);
    return idx === -1 ? Math.max(steps.length - 1, 0) : idx;
  }, [steps]);
  const completion = useMemo(() => {
    if (!steps.length) return 0;
    return Math.round((steps.filter((row) => row.approved).length / steps.length) * 100);
  }, [steps]);

  const isLocked = (code: StepCode) => {
    const index = activeCodes.indexOf(code);
    if (index < 0) return true;
    return index > firstPendingIndex;
  };

  const saveAndApproveStep = async (step: StepCode, payload: Record<string, unknown> = {}) => {
    if (!token || !workflow) return;
    setSaving(true);
    try {
      setError("");
      const updated = await api.updateBrandSetupWorkflow(token, workflow.tenant_id, {
        identity_data: identity,
        generated_content: generated,
        landing_draft: landingDraft,
        ecommerce_data: ecommerceData,
        pos_setup_data: posSetupData,
        landing_template: resolved.landing_template,
        public_store_template: resolved.public_store_template,
        distributor_store_template: resolved.distributor_store_template,
        webapp_template: resolved.webapp_template,
        ...payload,
      });
      setWorkflow(updated);
      const approved = await api.approveBrandSetupStep(token, workflow.tenant_id, step);
      setWorkflow(approved);
      if (isStepCode(approved.current_step)) setSelectedStep(approved.current_step);
      setMessage(`${STEP_LABEL[step]} aprobado en Wizard v2.`);
    } catch (err) {
      setError(uiError(err, `No fue posible guardar ${STEP_LABEL[step]}.`));
    } finally {
      setSaving(false);
    }
  };

  const saveIdentity = async (event: FormEvent) => {
    event.preventDefault();
    if (!identity.brand_name.trim() || !identity.business_description.trim()) {
      setError("Captura nombre y descripcion de marca.");
      return;
    }
    if (!generated.prompt_master.trim()) {
      setError("Captura prompt maestro del negocio.");
      return;
    }
    await saveAndApproveStep("brand_identity");
  };

  const saveLanding = async (event: FormEvent) => {
    event.preventDefault();
    if (!landingDraft.hero_title.trim() || !landingDraft.seo_title.trim() || !landingDraft.seo_description.trim()) {
      setError("Completa hero, SEO title y SEO description.");
      return;
    }
    if (landingDraft.faq_items.some((item) => !item.trim()) || landingDraft.quick_answer_blocks.some((item) => !item.trim())) {
      setError("Completa FAQ y bloques de respuesta AEO.");
      return;
    }
    await saveAndApproveStep("landing_setup");
  };

  const publish = async () => {
    if (!token || !workflow) return;
    setSaving(true);
    try {
      setError("");
      const approved = await api.approveBrandSetupStep(token, workflow.tenant_id, "final_review");
      const published = await api.updateBrandSetupWorkflow(token, workflow.tenant_id, {
        is_published: true,
        current_step: "final_review",
        landing_template: resolved.landing_template,
        public_store_template: resolved.public_store_template,
        distributor_store_template: resolved.distributor_store_template,
        webapp_template: resolved.webapp_template,
      });
      setWorkflow({ ...published, steps: approved.steps });
      setMessage("Marca publicada con Wizard v2.");
    } catch (err) {
      setError(uiError(err, "No fue posible publicar."));
    } finally {
      setSaving(false);
    }
  };

  if (loading || !workflow || !channelSettings) return <p>Cargando Wizard v2...</p>;

  return (
    <section>
      <PageHeader
        title={`Wizard v2 premium: ${workflow.tenant_name}`}
        subtitle="Motor nuevo por familias premium reales, resolver sectorial y templates por canal persistidos."
      />

      <article className="card">
        <p>Progreso: {completion}%</p>
        <p>
          Familia resuelta: <strong>{resolved.family.label}</strong> ({businessModel === "commission_based" ? "Con comision" : "Sin comision"})
        </p>
        <div className="row-gap">
          {activeCodes.map((code, index) => (
            <button
              key={code}
              type="button"
              className={selectedStep === code ? "button" : "button button-outline"}
              disabled={isLocked(code)}
              onClick={() => setSelectedStep(code)}
            >
              {index + 1}. {STEP_LABEL[code]}
            </button>
          ))}
        </div>
      </article>

      {selectedStep === "brand_identity" ? (
        <form className="card" onSubmit={saveIdentity}>
          <h3>{STEP_LABEL.brand_identity}</h3>
          <label>Nombre de marca<input value={identity.brand_name} onChange={(e) => setIdentity((p) => ({ ...p, brand_name: e.target.value }))} /></label>
          <label>Descripcion<textarea value={identity.business_description} onChange={(e) => setIdentity((p) => ({ ...p, business_description: e.target.value }))} /></label>
          <label>Prompt maestro<textarea value={generated.prompt_master} onChange={(e) => setGenerated((p) => ({ ...p, prompt_master: e.target.value }))} /></label>
          <button className="button" type="submit" disabled={saving}>Guardar y aprobar</button>
        </form>
      ) : null}

      {selectedStep === "sector_selection" ? (
        <article className="card">
          <h3>{STEP_LABEL.sector_selection}</h3>
          <label>
            Sector
            <select value={identity.sector ?? "retail"} onChange={(e) => setIdentity((p) => ({ ...p, sector: e.target.value }))}>
              <option value="alimentos">Alimentos</option>
              <option value="ropa">Ropa</option>
              <option value="servicios">Servicios</option>
              <option value="maquinaria">Maquinaria</option>
              <option value="salud">Salud</option>
              <option value="belleza">Belleza</option>
              <option value="educacion">Educacion</option>
              <option value="retail">Retail</option>
            </select>
          </label>
          <div className="card-grid">
            {(families.filter((item) => item.sector === normalizeSector(identity.sector)).length
              ? families.filter((item) => item.sector === normalizeSector(identity.sector))
              : families
            ).map((item) => (
                <article key={item.family_id} className="card">
                  <label className="checkbox">
                    <input
                      type="radio"
                      name="family_choice"
                      checked={selectedFamilyId === item.family_id}
                      onChange={() => setSelectedFamilyId(item.family_id)}
                    />
                    Seleccionar familia
                  </label>
                  <strong>{item.label}</strong>
                  <p>{item.description}</p>
                </article>
              ))}
          </div>
          <button className="button" type="button" disabled={saving} onClick={() => saveAndApproveStep("sector_selection")}>Guardar y aprobar</button>
        </article>
      ) : null}

      {selectedStep === "business_goal" ? (
        <article className="card">
          <h3>{STEP_LABEL.business_goal}</h3>
          <label>
            Objetivo
            <select value={identity.business_goal ?? "conversion"} onChange={(e) => setIdentity((p) => ({ ...p, business_goal: e.target.value }))}>
              <option value="conversion">Conversion</option>
              <option value="ticket_promedio">Subir ticket promedio</option>
              <option value="fidelizacion">Fidelizacion</option>
              <option value="expansion_b2b">Expansion B2B</option>
            </select>
          </label>
          <button className="button" type="button" disabled={saving} onClick={() => saveAndApproveStep("business_goal")}>Guardar y aprobar</button>
        </article>
      ) : null}

      {selectedStep === "visual_style" ? (
        <article className="card">
          <h3>{STEP_LABEL.visual_style}</h3>
          <label>
            Estilo visual
            <select value={identity.visual_style ?? "impacto"} onChange={(e) => setIdentity((p) => ({ ...p, visual_style: e.target.value }))}>
              <option value="impacto">Impacto</option>
              <option value="editorial">Editorial</option>
              <option value="minimal">Minimal</option>
            </select>
          </label>
          <label>
            Tono de marca
            <select value={identity.brand_tone} onChange={(e) => setIdentity((p) => ({ ...p, brand_tone: e.target.value }))}>
              <option value="premium">Premium</option>
              <option value="profesional">Profesional</option>
              <option value="tecnico">Tecnico</option>
            </select>
          </label>
          <button className="button" type="button" disabled={saving} onClick={() => saveAndApproveStep("visual_style")}>Guardar y aprobar</button>
        </article>
      ) : null}

      {selectedStep === "landing_setup" ? (
        <form className="card" onSubmit={saveLanding}>
          <h3>{STEP_LABEL.landing_setup}</h3>
          <FamilyPreview familyId={resolved.family.family_id} channel="landing" brandName={identity.brand_name || workflow.tenant_name} businessModel={businessModel} />
          <label>Hero title<input value={landingDraft.hero_title} onChange={(e) => setLandingDraft((p) => ({ ...p, hero_title: e.target.value }))} /></label>
          <label>Hero subtitle<textarea value={landingDraft.hero_subtitle} onChange={(e) => setLandingDraft((p) => ({ ...p, hero_subtitle: e.target.value }))} /></label>
          <label>SEO title<input value={landingDraft.seo_title} onChange={(e) => setLandingDraft((p) => ({ ...p, seo_title: e.target.value }))} /></label>
          <label>SEO description<textarea value={landingDraft.seo_description} onChange={(e) => setLandingDraft((p) => ({ ...p, seo_description: e.target.value }))} /></label>
          {landingDraft.faq_items.map((item, idx) => (
            <label key={`faq-${idx}`}>FAQ {idx + 1}<input value={item} onChange={(e) => setLandingDraft((p) => ({ ...p, faq_items: p.faq_items.map((row, i) => (i === idx ? e.target.value : row)) }))} /></label>
          ))}
          {landingDraft.quick_answer_blocks.map((item, idx) => (
            <label key={`aeo-${idx}`}>Bloque AEO {idx + 1}<input value={item} onChange={(e) => setLandingDraft((p) => ({ ...p, quick_answer_blocks: p.quick_answer_blocks.map((row, i) => (i === idx ? e.target.value : row)) }))} /></label>
          ))}
          <button className="button" type="submit" disabled={saving}>Guardar y aprobar</button>
        </form>
      ) : null}

      {selectedStep === "ecommerce_setup" ? (
        <article className="card">
          <h3>{STEP_LABEL.ecommerce_setup}</h3>
          <FamilyPreview familyId={resolved.family.family_id} channel="public_store" brandName={identity.brand_name || workflow.tenant_name} businessModel={businessModel} />
          <label className="checkbox"><input type="checkbox" checked={ecommerceData.categories_ready} onChange={(e) => setEcommerceData((p) => ({ ...p, categories_ready: e.target.checked }))} />Categorias listas</label>
          <label className="checkbox"><input type="checkbox" checked={ecommerceData.products_ready} onChange={(e) => setEcommerceData((p) => ({ ...p, products_ready: e.target.checked }))} />Productos listos</label>
          <button className="button" type="button" disabled={saving} onClick={() => saveAndApproveStep("ecommerce_setup")}>Guardar y aprobar</button>
        </article>
      ) : null}

      {selectedStep === "distributors_setup" ? (
        <article className="card">
          <h3>{STEP_LABEL.distributors_setup}</h3>
          <FamilyPreview familyId={resolved.family.family_id} channel="distributor_store" brandName={identity.brand_name || workflow.tenant_name} businessModel={businessModel} />
          <label className="checkbox"><input type="checkbox" checked={ecommerceData.distributor_catalog_ready} onChange={(e) => setEcommerceData((p) => ({ ...p, distributor_catalog_ready: e.target.checked }))} />Catalogo distribuidor listo</label>
          <label className="checkbox"><input type="checkbox" checked={ecommerceData.volume_rules_ready} onChange={(e) => setEcommerceData((p) => ({ ...p, volume_rules_ready: e.target.checked }))} />Reglas por volumen listas</label>
          <button className="button" type="button" disabled={saving} onClick={() => saveAndApproveStep("distributors_setup")}>Guardar y aprobar</button>
        </article>
      ) : null}

      {selectedStep === "pos_setup" ? (
        <article className="card">
          <h3>{STEP_LABEL.pos_setup}</h3>
          <FamilyPreview familyId={resolved.family.family_id} channel="webapp" brandName={identity.brand_name || workflow.tenant_name} businessModel={businessModel} />
          <label className="checkbox"><input type="checkbox" checked={posSetupData.pos_enabled} onChange={(e) => setPosSetupData((p) => ({ ...p, pos_enabled: e.target.checked }))} />POS habilitado</label>
          <label className="checkbox"><input type="checkbox" checked={posSetupData.qr_enabled} onChange={(e) => setPosSetupData((p) => ({ ...p, qr_enabled: e.target.checked }))} />Cobro QR habilitado</label>
          <button className="button" type="button" disabled={saving} onClick={() => saveAndApproveStep("pos_setup")}>Guardar y aprobar</button>
        </article>
      ) : null}

      {selectedStep === "final_review" ? (
        <article className="card">
          <h3>{STEP_LABEL.final_review}</h3>
          <p>Templates resueltos:</p>
          <ul className="marketing-list">
            <li>landing: {resolved.landing_template}</li>
            <li>publico: {resolved.public_store_template}</li>
            <li>distribuidores: {resolved.distributor_store_template}</li>
            <li>webapp: {resolved.webapp_template}</li>
          </ul>
          <div className="card-grid">
            <FamilyPreview familyId={resolved.family.family_id} channel="landing" brandName={identity.brand_name || workflow.tenant_name} businessModel={businessModel} />
            <FamilyPreview familyId={resolved.family.family_id} channel="public_store" brandName={identity.brand_name || workflow.tenant_name} businessModel={businessModel} />
            <FamilyPreview familyId={resolved.family.family_id} channel="distributor_store" brandName={identity.brand_name || workflow.tenant_name} businessModel={businessModel} />
            <FamilyPreview familyId={resolved.family.family_id} channel="webapp" brandName={identity.brand_name || workflow.tenant_name} businessModel={businessModel} />
          </div>
          <button className="button" type="button" disabled={saving} onClick={publish}>Aprobar final y publicar</button>
        </article>
      ) : null}

      <article className="card">
        <h3>Motor v2</h3>
        <p>Resolver real por sector: {resolverInput.sector}</p>
        <p>Familia premium activa: {resolved.family.family_id}</p>
        <p>Modelo comercial: {businessModel}</p>
      </article>

      {error ? <p className="error">{error}</p> : null}
      {message ? <p>{message}</p> : null}
    </section>
  );
}
