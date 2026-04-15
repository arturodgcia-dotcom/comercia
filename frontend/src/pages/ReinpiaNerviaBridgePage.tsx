import { FormEvent, useEffect, useMemo, useState } from "react";
import { useAuth } from "../app/AuthContext";
import { KpiCard } from "../components/KpiCard";
import { PageHeader } from "../components/PageHeader";
import { SummaryTable } from "../components/SummaryTable";
import { api } from "../services/api";
import {
  NerviaFeedbackPayload,
  NerviaPublicationMetricPayload,
  NerviaReport,
  Tenant,
} from "../types/domain";

function currency(value: number): string {
  return `$${value.toLocaleString("es-MX", { maximumFractionDigits: 2 })}`;
}

export function ReinpiaNerviaBridgePage() {
  const { token } = useAuth();
  const [report, setReport] = useState<NerviaReport | null>(null);
  const [feedback, setFeedback] = useState<NerviaFeedbackPayload | null>(null);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [syncResult, setSyncResult] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [syncForm, setSyncForm] = useState<NerviaPublicationMetricPayload>({
    tenant_id: 0,
    publication_id: "",
    channel: "meta_ads",
    campaign_name: "",
    impressions: 0,
    clicks: 0,
    leads_generated: 0,
    notes: "",
  });

  const activeTenantName = useMemo(() => {
    const tenant = tenants.find((item) => item.id === syncForm.tenant_id);
    return tenant?.name ?? "Sin marca";
  }, [syncForm.tenant_id, tenants]);

  const loadData = async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const [reportRes, feedbackRes, tenantRows] = await Promise.all([
        api.getNerviaBridgeReport(token),
        api.getNerviaBridgeFeedback(token),
        api.getTenants(token),
      ]);
      setReport(reportRes);
      setFeedback(feedbackRes);
      setTenants(tenantRows);
      if (!syncForm.tenant_id && tenantRows.length > 0) {
        setSyncForm((prev) => ({ ...prev, tenant_id: tenantRows[0].id }));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "No fue posible cargar el modulo Nervia.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const onSync = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) return;
    if (!syncForm.tenant_id || !syncForm.publication_id.trim() || !syncForm.channel.trim()) {
      setError("Completa marca, publicacion y canal para sincronizar.");
      return;
    }
    setError("");
    setSyncResult("");
    try {
      const payload = {
        source: "nervia",
        items: [
          {
            ...syncForm,
            publication_id: syncForm.publication_id.trim(),
            channel: syncForm.channel.trim(),
            campaign_name: syncForm.campaign_name?.trim() || null,
            notes: syncForm.notes?.trim() || null,
          },
        ],
      };
      const created = await api.syncNerviaMetrics(token, payload);
      setSyncResult(`Sincronizacion completada: ${created.length} registro para ${activeTenantName}.`);
      setSyncForm((prev) => ({ ...prev, publication_id: "", campaign_name: "", notes: "" }));
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No fue posible sincronizar datos de Nervia.");
    }
  };

  if (loading && !report) return <p>Cargando puente de marketing Nervia...</p>;
  if (error && !report) return <p className="error">{error}</p>;
  if (!report) return <p className="error">Sin datos del puente Nervia.</p>;

  return (
    <section>
      <PageHeader
        title="Nervia x ComerCia"
        subtitle="Conecta marketing con ventas para retroalimentar a Nervia y mejorar publicaciones por marca."
      />

      {error ? <p className="error">{error}</p> : null}
      {syncResult ? <p className="success">{syncResult}</p> : null}

      <div className="card-grid">
        <KpiCard label="Clics totales" value={report.total_clicks.toLocaleString("es-MX")} />
        <KpiCard label="Impresiones" value={report.total_impressions.toLocaleString("es-MX")} />
        <KpiCard label="Leads" value={report.total_leads.toLocaleString("es-MX")} />
        <KpiCard label="Ventas pagadas" value={report.total_ventas_pagadas.toLocaleString("es-MX")} />
        <KpiCard label="Revenue MXN" value={currency(report.total_revenue_mxn)} />
        <KpiCard label="CTR" value={`${report.ctr_pct.toFixed(2)}%`} />
        <KpiCard label="Click -> Lead" value={`${report.conversion_click_to_lead_pct.toFixed(2)}%`} />
        <KpiCard label="Lead -> Venta" value={`${report.conversion_lead_to_sale_pct.toFixed(2)}%`} />
      </div>

      <section className="card" style={{ marginTop: 16 }}>
        <h3>Sincronizar metrica desde Nervia</h3>
        <p className="muted">Carga manual rapida para alimentar el modelo de publicaciones y conversion.</p>
        <form className="inline-form" onSubmit={onSync}>
          <select
            value={syncForm.tenant_id}
            onChange={(event) => setSyncForm((prev) => ({ ...prev, tenant_id: Number(event.target.value) }))}
          >
            {tenants.map((tenant) => (
              <option key={tenant.id} value={tenant.id}>
                {tenant.name}
              </option>
            ))}
          </select>
          <input
            placeholder="publication_id"
            value={syncForm.publication_id}
            onChange={(event) => setSyncForm((prev) => ({ ...prev, publication_id: event.target.value }))}
          />
          <input
            placeholder="Canal (meta_ads, tiktok, etc)"
            value={syncForm.channel}
            onChange={(event) => setSyncForm((prev) => ({ ...prev, channel: event.target.value }))}
          />
          <input
            placeholder="Campaña"
            value={syncForm.campaign_name ?? ""}
            onChange={(event) => setSyncForm((prev) => ({ ...prev, campaign_name: event.target.value }))}
          />
          <input
            type="number"
            min={0}
            placeholder="Impresiones"
            value={syncForm.impressions}
            onChange={(event) => setSyncForm((prev) => ({ ...prev, impressions: Number(event.target.value) }))}
          />
          <input
            type="number"
            min={0}
            placeholder="Clics"
            value={syncForm.clicks}
            onChange={(event) => setSyncForm((prev) => ({ ...prev, clicks: Number(event.target.value) }))}
          />
          <input
            type="number"
            min={0}
            placeholder="Leads"
            value={syncForm.leads_generated}
            onChange={(event) => setSyncForm((prev) => ({ ...prev, leads_generated: Number(event.target.value) }))}
          />
          <input
            placeholder="Notas"
            value={syncForm.notes ?? ""}
            onChange={(event) => setSyncForm((prev) => ({ ...prev, notes: event.target.value }))}
          />
          <button className="button" type="submit">
            Sincronizar
          </button>
        </form>
      </section>

      <section style={{ marginTop: 16 }}>
        <h3>Rendimiento por marca</h3>
        <SummaryTable
          headers={["Marca", "Clics", "Impresiones", "Leads", "Ventas pagadas", "Revenue", "Click->Lead", "Lead->Venta"]}
          rows={report.by_tenant.map((row) => [
            row.tenant_name,
            row.clicks.toLocaleString("es-MX"),
            row.impressions.toLocaleString("es-MX"),
            row.leads.toLocaleString("es-MX"),
            row.ventas_pagadas.toLocaleString("es-MX"),
            currency(row.revenue_mxn),
            `${row.conversion_click_to_lead_pct.toFixed(2)}%`,
            `${row.conversion_lead_to_sale_pct.toFixed(2)}%`,
          ])}
        />
      </section>

      <section style={{ marginTop: 16 }}>
        <h3>Top publicaciones por clics</h3>
        <SummaryTable
          headers={["Marca", "Publicacion", "Canal", "Campaña", "Impresiones", "Clics", "Leads"]}
          rows={report.top_publications.map((row) => [
            row.tenant_name,
            row.publication_id,
            row.channel,
            row.campaign_name ?? "-",
            row.impressions.toLocaleString("es-MX"),
            row.clicks.toLocaleString("es-MX"),
            row.leads_generated.toLocaleString("es-MX"),
          ])}
        />
      </section>

      <section style={{ marginTop: 16 }}>
        <h3>Retroalimentacion para Nervia</h3>
        <div className="stack">
          {(feedback?.suggestions ?? []).map((item) => (
            <article className="card" key={`${item.tenant_id}-${item.tenant_name}`}>
              <h4>{item.tenant_name}</h4>
              <p><strong>Insight:</strong> {item.insight}</p>
              <p><strong>Angulo sugerido:</strong> {item.suggested_post_angle}</p>
              <p><strong>CTA sugerido:</strong> {item.suggested_cta}</p>
              <p><strong>Formato sugerido:</strong> {item.suggested_format}</p>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}
