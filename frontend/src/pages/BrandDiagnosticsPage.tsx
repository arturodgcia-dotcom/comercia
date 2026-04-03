import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../app/AuthContext";
import { PageHeader } from "../components/PageHeader";
import { useAdminContextScope } from "../hooks/useAdminContextScope";
import { ApiError, api } from "../services/api";
import { BrandAdminSettings, BrandDiagnostic, BrandDiagnosticSummary, Tenant } from "../types/domain";

type PriorityKey = "high_priority" | "medium_priority" | "low_priority";

function ScoreCard({ title, value }: { title: string; value: number }) {
  return (
    <article className="card">
      <h3>{title}</h3>
      <p style={{ fontSize: "2rem", margin: "0.25rem 0 0.5rem", fontWeight: 700 }}>{value}/100</p>
      <div style={{ height: "8px", borderRadius: "999px", background: "#e7edf8", overflow: "hidden" }}>
        <div
          style={{
            height: "100%",
            width: `${Math.max(0, Math.min(100, value))}%`,
            background: value >= 80 ? "#12805c" : value >= 65 ? "#a66a00" : "#b42318",
            transition: "width .2s ease",
          }}
        />
      </div>
    </article>
  );
}

export function BrandDiagnosticsPage() {
  const { token } = useAuth();
  const { tenantId } = useAdminContextScope();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [settings, setSettings] = useState<BrandAdminSettings | null>(null);
  const [latest, setLatest] = useState<BrandDiagnostic | null>(null);
  const [history, setHistory] = useState<BrandDiagnosticSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [savingPlan, setSavingPlan] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [planNotes, setPlanNotes] = useState("");
  const [planOwner, setPlanOwner] = useState("equipo-marca");
  const [selected, setSelected] = useState<Record<PriorityKey, Set<string>>>({
    high_priority: new Set<string>(),
    medium_priority: new Set<string>(),
    low_priority: new Set<string>(),
  });

  const load = async () => {
    if (!token || !tenantId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const [tenantRow, brandSettings, historyRows] = await Promise.all([
        api.getTenantById(token, tenantId),
        api.getBrandAdminSettings(token, tenantId).catch(() => null),
        api.getBrandDiagnosticsHistory(token, tenantId).catch(() => []),
      ]);
      setTenant(tenantRow);
      setSettings(brandSettings);
      setHistory(historyRows);
      try {
        const latestRow = await api.getBrandDiagnosticsLatest(token, tenantId);
        setLatest(latestRow);
      } catch (err) {
        if (!(err instanceof ApiError && err.status === 404)) {
          throw err;
        }
        setLatest(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "No fue posible cargar el módulo de diagnóstico.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [token, tenantId]);

  useEffect(() => {
    if (!latest) return;
    setSelected({
      high_priority: new Set(latest.recommendations.high_priority),
      medium_priority: new Set(latest.recommendations.medium_priority),
      low_priority: new Set(latest.recommendations.low_priority),
    });
    setPlanNotes(
      typeof latest.improvement_plan?.notes === "string" ? String(latest.improvement_plan.notes) : ""
    );
    setPlanOwner(
      typeof latest.improvement_plan?.owner === "string" ? String(latest.improvement_plan.owner) : "equipo-marca"
    );
  }, [latest]);

  const runAnalysis = async () => {
    if (!token || !tenantId) return;
    setAnalyzing(true);
    setError("");
    setSuccess("");
    try {
      const row = await api.analyzeBrandDiagnostics(token, tenantId);
      setLatest(row);
      const updatedHistory = await api.getBrandDiagnosticsHistory(token, tenantId).catch(() => []);
      setHistory(updatedHistory);
      setSuccess("Diagnóstico completado correctamente.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No fue posible ejecutar el diagnóstico.");
    } finally {
      setAnalyzing(false);
    }
  };

  const toggleRecommendation = (key: PriorityKey, recommendation: string) => {
    setSelected((prev) => {
      const next = new Set(prev[key]);
      if (next.has(recommendation)) {
        next.delete(recommendation);
      } else {
        next.add(recommendation);
      }
      return { ...prev, [key]: next };
    });
  };

  const saveImprovementPlan = async () => {
    if (!token || !tenantId || !latest) return;
    setSavingPlan(true);
    setError("");
    setSuccess("");
    try {
      const updated = await api.saveBrandDiagnosticsImprovementPlan(token, tenantId, {
        accepted_high_priority: Array.from(selected.high_priority),
        accepted_medium_priority: Array.from(selected.medium_priority),
        accepted_low_priority: Array.from(selected.low_priority),
        notes: planNotes,
        owner: planOwner,
      });
      setLatest(updated);
      setSuccess("Plan de mejora guardado correctamente.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No fue posible guardar el plan de mejora.");
    } finally {
      setSavingPlan(false);
    }
  };

  const lastDateLabel = useMemo(() => {
    if (!latest) return "Sin análisis previo";
    return new Date(latest.analyzed_at).toLocaleString("es-MX");
  }, [latest]);

  if (loading) return <p className="muted">Cargando diagnóstico inteligente...</p>;
  if (!tenantId) return <p className="error">No hay marca activa para ejecutar diagnóstico.</p>;

  return (
    <section>
      <PageHeader
        title="Diagnóstico inteligente"
        subtitle="Analiza la marca activa desde SEO, AEO e identidad de marca para mejorar visibilidad y conversión."
      />

      {error ? <p className="error">{error}</p> : null}
      {success ? <p className="success">{success}</p> : null}

      <article className="card">
        <h3>Resumen de marca activa</h3>
        <p><strong>Marca:</strong> {tenant?.name ?? `Tenant #${tenantId}`}</p>
        <p><strong>Tipo de negocio:</strong> {tenant?.business_type ?? "No definido"}</p>
        <p><strong>Idioma principal:</strong> {settings?.language_primary ?? "es"}</p>
        <p><strong>Estado del canal principal:</strong> {latest ? latest.status : "Sin diagnóstico"}</p>
        <p><strong>Último análisis:</strong> {lastDateLabel}</p>
        <div className="row-gap">
          <button className="button" type="button" onClick={runAnalysis} disabled={analyzing}>
            {latest ? "Reanalizar" : "Analizar marca"}
          </button>
          <button className="button button-outline" type="button" onClick={runAnalysis} disabled={analyzing}>
            Reanalizar
          </button>
        </div>
      </article>

      {!latest ? (
        <article className="card">
          <h3>Sin diagnóstico previo</h3>
          <p>
            Ejecuta el primer diagnóstico para obtener score SEO, AEO e identidad de marca junto con recomendaciones
            accionables.
          </p>
        </article>
      ) : (
        <>
          <section className="card-grid">
            <ScoreCard title="SEO" value={latest.scores.seo} />
            <ScoreCard title="AEO" value={latest.scores.aeo} />
            <ScoreCard title="Identidad de marca" value={latest.scores.branding} />
            <ScoreCard title="Score global" value={latest.scores.global} />
          </section>

          <section className="card-grid">
            <article className="card">
              <h3>Hallazgos SEO</h3>
              <ul>
                {latest.findings.seo.map((item) => (
                  <li key={`seo-${item.criterion}`}>
                    <strong>{item.criterion}</strong>: {item.detail}
                  </li>
                ))}
              </ul>
            </article>
            <article className="card">
              <h3>Hallazgos AEO</h3>
              <ul>
                {latest.findings.aeo.map((item) => (
                  <li key={`aeo-${item.criterion}`}>
                    <strong>{item.criterion}</strong>: {item.detail}
                  </li>
                ))}
              </ul>
            </article>
            <article className="card">
              <h3>Hallazgos identidad</h3>
              <ul>
                {latest.findings.branding.map((item) => (
                  <li key={`branding-${item.criterion}`}>
                    <strong>{item.criterion}</strong>: {item.detail}
                  </li>
                ))}
              </ul>
            </article>
          </section>

          <section className="card-grid">
            {(["high_priority", "medium_priority", "low_priority"] as PriorityKey[]).map((priority) => (
              <article className="card" key={priority}>
                <h3>
                  {priority === "high_priority"
                    ? "Recomendaciones alta prioridad"
                    : priority === "medium_priority"
                      ? "Recomendaciones media prioridad"
                      : "Recomendaciones baja prioridad"}
                </h3>
                <div className="stack">
                  {latest.recommendations[priority].map((recommendation) => (
                    <label className="checkbox" key={`${priority}-${recommendation}`}>
                      <input
                        type="checkbox"
                        checked={selected[priority].has(recommendation)}
                        onChange={() => toggleRecommendation(priority, recommendation)}
                      />
                      {recommendation}
                    </label>
                  ))}
                </div>
              </article>
            ))}
          </section>

          <article className="card">
            <h3>Resumen ejecutivo</h3>
            <p>{latest.summary}</p>
            {latest.missing_data.length > 0 ? (
              <>
                <h4>Datos faltantes detectados</h4>
                <ul>
                  {latest.missing_data.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </>
            ) : null}
            <h4>Siguientes acciones sugeridas</h4>
            <ol>
              {latest.next_actions.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ol>
          </article>

          <article className="card">
            <h3>Plan de mejora</h3>
            <label>
              Responsable
              <input value={planOwner} onChange={(event) => setPlanOwner(event.target.value)} />
            </label>
            <label>
              Notas internas
              <textarea
                rows={4}
                value={planNotes}
                onChange={(event) => setPlanNotes(event.target.value)}
                placeholder="Define prioridades, responsables y fecha objetivo."
              />
            </label>
            <button className="button" type="button" onClick={saveImprovementPlan} disabled={savingPlan}>
              {savingPlan ? "Guardando..." : "Guardar plan de mejora"}
            </button>
          </article>
        </>
      )}

      <article className="card">
        <h3>Historial de análisis</h3>
        {history.length === 0 ? (
          <p className="muted">Aún no hay análisis guardados para esta marca.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Estado</th>
                <th>Score global</th>
              </tr>
            </thead>
            <tbody>
              {history.map((row) => (
                <tr key={row.id}>
                  <td>{new Date(row.analyzed_at).toLocaleString("es-MX")}</td>
                  <td>{row.status}</td>
                  <td>{row.global_score}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </article>
    </section>
  );
}

