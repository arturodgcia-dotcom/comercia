import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../app/AuthContext";
import { KpiCard } from "../components/KpiCard";
import { PageHeader } from "../components/PageHeader";
import { SummaryTable } from "../components/SummaryTable";
import { api } from "../services/api";
import {
  Appointment,
  BrandAdminSettings,
  DistributorApplication,
  DistributorProfile,
  LogisticsOrder,
  Order,
  ReinpiaSubscription,
  ReinpiaTenantKpis,
  Tenant,
  TenantBranding
} from "../types/domain";

function billingModelLabel(value?: string): string {
  return value === "commission_based" ? "Comision por venta" : "Cuota fija";
}

export function ReinpiaTenantDetailPage() {
  const { tenantId } = useParams();
  const { token } = useAuth();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [branding, setBranding] = useState<TenantBranding | null>(null);
  const [kpis, setKpis] = useState<ReinpiaTenantKpis | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [subscriptions, setSubscriptions] = useState<ReinpiaSubscription[]>([]);
  const [appointmentSummary, setAppointmentSummary] = useState<{ total: number; by_status: Array<{ status: string; count: number }> } | null>(null);
  const [logisticsSummary, setLogisticsSummary] = useState<{ total: number; delivered: number; by_status: Array<{ status: string; count: number }> } | null>(null);
  const [distributorSummary, setDistributorSummary] = useState<{ total_applications: number; approved_profiles: number } | null>(null);
  const [appointmentsRecent, setAppointmentsRecent] = useState<Appointment[]>([]);
  const [logisticsRecent, setLogisticsRecent] = useState<LogisticsOrder[]>([]);
  const [distributorApplicationsRecent, setDistributorApplicationsRecent] = useState<DistributorApplication[]>([]);
  const [distributorsRecent, setDistributorsRecent] = useState<DistributorProfile[]>([]);
  const [brandSettings, setBrandSettings] = useState<BrandAdminSettings | null>(null);
  const [savingSettings, setSavingSettings] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token || !tenantId) return;
    Promise.all([
      api.getTenantById(token, Number(tenantId)),
      api.getTenantBranding(token, Number(tenantId)),
      api.getReinpiaTenantKpis(token, Number(tenantId)),
      api.getReinpiaTenantOrders(token, Number(tenantId)),
      api.getReinpiaTenantSubscriptions(token, Number(tenantId)),
      api.getReinpiaAppointmentsSummary(token, `tenant_id=${tenantId}`),
      api.getReinpiaLogisticsSummary(token, `tenant_id=${tenantId}`),
      api.getReinpiaDistributorsSummary(token, `tenant_id=${tenantId}`),
      api.getAppointmentsByTenant(token, Number(tenantId)),
      api.getLogisticsByTenant(token, Number(tenantId)),
      api.getDistributorApplicationsByTenant(token, Number(tenantId)),
      api.getDistributorsByTenant(token, Number(tenantId)),
      api.getBrandAdminSettings(token, Number(tenantId)),
    ])
      .then(
        ([
          tenantData,
          brandingData,
          kpisData,
          orderData,
          subscriptionData,
          appSummary,
          logSummary,
          distSummary,
          appointmentsRows,
          logisticsRows,
          distributorApplicationsRows,
          distributorsRows
          ,
          brandSettingsData
        ]) => {
        setTenant(tenantData);
        setBranding(brandingData);
        setKpis(kpisData);
        setOrders(orderData.slice(0, 20));
        setSubscriptions(subscriptionData);
        setAppointmentSummary(appSummary);
        setLogisticsSummary(logSummary);
        setDistributorSummary(distSummary);
          setAppointmentsRecent(appointmentsRows.slice(0, 12));
          setLogisticsRecent(logisticsRows.slice(0, 12));
          setDistributorApplicationsRecent(distributorApplicationsRows.slice(0, 12));
          setDistributorsRecent(distributorsRows.slice(0, 12));
          setBrandSettings(brandSettingsData);
        }
      )
      .catch((err) => setError(err instanceof Error ? err.message : "No fue posible cargar tenant detail"));
  }, [token, tenantId]);

  if (error) return <p className="error">{error}</p>;
  if (!tenant || !kpis) return <p>Cargando detalle tenant...</p>;

  const updateAddonStatus = async (
    key: "logistics" | "workday" | "nfc",
    status: string,
    plan: string | null,
    scopeRaw: string
  ) => {
    if (!token || !brandSettings) return;
    const ids = scopeRaw
      .split(",")
      .map((x) => Number(x.trim()))
      .filter((x) => Number.isFinite(x) && x > 0);
    const payload: Record<string, unknown> = {
      currency_inherit_global: brandSettings.currency_inherit_global,
    };
    if (key === "logistics") {
      payload.addon_logistics_status = status;
      payload.addon_logistics_plan = plan;
      payload.addon_logistics_scope_branch_ids = ids;
    }
    if (key === "workday") {
      payload.addon_workday_status = status;
      payload.addon_workday_plan = plan;
      payload.addon_workday_scope_branch_ids = ids;
    }
    if (key === "nfc") {
      payload.addon_nfc_status = status;
      payload.addon_nfc_plan = plan;
      payload.addon_nfc_scope_branch_ids = ids;
    }
    try {
      setSavingSettings(true);
      const next = await api.updateBrandAdminSettings(token, Number(tenantId), payload);
      setBrandSettings(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No fue posible actualizar add-on.");
    } finally {
      setSavingSettings(false);
    }
  };

  const updateInternational = async (countriesRaw: string, channelsRaw: string) => {
    if (!token || !brandSettings) return;
    const countries = countriesRaw
      .split(",")
      .map((x) => x.trim().toUpperCase())
      .filter(Boolean);
    const channels = channelsRaw
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [countryCode = "", currency = brandSettings.currency_base_currency, language = brandSettings.language_primary, landing = "1", ecommerce = "1", webapp = "1"] = line.split("|");
        return {
          country_code: countryCode.trim().toUpperCase(),
          currency: currency.trim().toUpperCase(),
          language: language.trim().toLowerCase(),
          landing_enabled: landing.trim() === "1",
          ecommerce_enabled: ecommerce.trim() === "1",
          webapp_enabled: webapp.trim() === "1",
        };
      })
      .filter((item) => item.country_code);
    try {
      setSavingSettings(true);
      const next = await api.updateBrandAdminSettings(token, Number(tenantId), {
        currency_inherit_global: brandSettings.currency_inherit_global,
        country_code: brandSettings.country_code,
        countries_enabled: countries,
        country_channels: channels,
        expansion_enabled: true,
        cross_border_enabled: true,
      });
      setBrandSettings(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No fue posible actualizar expansion internacional.");
    } finally {
      setSavingSettings(false);
    }
  };

  return (
    <section>
      <PageHeader title={`Detalle de marca #${tenant.id}`} subtitle={`${tenant.name} | ${tenant.business_type} | plan ${tenant.plan_id ?? "-"}`} />
      <div className="row-gap">
        <Link className="button button-outline" to="/reinpia/tenants">
          Volver a tenants
        </Link>
        <Link className="button button-outline" to="/reinpia/canales-creados">
          Ver canales creados
        </Link>
      </div>

      <div className="card-grid">
        <KpiCard label="Ingresos" value={`$${kpis.revenue.toLocaleString("es-MX")}`} />
        <KpiCard label="Comisiones" value={`$${kpis.commissions.toLocaleString("es-MX")}`} />
        <KpiCard label="Neto" value={`$${kpis.net_amount.toLocaleString("es-MX")}`} />
        <KpiCard label="Órdenes pagadas" value={kpis.paid_orders} />
        <KpiCard label="Órdenes fallidas" value={kpis.failed_orders} />
        <KpiCard label="Subscription activa" value={kpis.active_subscription_status ? "Si" : "No"} />
        <KpiCard label="Distribuidores aprobados" value={kpis.distributors_approved} />
        <KpiCard label="Citas" value={kpis.appointments_count} />
        <KpiCard label="Logistica entregada" value={kpis.logistics_delivered_count} />
        <KpiCard label="Modelo comercial" value={billingModelLabel(kpis.billing_model)} />
        <KpiCard label="Comision habilitada" value={kpis.commission_enabled ? "Si" : "No"} />
        <KpiCard label="% comision" value={`${Number(kpis.commission_percentage ?? 0).toFixed(2)}%`} />
        <KpiCard label="Ventas sujetas a comision" value={`$${Number(kpis.sales_subject_to_commission ?? 0).toLocaleString("es-MX")}`} />
        <KpiCard label="Comision estimada" value={`$${Number(kpis.estimated_commission_amount ?? 0).toLocaleString("es-MX")}`} />
        <KpiCard label="Plan comercial Stripe" value={kpis.commercial_plan_key ?? "No pagado"} />
        <KpiCard label="Estado plan comercial" value={kpis.commercial_plan_status ?? "not_purchased"} />
        <KpiCard label="Creditos IA incluidos" value={kpis.ai_tokens_included ?? 0} />
        <KpiCard label="Creditos IA disponibles" value={kpis.ai_tokens_balance ?? 0} />
        <KpiCard label="Creditos IA consumidos" value={kpis.ai_tokens_used ?? 0} />
        <KpiCard label="Llave IA" value={kpis.ai_tokens_locked ? "Cerrada" : "Abierta"} />
      </div>

      <section className="store-banner">
        <h3>Branding resumido</h3>
        <p>Hero: {branding?.hero_title ?? "-"}</p>
        <p>Subtitulo: {branding?.hero_subtitle ?? "-"}</p>
        <p>Email: {branding?.contact_email ?? "-"}</p>
      </section>

      {brandSettings ? (
        <section className="card">
          <h3>Control global de add-ons (ComerCia)</h3>
          <p>Estado comercial por add-on: deshabilitado, configurando, activo, suspendido.</p>
          <div className="card-grid">
            <article className="card">
              <h4>Logística</h4>
              <p>Estado actual: {brandSettings.addon_logistics_status}</p>
              <p>Plan add-on: {brandSettings.addon_logistics_plan || "-"}</p>
              <p>Sucursales scope: {brandSettings.addon_logistics_scope_branch_ids.join(", ") || "-"}</p>
              <div className="row-gap">
                <button className="button button-outline" type="button" disabled={savingSettings} onClick={() => void updateAddonStatus("logistics", "deshabilitado", null, "")}>Deshabilitar</button>
                <button className="button button-outline" type="button" disabled={savingSettings} onClick={() => {
                  const plan = window.prompt("Plan del add-on Logística:", brandSettings.addon_logistics_plan || "addon_logistics_base");
                  const scope = window.prompt("IDs de sucursales separados por coma:", brandSettings.addon_logistics_scope_branch_ids.join(","));
                  if (plan !== null && scope !== null) void updateAddonStatus("logistics", "configurando", plan, scope);
                }}>Configurar</button>
                <button className="button" type="button" disabled={savingSettings} onClick={() => {
                  const plan = window.prompt("Plan del add-on Logística:", brandSettings.addon_logistics_plan || "addon_logistics_base");
                  const scope = window.prompt("IDs de sucursales separados por coma:", brandSettings.addon_logistics_scope_branch_ids.join(","));
                  if (plan !== null && scope !== null) void updateAddonStatus("logistics", "activo", plan, scope);
                }}>Activar</button>
                <button className="button button-outline" type="button" disabled={savingSettings} onClick={() => {
                  const plan = window.prompt("Plan del add-on Logística:", brandSettings.addon_logistics_plan || "addon_logistics_base");
                  const scope = window.prompt("IDs de sucursales separados por coma:", brandSettings.addon_logistics_scope_branch_ids.join(","));
                  if (plan !== null && scope !== null) void updateAddonStatus("logistics", "suspendido", plan, scope);
                }}>Suspender</button>
              </div>
            </article>
            <article className="card">
              <h4>Jornada laboral</h4>
              <p>Estado actual: {brandSettings.addon_workday_status}</p>
              <p>Plan add-on: {brandSettings.addon_workday_plan || "-"}</p>
              <p>Sucursales scope: {brandSettings.addon_workday_scope_branch_ids.join(", ") || "-"}</p>
              <div className="row-gap">
                <button className="button button-outline" type="button" disabled={savingSettings} onClick={() => void updateAddonStatus("workday", "deshabilitado", null, "")}>Deshabilitar</button>
                <button className="button button-outline" type="button" disabled={savingSettings} onClick={() => {
                  const plan = window.prompt("Plan del add-on Jornada laboral:", brandSettings.addon_workday_plan || "addon_workday_base");
                  const scope = window.prompt("IDs de sucursales separados por coma:", brandSettings.addon_workday_scope_branch_ids.join(","));
                  if (plan !== null && scope !== null) void updateAddonStatus("workday", "configurando", plan, scope);
                }}>Configurar</button>
                <button className="button" type="button" disabled={savingSettings} onClick={() => {
                  const plan = window.prompt("Plan del add-on Jornada laboral:", brandSettings.addon_workday_plan || "addon_workday_base");
                  const scope = window.prompt("IDs de sucursales separados por coma:", brandSettings.addon_workday_scope_branch_ids.join(","));
                  if (plan !== null && scope !== null) void updateAddonStatus("workday", "activo", plan, scope);
                }}>Activar</button>
                <button className="button button-outline" type="button" disabled={savingSettings} onClick={() => {
                  const plan = window.prompt("Plan del add-on Jornada laboral:", brandSettings.addon_workday_plan || "addon_workday_base");
                  const scope = window.prompt("IDs de sucursales separados por coma:", brandSettings.addon_workday_scope_branch_ids.join(","));
                  if (plan !== null && scope !== null) void updateAddonStatus("workday", "suspendido", plan, scope);
                }}>Suspender</button>
              </div>
            </article>
            <article className="card">
              <h4>NFC</h4>
              <p>Estado actual: {brandSettings.addon_nfc_status}</p>
              <p>Plan add-on: {brandSettings.addon_nfc_plan || "-"}</p>
              <p>Sucursales scope: {brandSettings.addon_nfc_scope_branch_ids.join(", ") || "-"}</p>
              <div className="row-gap">
                <button className="button button-outline" type="button" disabled={savingSettings} onClick={() => void updateAddonStatus("nfc", "deshabilitado", null, "")}>Deshabilitar</button>
                <button className="button button-outline" type="button" disabled={savingSettings} onClick={() => {
                  const plan = window.prompt("Plan del add-on NFC:", brandSettings.addon_nfc_plan || "addon_nfc_base");
                  const scope = window.prompt("IDs de sucursales separados por coma:", brandSettings.addon_nfc_scope_branch_ids.join(","));
                  if (plan !== null && scope !== null) void updateAddonStatus("nfc", "configurando", plan, scope);
                }}>Configurar</button>
                <button className="button" type="button" disabled={savingSettings} onClick={() => {
                  const plan = window.prompt("Plan del add-on NFC:", brandSettings.addon_nfc_plan || "addon_nfc_base");
                  const scope = window.prompt("IDs de sucursales separados por coma:", brandSettings.addon_nfc_scope_branch_ids.join(","));
                  if (plan !== null && scope !== null) void updateAddonStatus("nfc", "activo", plan, scope);
                }}>Activar</button>
                <button className="button button-outline" type="button" disabled={savingSettings} onClick={() => {
                  const plan = window.prompt("Plan del add-on NFC:", brandSettings.addon_nfc_plan || "addon_nfc_base");
                  const scope = window.prompt("IDs de sucursales separados por coma:", brandSettings.addon_nfc_scope_branch_ids.join(","));
                  if (plan !== null && scope !== null) void updateAddonStatus("nfc", "suspendido", plan, scope);
                }}>Suspender</button>
              </div>
            </article>
          </div>
        </section>
      ) : null}

      {brandSettings ? (
        <section className="card">
          <h3>Expansión internacional por país/canal</h3>
          <p>Formato países: MX,CO,CL. Formato canales por línea: PAIS|MONEDA|IDIOMA|LANDING(1/0)|ECOMMERCE(1/0)|WEBAPP(1/0)</p>
          <div className="detail-form">
            <label>
              Países habilitados
              <input
                defaultValue={brandSettings.countries_enabled.join(",")}
                onBlur={(e) => {
                  const channelsRaw = brandSettings.country_channels
                    .map((row) => `${row.country_code}|${row.currency}|${row.language}|${row.landing_enabled ? 1 : 0}|${row.ecommerce_enabled ? 1 : 0}|${row.webapp_enabled ? 1 : 0}`)
                    .join("\n");
                  void updateInternational(e.target.value, channelsRaw);
                }}
              />
            </label>
            <label>
              Canales por país
              <textarea
                rows={6}
                defaultValue={brandSettings.country_channels
                  .map((row) => `${row.country_code}|${row.currency}|${row.language}|${row.landing_enabled ? 1 : 0}|${row.ecommerce_enabled ? 1 : 0}|${row.webapp_enabled ? 1 : 0}`)
                  .join("\n")}
                onBlur={(e) => void updateInternational(brandSettings.countries_enabled.join(","), e.target.value)}
              />
            </label>
          </div>
        </section>
      ) : null}

      <section>
        <h3>Órdenes recientes</h3>
        <SummaryTable
          headers={["Order", "Status", "Total", "Comision", "Neto", "Fecha"]}
          rows={orders.map((order) => [
            order.id,
            order.status,
            `$${Number(order.total_amount).toLocaleString("es-MX")}`,
            `$${Number(order.commission_amount).toLocaleString("es-MX")}`,
            `$${Number(order.net_amount).toLocaleString("es-MX")}`,
            new Date(order.created_at).toLocaleString("es-MX")
          ])}
        />
      </section>

      <section>
        <h3>Suscripciones de la marca</h3>
        <SummaryTable
          headers={["ID", "Plan", "Status", "Started", "Ends"]}
          rows={subscriptions.map((sub) => [sub.id, sub.plan_id, sub.status, sub.started_at, sub.ends_at ?? "-"])}
        />
      </section>

      <section>
        <h3>Resumen operativo</h3>
        <SummaryTable
          headers={["Modulo", "Dato", "Valor"]}
          rows={[
            ["Appointments", "Total", appointmentSummary?.total ?? 0],
            ["Logistics", "Total", logisticsSummary?.total ?? 0],
            ["Logistics", "Delivered", logisticsSummary?.delivered ?? 0],
            ["Distributors", "Solicitudes", distributorSummary?.total_applications ?? 0],
            ["Distributors", "Aprobados", distributorSummary?.approved_profiles ?? 0]
          ]}
        />
      </section>

      <section>
        <h3>Citas recientes</h3>
        <SummaryTable
          headers={["ID", "Status", "Scheduled", "Gift", "Created"]}
          rows={appointmentsRecent.map((row) => [
            row.id,
            row.status,
            row.scheduled_for ? new Date(row.scheduled_for).toLocaleString("es-MX") : "-",
            row.is_gift ? "Si" : "No",
            new Date(row.created_at).toLocaleString("es-MX")
          ])}
        />
      </section>

      <section>
        <h3>Logistica reciente</h3>
        <SummaryTable
          headers={["ID", "Status", "Delivery type", "Scheduled", "Delivered"]}
          rows={logisticsRecent.map((row) => [
            row.id,
            row.status,
            row.delivery_type,
            row.scheduled_delivery_at ? new Date(row.scheduled_delivery_at).toLocaleString("es-MX") : "-",
            row.delivered_at ? new Date(row.delivered_at).toLocaleString("es-MX") : "-"
          ])}
        />
      </section>

      <section>
        <h3>Solicitudes y distribuidores recientes</h3>
        <SummaryTable
          headers={["Solicitud", "Contacto", "Status", "Created"]}
          rows={distributorApplicationsRecent.map((row) => [
            row.company_name,
            row.contact_name,
            row.status,
            new Date(row.created_at).toLocaleString("es-MX")
          ])}
        />
        <SummaryTable
          headers={["Distribuidor", "Contacto", "Autorizado", "Created"]}
          rows={distributorsRecent.map((row) => [
            row.business_name,
            row.contact_name,
            row.is_authorized ? "Si" : "No",
            new Date(row.created_at).toLocaleString("es-MX")
          ])}
        />
      </section>
    </section>
  );
}
