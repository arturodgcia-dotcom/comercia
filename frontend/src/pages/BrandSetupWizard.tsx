import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../app/AuthContext";
import { PageHeader } from "../components/PageHeader";
import { ApiError, api } from "../services/api";
import {
  OFFICIAL_DISTRIBUTOR_STORE_TEMPLATE,
  OFFICIAL_LANDING_TEMPLATE,
  OFFICIAL_PUBLIC_STORE_TEMPLATE,
} from "../branding/officialChannelTemplates";
import {
  BrandChannelSettings,
  BrandEcommerceData,
  BrandGeneratedContent,
  BrandIdentityData,
  BrandLandingDraft,
  BrandPosSetupData,
  BrandSetupAsset,
  BrandSetupStepState,
  BrandSetupWorkflow,
  CatalogImportErrorRow,
} from "../types/domain";


type StepCode =
  | "brand_identity"
  | "landing_setup"
  | "ecommerce_setup"
  | "distributors_setup"
  | "pos_setup"
  | "final_review";

const STEP_LABELS: Record<StepCode, string> = {
  brand_identity: "Identidad de marca",
  landing_setup: "Landing",
  ecommerce_setup: "Ecommerce publico",
  distributors_setup: "Ecommerce distribuidores",
  pos_setup: "POS / WebApp",
  final_review: "Revision y publicacion",
};

const defaultIdentity: BrandIdentityData = {
  brand_name: "",
  business_description: "",
  business_type: "mixed",
  has_existing_landing: false,
  existing_landing_url: "",
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
  cta_secondary: "Hablar con asesor",
  sections: [
    { title: "Bloque 1", body: "" },
    { title: "Bloque 2", body: "" },
    { title: "Bloque 3", body: "" },
  ],
  contact_cta: "",
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

const defaultPosSetup: BrandPosSetupData = {
  pos_enabled: true,
  payment_methods: ["efectivo", "mercado_pago_qr"],
  qr_enabled: true,
  payment_link_enabled: true,
  notes: "",
};

type ImportRow = Record<string, string>;

type BillingSetupData = {
  billing_model: "fixed_subscription" | "commission_based";
  commission_percentage: number;
  commission_enabled: boolean;
  commission_scope: string;
  commission_notes: string;
};

const REQUIRED_COLUMNS = [
  "nombre",
  "descripcion",
  "categoria",
  "sku",
  "precio_publico",
  "precio_menudeo",
  "precio_mayoreo",
  "stock_general",
  "visible_publico",
  "visible_distribuidor",
  "disponible_en_linea",
  "disponible_fisico",
  "minimo_menudeo",
  "minimo_mayoreo",
  "stripe_product_id",
  "stripe_price_id_publico",
  "stripe_price_id_menudeo",
  "stripe_price_id_mayoreo",
];

const OFFICIAL_CHANNEL_TEMPLATE_PAYLOAD = {
  landing_template: OFFICIAL_LANDING_TEMPLATE,
  public_store_template: OFFICIAL_PUBLIC_STORE_TEMPLATE,
  distributor_store_template: OFFICIAL_DISTRIBUTOR_STORE_TEMPLATE,
} as const;

const defaultBillingSetup: BillingSetupData = {
  billing_model: "fixed_subscription",
  commission_percentage: 3,
  commission_enabled: false,
  commission_scope: "ventas_online_pagadas",
  commission_notes: "",
};

function isStepCode(value: string): value is StepCode {
  return ["brand_identity", "landing_setup", "ecommerce_setup", "distributors_setup", "pos_setup", "final_review"].includes(value);
}

function toUiError(error: unknown, fallback: string): string {
  if (error instanceof ApiError) return `${fallback} ${error.message}`;
  if (error instanceof Error) return `${fallback} ${error.message}`;
  return fallback;
}

function toAssetUrl(fileUrl?: string | null): string | null {
  if (!fileUrl) return null;
  if (fileUrl.startsWith("http://") || fileUrl.startsWith("https://")) return fileUrl;
  return `${api.getBaseUrl()}${fileUrl}`;
}

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
  const [billingSetup, setBillingSetup] = useState<BillingSetupData>(defaultBillingSetup);

  const [selectedStep, setSelectedStep] = useState<StepCode>("brand_identity");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [csvRows, setCsvRows] = useState<ImportRow[]>([]);
  const [csvColumnErrors, setCsvColumnErrors] = useState<string[]>([]);
  const [csvRowErrors, setCsvRowErrors] = useState<Array<{ index: number; reason: string }>>([]);
  const [csvBackendErrors, setCsvBackendErrors] = useState<CatalogImportErrorRow[]>([]);
  const [csvImporting, setCsvImporting] = useState(false);

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
      setGenerated({ ...defaultGenerated, ...(workflowData.generated_content ?? {}), prompt_master: workflowData.prompt_master ?? workflowData.generated_content?.prompt_master ?? "" });
      setLandingDraft(workflowData.landing_draft ?? defaultLanding);
      const summary = workflowData.ecommerce_public_summary;
      setEcommerceData({
        ...defaultEcommerce,
        ...(workflowData.ecommerce_data ?? {}),
        categories_ready: summary ? summary.categories_count > 0 : (workflowData.ecommerce_data?.categories_ready ?? false),
        products_ready: summary ? summary.products_count + summary.services_count > 0 : (workflowData.ecommerce_data?.products_ready ?? false),
        massive_upload_enabled: summary ? summary.last_import_valid_rows > 0 : (workflowData.ecommerce_data?.massive_upload_enabled ?? false),
      });
      setPosSetupData(workflowData.pos_setup_data ?? defaultPosSetup);
      setBillingSetup({
        billing_model: workflowData.billing_model === "commission_based" ? "commission_based" : "fixed_subscription",
        commission_percentage: Number(workflowData.commission_percentage ?? defaultBillingSetup.commission_percentage),
        commission_enabled: Boolean(workflowData.commission_enabled ?? (workflowData.billing_model === "commission_based")),
        commission_scope: workflowData.commission_scope ?? defaultBillingSetup.commission_scope,
        commission_notes: workflowData.commission_notes ?? "",
      });

      const nextStep = workflowData.current_step;
      if (isStepCode(nextStep)) {
        setSelectedStep(nextStep);
      } else {
        const firstStep = workflowData.steps.find((step) => isStepCode(step.code));
        setSelectedStep(firstStep && isStepCode(firstStep.code) ? firstStep.code : "brand_identity");
      }
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

  const steps = useMemo(() => (workflow?.steps ?? []).filter((step) => isStepCode(step.code)) as BrandSetupStepState[], [workflow]);
  const activeCodes = useMemo(() => steps.map((step) => step.code as StepCode), [steps]);
  const selectedIndex = useMemo(() => activeCodes.findIndex((code) => code === selectedStep), [activeCodes, selectedStep]);
  const firstPendingIndex = useMemo(() => {
    const idx = steps.findIndex((step) => !step.approved);
    return idx === -1 ? Math.max(steps.length - 1, 0) : idx;
  }, [steps]);
  const completion = useMemo(() => {
    if (!steps.length) return 0;
    const approvedCount = steps.filter((step) => step.approved).length;
    return Math.round((approvedCount / steps.length) * 100);
  }, [steps]);
  const wizardAssets = workflow?.assets ?? [];
  const ecommerceSummary = workflow?.ecommerce_public_summary ?? null;

  const assetsById = useMemo(() => {
    const map = new Map<string, BrandSetupAsset>();
    for (const asset of wizardAssets) {
      map.set(asset.id, asset);
    }
    return map;
  }, [wizardAssets]);

  const logoAsset = useMemo(() => {
    if (!identity.logo_asset_id) return null;
    return assetsById.get(identity.logo_asset_id) ?? null;
  }, [assetsById, identity.logo_asset_id]);

  const baseImageAssets = useMemo(
    () => identity.base_image_asset_ids.map((assetId) => assetsById.get(assetId)).filter(Boolean) as BrandSetupAsset[],
    [assetsById, identity.base_image_asset_ids]
  );

  const isLocked = (code: StepCode) => {
    const index = activeCodes.findIndex((item) => item === code);
    if (index < 0) return true;
    return index > firstPendingIndex;
  };

  const stepStatus = (code: StepCode) => steps.find((step) => step.code === code);

  const selectStep = (code: StepCode) => {
    if (!isLocked(code)) {
      setSelectedStep(code);
    }
  };

  const approveStep = async (code: StepCode, text: string) => {
    if (!token || !workflow) return;
    const updated = await api.approveBrandSetupStep(token, workflow.tenant_id, code);
    setWorkflow(updated);
    const nextStep = updated.current_step;
    if (isStepCode(nextStep)) {
      setSelectedStep(nextStep);
    }
    setMessage(text);
  };

  const csvValidation = useMemo(
    () => ({
      total: csvRows.length,
      ok: csvRows.length - csvRowErrors.length,
      errors: csvRowErrors.length,
      validPercent: csvRows.length === 0 ? 0 : Math.round(((csvRows.length - csvRowErrors.length) / csvRows.length) * 100),
    }),
    [csvRows, csvRowErrors]
  );

  const uploadAsset = async (event: ChangeEvent<HTMLInputElement>, assetType: "logo" | "base_image") => {
    if (!token || !workflow) return;
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      setSaving(true);
      setError("");
      const uploaded = await api.uploadBrandAsset(token, workflow.tenant_id, "brand_identity", assetType, file);
      setWorkflow((previous) => (previous ? { ...previous, assets: [...previous.assets, uploaded] } : previous));
      if (assetType === "logo") {
        setIdentity((previous) => ({ ...previous, logo_asset_id: uploaded.id }));
      } else {
        setIdentity((previous) => ({ ...previous, base_image_asset_ids: [...previous.base_image_asset_ids, uploaded.id] }));
      }
      setMessage(
        assetType === "logo"
          ? `Logotipo cargado correctamente: ${uploaded.file_name}.`
          : `Imagen base cargada correctamente: ${uploaded.file_name}.`
      );
    } catch (err) {
      setError(toUiError(err, "No fue posible cargar el archivo."));
    } finally {
      setSaving(false);
      event.target.value = "";
    }
  };

  const downloadBulkTemplate = () => {
    const header = REQUIRED_COLUMNS.join(",");
    const demoRow = [
      "Kit Inicio ComerCia",
      "Paquete inicial para ventas",
      "Kits",
      "KIT-001",
      "1299",
      "1199",
      "1099",
      "120",
      "si",
      "si",
      "si",
      "si",
      "1",
      "6",
      "prod_demo_kit001",
      "price_demo_public_kit001",
      "price_demo_retail_kit001",
      "price_demo_wholesale_kit001",
    ].join(",");
    const blob = new Blob([`${header}\n${demoRow}\n`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "plantilla_catalogo_comercia.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const loadBulkCsvInWizard = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setError("");
    setMessage("");
    setCsvBackendErrors([]);

    const reader = new FileReader();
    reader.onload = () => {
      const content = String(reader.result ?? "");
      const lines = content.split(/\r?\n/).filter(Boolean);
      if (lines.length === 0) {
        setCsvRows([]);
        setCsvColumnErrors(["El archivo CSV esta vacio."]);
        setCsvRowErrors([]);
        return;
      }
      const [headerLine, ...dataLines] = lines;
      const headers = headerLine.split(",").map((item) => item.trim().toLowerCase());
      const missingColumns = REQUIRED_COLUMNS.filter((column) => !headers.includes(column));
      setCsvColumnErrors(missingColumns.map((column) => `Falta columna obligatoria: ${column}`));

      const parsedRows = dataLines.map((line) => {
        const values = line.split(",");
        return headers.reduce<ImportRow>((acc, header, index) => {
          acc[header] = (values[index] ?? "").trim();
          return acc;
        }, {});
      });

      const detectedRowErrors = parsedRows
        .map((row, index) => {
          if (!row.nombre) return { index: index + 1, reason: "Falta nombre" };
          if (!row.sku) return { index: index + 1, reason: "Falta SKU" };
          if (!row.precio_publico || Number.isNaN(Number(row.precio_publico))) {
            return { index: index + 1, reason: "precio_publico invalido" };
          }
          if (!row.visible_publico || !["si", "no"].includes(row.visible_publico.toLowerCase())) {
            return { index: index + 1, reason: "visible_publico debe ser si/no" };
          }
          if (!row.visible_distribuidor || !["si", "no"].includes(row.visible_distribuidor.toLowerCase())) {
            return { index: index + 1, reason: "visible_distribuidor debe ser si/no" };
          }
          return null;
        })
        .filter((item): item is { index: number; reason: string } => Boolean(item));

      setCsvRows(parsedRows);
      setCsvRowErrors(detectedRowErrors);
    };
    reader.readAsText(file, "utf-8");
    event.target.value = "";
  };

  const importBulkInWizard = async () => {
    if (!token || !workflow) return;
    if (!csvRows.length) {
      setError("Primero carga un archivo CSV en este paso.");
      return;
    }
    if (csvColumnErrors.length) {
      setError("Corrige las columnas faltantes antes de importar.");
      return;
    }
    try {
      setCsvImporting(true);
      setError("");
      setMessage("");
      const result = await api.bulkImportCatalog(token, {
        tenant_id: workflow.tenant_id,
        rows: csvRows,
      });
      setCsvBackendErrors(result.errors);
      setMessage(
        `Importacion completada para ${workflow.tenant_name}: ${result.job.valid_rows} validas, ` +
        `${result.job.error_rows} con error, ${result.job.products_created} creados y ${result.job.products_updated} actualizados.`
      );
      await load();
      setSelectedStep("ecommerce_setup");
    } catch (err) {
      setError(toUiError(err, "No fue posible importar catalogo en este paso."));
    } finally {
      setCsvImporting(false);
    }
  };

  const generateEcommerceTemplate = async () => {
    if (!token || !workflow) return;
    try {
      setSaving(true);
      setError("");
      setMessage("");
      const updated = await api.applyBrandEcommerceTemplate(token, workflow.tenant_id);
      setWorkflow(updated);
      setEcommerceData((prev) => ({
        ...prev,
        catalog_mode: "bulk",
        categories_ready: true,
        products_ready: true,
        distributor_catalog_ready: true,
        volume_rules_ready: true,
        massive_upload_enabled: true,
      }));
      setMessage(
        `Plantilla ecommerce creada para ${updated.tenant_name}. Ya tienes base para publico y distribuidores; ahora la ajustamos juntos.`
      );
    } catch (err) {
      setError(toUiError(err, "No fue posible generar la plantilla ecommerce."));
    } finally {
      setSaving(false);
    }
  };

  const saveIdentity = async (event: FormEvent) => {
    event.preventDefault();
    if (!token || !workflow) return;

    if (!identity.brand_name.trim() || !identity.business_description.trim()) {
      setError("Completa nombre y descripcion de la marca para continuar.");
      return;
    }
    if (!generated.prompt_master.trim()) {
      setError("Escribe el prompt maestro del negocio para continuar.");
      return;
    }
    if (identity.has_existing_landing && !identity.existing_landing_url?.trim()) {
      setError("Si indicas landing existente, debes capturar su URL.");
      return;
    }
    if (billingSetup.billing_model === "commission_based" && !(billingSetup.commission_percentage > 0)) {
      setError("Para modelo por comision debes indicar un porcentaje mayor a 0.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      const flowType = identity.has_existing_landing ? "with_existing_landing" : "without_landing";
      const updated = await api.updateBrandSetupWorkflow(token, workflow.tenant_id, {
        identity_data: identity,
        prompt_master: generated.prompt_master,
        flow_type: flowType,
        billing_model: billingSetup.billing_model,
        commission_enabled: billingSetup.billing_model === "commission_based",
        commission_percentage: billingSetup.billing_model === "commission_based" ? billingSetup.commission_percentage : 0,
        commission_scope: billingSetup.commission_scope,
        commission_notes: billingSetup.commission_notes || "",
        selected_template: OFFICIAL_LANDING_TEMPLATE,
        ...OFFICIAL_CHANNEL_TEMPLATE_PAYLOAD,
      });
      setWorkflow(updated);
      setMessage("Paso 1 guardado correctamente.");
      try {
        const approved = await api.approveBrandSetupStep(token, workflow.tenant_id, "brand_identity");
        setWorkflow(approved);
        if (isStepCode(approved.current_step)) {
          setSelectedStep(approved.current_step);
        }
        setMessage("Paso 1 aprobado. Continuamos con la configuracion comercial.");
      } catch (approveError) {
        setError(toUiError(approveError, "Los datos del paso 1 se guardaron, pero no se pudo aprobar automaticamente."));
      }
    } catch (err) {
      setError(toUiError(err, "No fue posible guardar el paso 1 del wizard."));
    } finally {
      setSaving(false);
    }
  };

  const generateLanding = async (regenerate = false) => {
    if (!token || !workflow) return;
    if (!generated.prompt_master.trim()) {
      setError("Captura el prompt maestro para generar la landing.");
      return;
    }
    try {
      setSaving(true);
      setError("");
      await api.updateBrandSetupWorkflow(token, workflow.tenant_id, {
        prompt_master: generated.prompt_master,
        selected_template: OFFICIAL_LANDING_TEMPLATE,
        landing_template: OFFICIAL_LANDING_TEMPLATE,
      });
      const updated = await api.generateBrandSetupLanding(token, workflow.tenant_id, regenerate);
      setWorkflow(updated);
      if (updated.generated_content) {
        setGenerated(updated.generated_content);
      }
      setLandingDraft(updated.landing_draft ?? defaultLanding);
      setMessage(regenerate ? "Landing regenerada correctamente." : "Landing generada. Revisa y aprueba para continuar.");
    } catch (err) {
      setError(toUiError(err, "No fue posible generar la landing."));
    } finally {
      setSaving(false);
    }
  };

  const approveLanding = async () => {
    if (!token || !workflow) return;
    if (!landingDraft.hero_title.trim() || !landingDraft.hero_subtitle.trim() || !landingDraft.contact_cta.trim()) {
      setError("Completa hero y CTA final antes de aprobar la landing.");
      return;
    }
    try {
      setSaving(true);
      setError("");
      const updated = await api.updateBrandSetupWorkflow(token, workflow.tenant_id, {
        landing_draft: landingDraft,
        generated_content: generated,
        selected_template: OFFICIAL_LANDING_TEMPLATE,
        landing_template: OFFICIAL_LANDING_TEMPLATE,
      });
      setWorkflow(updated);
      await approveStep("landing_setup", "Landing aprobada. Seguimos con ecommerce publico.");
    } catch (err) {
      setError(toUiError(err, "No fue posible aprobar la landing."));
    } finally {
      setSaving(false);
    }
  };

  const saveEcommercePublic = async () => {
    if (!token || !workflow) {
      setError("Sesion invalida para activar ecommerce publico. Cierra sesion y vuelve a entrar.");
      return;
    }
    try {
      setSaving(true);
      setError("");
      setMessage("");
      const refreshed = await api.getBrandSetupWorkflow(token, workflow.tenant_id);
      setWorkflow(refreshed);
      const refreshedSummary = refreshed.ecommerce_public_summary;
      if (!refreshedSummary || !refreshedSummary.ready_for_approval) {
        const categories = refreshedSummary?.categories_count ?? 0;
        const products = refreshedSummary?.products_count ?? 0;
        const services = refreshedSummary?.services_count ?? 0;
        const validRows = refreshedSummary?.last_import_valid_rows ?? 0;
        setError(
          `Aun no se puede activar ecommerce publico para ${workflow.tenant_name}. ` +
          `Estado actual: categorias=${categories}, productos=${products}, servicios=${services}, filas validas importadas=${validRows}.`
        );
        return;
      }
      await api.updateBrandSetupWorkflow(token, workflow.tenant_id, {
        ecommerce_data: ecommerceData,
        public_store_template: OFFICIAL_PUBLIC_STORE_TEMPLATE,
      });
      const activated = await api.activateBrandSetupEcommercePublic(token, workflow.tenant_id);
      setWorkflow(activated);
      if (isStepCode(activated.current_step)) {
        setSelectedStep(activated.current_step);
      }
      setMessage("Ecommerce publico aprobado y activado. Continuamos con distribuidores.");
    } catch (err) {
      setError(toUiError(err, "No fue posible guardar ecommerce publico."));
    } finally {
      setSaving(false);
    }
  };

  const saveDistributors = async () => {
    if (!token || !workflow) return;
    if (!ecommerceData.distributor_catalog_ready || !ecommerceData.volume_rules_ready) {
      setError("Completa catalogo y reglas de volumen para distribuidores.");
      return;
    }
    try {
      setSaving(true);
      setError("");
      const updated = await api.updateBrandSetupWorkflow(token, workflow.tenant_id, {
        ecommerce_data: ecommerceData,
        distributor_store_template: OFFICIAL_DISTRIBUTOR_STORE_TEMPLATE,
      });
      setWorkflow(updated);
      await approveStep("distributors_setup", "Canal de distribuidores aprobado. Continuamos con POS/WebApp.");
    } catch (err) {
      setError(toUiError(err, "No fue posible guardar el canal distribuidor."));
    } finally {
      setSaving(false);
    }
  };

  const savePos = async () => {
    if (!token || !workflow || !channelSettings) return;
    if (!posSetupData.payment_methods.length) {
      setError("Selecciona al menos un metodo de pago para POS.");
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
      await approveStep("pos_setup", "POS/WebApp aprobado. Ya puedes revisar y publicar.");
    } catch (err) {
      setError(toUiError(err, "No fue posible guardar POS/WebApp."));
    } finally {
      setSaving(false);
    }
  };

  const publishBrand = async () => {
    if (!token || !workflow) return;
    const allReady = steps.filter((step) => step.code !== "final_review").every((step) => step.approved);
    if (!allReady) {
      setError("Debes aprobar todos los pasos previos antes de publicar.");
      return;
    }
    try {
      setSaving(true);
      setError("");
      const approvedFinal = await api.approveBrandSetupStep(token, workflow.tenant_id, "final_review");
      const published = await api.updateBrandSetupWorkflow(token, workflow.tenant_id, {
        current_step: "final_review",
        is_published: true,
        selected_template: OFFICIAL_LANDING_TEMPLATE,
        ...OFFICIAL_CHANNEL_TEMPLATE_PAYLOAD,
      });
      setWorkflow({ ...published, steps: approvedFinal.steps });
      setMessage("Marca publicada correctamente.");
    } catch (err) {
      setError(toUiError(err, "No fue posible publicar la marca."));
    } finally {
      setSaving(false);
    }
  };

  const goPrevious = () => {
    if (selectedIndex <= 0) return;
    setSelectedStep(activeCodes[selectedIndex - 1]);
  };

  const goNext = () => {
    if (selectedIndex < 0 || selectedIndex >= activeCodes.length - 1) return;
    const next = activeCodes[selectedIndex + 1];
    if (!isLocked(next)) {
      setSelectedStep(next);
    }
  };

  if (loading || !workflow || !channelSettings) {
    return <p>Cargando wizard de setup...</p>;
  }

  const currentMeta = stepStatus(selectedStep);
  const wizardReturnTo = `/reinpia/brands/${workflow.tenant_id}/setup`;
  const scopedCatalogQuery = `?tenant_id=${workflow.tenant_id}&return_to=${encodeURIComponent(wizardReturnTo)}`;

  return (
    <section>
      <PageHeader
        title={`Wizard de setup: ${workflow.tenant_name}`}
        subtitle="Flujo guiado, secuencial y condicional para activar una marca sin perder contexto comercial."
      />

      <article className="card">
        <div className="row-gap" style={{ justifyContent: "space-between" }}>
          <p>Progreso: {completion}%</p>
          <p>
            Paso {Math.max(selectedIndex + 1, 1)} de {activeCodes.length}
          </p>
        </div>
        <div className="row-gap">
          {activeCodes.map((code, index) => (
            <button
              key={code}
              type="button"
              className={isLocked(code) ? "button button-outline" : code === selectedStep ? "button" : "button button-outline"}
              disabled={isLocked(code)}
              onClick={() => selectStep(code)}
            >
              {index + 1}. {STEP_LABELS[code]}
            </button>
          ))}
        </div>
      </article>

      {selectedStep === "brand_identity" ? (
        <form className="card" onSubmit={saveIdentity}>
          <h3>Paso 1: Identidad y decision de flujo</h3>
          {error ? <p className="error">{error}</p> : null}
          <label>
            Nombre del comercio / marca
            <input value={identity.brand_name} onChange={(event) => setIdentity((prev) => ({ ...prev, brand_name: event.target.value }))} required />
          </label>
          <label>
            Descripcion del negocio
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

          <p>Ya tienes landing publicada?</p>
          <label className="checkbox">
            <input
              type="radio"
              name="landing_mode"
              checked={identity.has_existing_landing}
              onChange={() => setIdentity((prev) => ({ ...prev, has_existing_landing: true }))}
            />
            Si, ya tengo landing
          </label>
          <label className="checkbox">
            <input
              type="radio"
              name="landing_mode"
              checked={!identity.has_existing_landing}
              onChange={() => setIdentity((prev) => ({ ...prev, has_existing_landing: false, existing_landing_url: "" }))}
            />
            No, necesito generar landing
          </label>

          {identity.has_existing_landing ? (
            <label>
              URL de landing existente
              <input
                type="url"
                placeholder="https://mi-marca.com"
                value={identity.existing_landing_url ?? ""}
                onChange={(event) => setIdentity((prev) => ({ ...prev, existing_landing_url: event.target.value }))}
              />
            </label>
          ) : null}

          {!identity.has_existing_landing ? (
            <>
              <label>
                Color principal
                <input type="color" value={identity.primary_color} onChange={(event) => setIdentity((prev) => ({ ...prev, primary_color: event.target.value }))} />
              </label>
              <label>
                Color secundario
                <input type="color" value={identity.secondary_color} onChange={(event) => setIdentity((prev) => ({ ...prev, secondary_color: event.target.value }))} />
              </label>
            </>
          ) : null}

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
            Modelo comercial
            <select
              value={billingSetup.billing_model}
              onChange={(event) =>
                setBillingSetup((prev) => ({
                  ...prev,
                  billing_model: event.target.value as BillingSetupData["billing_model"],
                  commission_enabled: event.target.value === "commission_based",
                  commission_percentage: event.target.value === "commission_based" ? Math.max(prev.commission_percentage, 1) : 0,
                }))
              }
            >
              <option value="fixed_subscription">Cuota fija</option>
              <option value="commission_based">Comision por venta</option>
            </select>
          </label>
          {workflow?.commercial_plan_key ? (
            <p className="muted">
              Plan pagado desde Stripe: <strong>{workflow.commercial_plan_key}</strong> ({workflow.commercial_plan_status ?? "sin estado"})
              {" | "}Creditos IA: {workflow.ai_tokens_balance ?? 0}
              {" | "}Llave IA: {workflow.ai_tokens_locked ? "Cerrada" : "Abierta"}
            </p>
          ) : null}
          {billingSetup.billing_model === "commission_based" ? (
            <>
              <label>
                Porcentaje de comision (%)
                <input
                  type="number"
                  min={0.1}
                  step={0.1}
                  value={billingSetup.commission_percentage}
                  onChange={(event) =>
                    setBillingSetup((prev) => ({
                      ...prev,
                      commission_percentage: Number(event.target.value || 0),
                      commission_enabled: true,
                    }))
                  }
                />
              </label>
              <label>
                Notas internas de comision (opcional)
                <textarea
                  value={billingSetup.commission_notes}
                  onChange={(event) => setBillingSetup((prev) => ({ ...prev, commission_notes: event.target.value }))}
                />
              </label>
            </>
          ) : (
            <p className="muted">Este modelo no aplica porcentaje sobre venta.</p>
          )}

          <label>
            Prompt maestro de la marca
            <textarea
              value={generated.prompt_master}
              onChange={(event) => setGenerated((prev) => ({ ...prev, prompt_master: event.target.value }))}
              placeholder="Describe negocio, cliente ideal, canales, objetivos y operacion esperada"
              required
            />
          </label>

          <label>
            Logotipo
            <input type="file" accept="image/*" onChange={(event) => uploadAsset(event, "logo")} />
          </label>
          <label>
            Imagenes base (opcional)
            <input type="file" accept="image/*" onChange={(event) => uploadAsset(event, "base_image")} />
          </label>
          <p className="muted">
            Logo cargado: {identity.logo_asset_id ? "Si" : "No"} | Imagenes base: {identity.base_image_asset_ids.length}
          </p>
          {logoAsset ? (
            <div>
              <p className="muted">Logotipo actual:</p>
              {toAssetUrl(logoAsset.file_url) ? (
                <img src={toAssetUrl(logoAsset.file_url) ?? undefined} alt="Logotipo de la marca" style={{ maxWidth: "180px", borderRadius: "8px" }} />
              ) : null}
              <p className="muted">{logoAsset.file_name}</p>
            </div>
          ) : null}
          {baseImageAssets.length ? (
            <div>
              <p className="muted">Imagenes base cargadas:</p>
              <div className="row-gap">
                {baseImageAssets.map((asset) => (
                  <div key={asset.id}>
                    {toAssetUrl(asset.file_url) ? (
                      <img src={toAssetUrl(asset.file_url) ?? undefined} alt={asset.file_name} style={{ maxWidth: "180px", borderRadius: "8px" }} />
                    ) : null}
                    <p className="muted">{asset.file_name}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <button className="button" type="submit" disabled={saving}>
            Guardar y continuar
          </button>
        </form>
      ) : null}

      {selectedStep === "landing_setup" ? (
        <article className="card">
          <h3>Paso Landing: generacion, edicion y aprobacion</h3>
          {error ? <p className="error">{error}</p> : null}
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
                <input
                  value={section.title}
                  onChange={(event) => {
                    const next = [...landingDraft.sections];
                    next[index] = { ...next[index], title: event.target.value };
                    setLandingDraft((prev) => ({ ...prev, sections: next }));
                  }}
                />
                <textarea
                  value={section.body}
                  onChange={(event) => {
                    const next = [...landingDraft.sections];
                    next[index] = { ...next[index], body: event.target.value };
                    setLandingDraft((prev) => ({ ...prev, sections: next }));
                  }}
                />
              </article>
            ))}
          </div>

          <label>
            CTA final de contacto
            <input value={landingDraft.contact_cta} onChange={(event) => setLandingDraft((prev) => ({ ...prev, contact_cta: event.target.value }))} />
          </label>

          <div className="row-gap">
            <Link className="button button-outline" to={`/store/${workflow.tenant_slug}/landing`}>Ver landing oficial</Link>
            <Link className="button button-outline" to={`/store/${workflow.tenant_slug}/landing?preview=1`}>Ver preview</Link>
            <button className="button" type="button" onClick={approveLanding} disabled={saving}>
              Aprobar y continuar
            </button>
          </div>
        </article>
      ) : null}

      {selectedStep === "ecommerce_setup" ? (
        <article className="card">
          <h3>Paso Ecommerce publico</h3>
          {error ? <p className="error">{error}</p> : null}
          {ecommerceSummary ? (
            <>
              <section className="card-grid">
                <article className="card">
                  <h4>Resumen del catalogo de la marca</h4>
                  <p>Categorias configuradas: {ecommerceSummary.categories_count}</p>
                  <p>Productos cargados: {ecommerceSummary.products_count}</p>
                  <p>Servicios cargados: {ecommerceSummary.services_count}</p>
                  <p>
                    Ultima importacion:{" "}
                    {ecommerceSummary.last_import_at
                      ? new Date(ecommerceSummary.last_import_at).toLocaleString("es-MX")
                      : "Sin importaciones registradas"}
                  </p>
                </article>
                <article className="card">
                  <h4>Estado de carga masiva</h4>
                  <p>Carga masiva completada: {ecommerceSummary.import_completed ? "Si" : "No"}</p>
                  <p>Filas validas: {ecommerceSummary.last_import_valid_rows}</p>
                  <p>Filas con error: {ecommerceSummary.last_import_error_rows}</p>
                  <p>Categorias creadas en ultima importacion: {ecommerceSummary.last_import_categories_created}</p>
                  <p>
                    Productos creados/actualizados: {ecommerceSummary.last_import_products_created}/
                    {ecommerceSummary.last_import_products_updated}
                  </p>
                </article>
                <article className="card">
                  <h4>Sincronizacion Stripe</h4>
                  <p>
                    Estado:{" "}
                    {ecommerceSummary.stripe_sync_status === "si"
                      ? "Si"
                      : ecommerceSummary.stripe_sync_status === "no"
                        ? "No"
                        : "Pendiente"}
                  </p>
                  <p>
                    Productos sincronizados: {ecommerceSummary.stripe_products_synced}/{ecommerceSummary.stripe_products_total}
                  </p>
                  <p>Estado del paso: {ecommerceSummary.step_status === "ready" ? "Listo para aprobacion" : ecommerceSummary.step_status}</p>
                </article>
              </section>
              <article className="card">
                <h4>Checklist automatico</h4>
                <ul className="marketing-list">
                  <li>Categorias configuradas: {ecommerceSummary.categories_count > 0 ? "OK" : "Pendiente"}</li>
                  <li>Catalogo cargado (productos/servicios): {ecommerceSummary.products_count + ecommerceSummary.services_count > 0 ? "OK" : "Pendiente"}</li>
                  <li>Ultima importacion registrada: {ecommerceSummary.last_import_at ? "OK" : "Pendiente"}</li>
                  <li>Listo para aprobar: {ecommerceSummary.ready_for_approval ? "Si" : "No"}</li>
                </ul>
              </article>
            </>
          ) : null}
          <label>
            Modo de carga
            <select value={ecommerceData.catalog_mode} onChange={(event) => setEcommerceData((prev) => ({ ...prev, catalog_mode: event.target.value }))}>
              <option value="manual">Manual</option>
              <option value="bulk">Carga masiva</option>
            </select>
          </label>
          <p className="muted">
            Este estado se calcula automaticamente con el catalogo real de la marca (categorias, productos/servicios e importacion).
          </p>
          <article className="card">
            <h4>Carga masiva desde este paso</h4>
            <p>
              Esta importacion se ejecuta directamente para <strong>{workflow.tenant_name}</strong> y al finalizar se
              actualiza el resumen del wizard.
            </p>
            <div className="row-gap">
              <button className="button button-outline" type="button" onClick={downloadBulkTemplate}>
                Descargar plantilla CSV
              </button>
              <label className="button button-outline">
                Cargar archivo CSV
                <input type="file" accept=".csv" style={{ display: "none" }} onChange={loadBulkCsvInWizard} />
              </label>
              <button className="button" type="button" onClick={importBulkInWizard} disabled={csvImporting || !csvRows.length}>
                {csvImporting ? "Importando..." : "Importar catalogo aqui"}
              </button>
            </div>
            <p className="muted">
              Validacion local: {csvValidation.ok}/{csvValidation.total} filas validas ({csvValidation.validPercent}%)
            </p>
            {csvColumnErrors.length ? (
              <ul className="marketing-list">
                {csvColumnErrors.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ) : null}
            {csvRowErrors.length ? (
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Fila</th>
                      <th>Error local</th>
                    </tr>
                  </thead>
                  <tbody>
                    {csvRowErrors.map((item) => (
                      <tr key={`${item.index}-${item.reason}`}>
                        <td>{item.index}</td>
                        <td>{item.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
            {csvBackendErrors.length ? (
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Fila</th>
                      <th>Error backend</th>
                    </tr>
                  </thead>
                  <tbody>
                    {csvBackendErrors.map((item) => (
                      <tr key={`${item.index}-${item.reason}`}>
                        <td>{item.index}</td>
                        <td>{item.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
          </article>
          <label>
            Notas
            <textarea value={ecommerceData.notes ?? ""} onChange={(event) => setEcommerceData((prev) => ({ ...prev, notes: event.target.value }))} />
          </label>
          <div className="row-gap">
            <Link className="button button-outline" to={`/products?tenant_id=${workflow.tenant_id}`}>Productos</Link>
            <Link className="button button-outline" to={`/categories?tenant_id=${workflow.tenant_id}`}>Categorias</Link>
            <Link className="button button-outline" to={`/admin/catalog/bulk-upload${scopedCatalogQuery}`}>Carga masiva</Link>
            <button className="button button-outline" type="button" onClick={generateEcommerceTemplate} disabled={saving || csvImporting}>
              Generar plantilla ecommerce
            </button>
            <button className="button button-outline" type="button" onClick={() => load()} disabled={saving || csvImporting}>
              Refrescar resumen
            </button>
            <button
              className="button"
              type="button"
              onClick={saveEcommercePublic}
              disabled={saving || csvImporting}
            >
              {ecommerceSummary?.ready_for_approval ? "Aprobar y activar ecommerce publico" : "Generar ecommerce publico"}
            </button>
          </div>
          <p className="muted">
            Si el boton no activa, usa "Refrescar resumen": ahora muestra el motivo exacto (categorias/productos/importacion).
          </p>
        </article>
      ) : null}

      {selectedStep === "distributors_setup" ? (
        <article className="card">
          <h3>Paso Ecommerce distribuidores</h3>
          {error ? <p className="error">{error}</p> : null}
          <label className="checkbox">
            <input type="checkbox" checked={ecommerceData.distributor_catalog_ready} onChange={(event) => setEcommerceData((prev) => ({ ...prev, distributor_catalog_ready: event.target.checked }))} />
            Catalogo distribuidor listo
          </label>
          <label className="checkbox">
            <input type="checkbox" checked={ecommerceData.volume_rules_ready} onChange={(event) => setEcommerceData((prev) => ({ ...prev, volume_rules_ready: event.target.checked }))} />
            Reglas de volumen y mayoreo listas
          </label>
          <label className="checkbox">
            <input type="checkbox" checked={ecommerceData.recurring_orders_ready} onChange={(event) => setEcommerceData((prev) => ({ ...prev, recurring_orders_ready: event.target.checked }))} />
            Compra recurrente habilitada
          </label>
          <div className="row-gap">
            <Link className="button button-outline" to="/admin/distributors">Distribuidores</Link>
            <button className="button" type="button" onClick={saveDistributors} disabled={saving}>
              Aprobar canal distribuidor
            </button>
          </div>
        </article>
      ) : null}

      {selectedStep === "pos_setup" ? (
        <article className="card">
          <h3>Paso POS / WebApp</h3>
          {error ? <p className="error">{error}</p> : null}
          <label className="checkbox">
            <input type="checkbox" checked={posSetupData.pos_enabled} onChange={(event) => setPosSetupData((prev) => ({ ...prev, pos_enabled: event.target.checked }))} />
            POS habilitado
          </label>
          <p>Metodos de pago</p>
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
            <button className="button" type="button" onClick={savePos} disabled={saving}>
              Aprobar POS / WebApp
            </button>
          </div>
        </article>
      ) : null}

      {selectedStep === "final_review" ? (
        <article className="card">
          <h3>Revision final y publicacion</h3>
          {error ? <p className="error">{error}</p> : null}
          <ul className="marketing-list">
            {steps.map((row) => {
              const code = row.code as StepCode;
              return (
                <li key={row.code}>
                  {STEP_LABELS[code] ?? row.code}: {row.approved ? "OK" : "Pendiente"}
                </li>
              );
            })}
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
        <p>Status: {currentMeta?.status ?? "pending"}</p>
        <p>Aprobado: {currentMeta?.approved ? "Si" : "No"}</p>
        <div className="row-gap">
          <button className="button button-outline" type="button" onClick={goPrevious} disabled={selectedIndex <= 0}>
            Anterior
          </button>
          <button
            className="button button-outline"
            type="button"
            onClick={goNext}
            disabled={selectedIndex < 0 || selectedIndex >= activeCodes.length - 1 || isLocked(activeCodes[selectedIndex + 1])}
          >
            Siguiente
          </button>
        </div>
      </article>

      {message ? <p>{message}</p> : null}
      {selectedStep !== "brand_identity" && selectedStep !== "landing_setup" && selectedStep !== "ecommerce_setup" && selectedStep !== "distributors_setup" && selectedStep !== "pos_setup" && selectedStep !== "final_review" && error ? (
        <p className="error">{error}</p>
      ) : null}
    </section>
  );
}
