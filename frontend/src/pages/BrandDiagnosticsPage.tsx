import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../app/AuthContext";
import { PageHeader } from "../components/PageHeader";
import { useAdminContextScope } from "../hooks/useAdminContextScope";
import { ApiError, api } from "../services/api";
import { BrandAdminSettings, BrandDiagnostic, BrandDiagnosticSummary, Tenant } from "../types/domain";

type PriorityKey = "high_priority" | "medium_priority" | "low_priority";
type AnalysisTab = "internal" | "external";

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

function isValidHttpUrl(value: string): boolean {
  try {
    const url = new URL(value.trim());
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function DiagnosticResult({
  diagnostic,
  selected,
  toggleRecommendation,
  planOwner,
  setPlanOwner,
  planNotes,
  setPlanNotes,
  saveImprovementPlan,
  savingPlan,
  allowPlan = true,
}: {
  diagnostic: BrandDiagnostic;
  selected: Record<PriorityKey, Set<string>>;
  toggleRecommendation: (key: PriorityKey, recommendation: string) => void;
  planOwner: string;
  setPlanOwner: (v: string) => void;
  planNotes: string;
  setPlanNotes: (v: string) => void;
  saveImprovementPlan: () => Promise<void>;
  savingPlan: boolean;
  allowPlan?: boolean;
}) {
  return (
    <>
      <section className="card-grid">
        <ScoreCard title="SEO" value={diagnostic.scores.seo} />
        <ScoreCard title="AEO" value={diagnostic.scores.aeo} />
        <ScoreCard title="Identidad de marca" value={diagnostic.scores.branding} />
        <ScoreCard title="Score global" value={diagnostic.scores.global} />
      </section>

      <section className="card-grid">
        <article className="card">
          <h3>Hallazgos SEO</h3>
          <ul>
            {diagnostic.findings.seo.map((item) => (
              <li key={`seo-${item.criterion}`}>
                <strong>{item.criterion}</strong>: {item.detail}
              </li>
            ))}
          </ul>
        </article>
        <article className="card">
          <h3>Hallazgos AEO</h3>
          <ul>
            {diagnostic.findings.aeo.map((item) => (
              <li key={`aeo-${item.criterion}`}>
                <strong>{item.criterion}</strong>: {item.detail}
              </li>
            ))}
          </ul>
        </article>
        <article className="card">
          <h3>Hallazgos identidad</h3>
          <ul>
            {diagnostic.findings.branding.map((item) => (
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
              {diagnostic.recommendations[priority].map((recommendation) => (
                <label className="checkbox" key={`${priority}-${recommendation}`}>
                  <input
                    type="checkbox"
                    checked={selected[priority].has(recommendation)}
                    onChange={() => toggleRecommendation(priority, recommendation)}
                    disabled={!allowPlan}
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
        <p>{diagnostic.summary}</p>
        {diagnostic.missing_data.length > 0 ? (
          <>
            <h4>Datos faltantes detectados</h4>
            <ul>
              {diagnostic.missing_data.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </>
        ) : null}
        <h4>Siguientes acciones sugeridas</h4>
        <ol>
          {diagnostic.next_actions.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ol>
      </article>

      <article className="card">
        <h3>Como mejorar esta landing</h3>
        <ul>
          <li>Refuerza propuesta de valor, titular y subtitulo con lenguaje comercial directo.</li>
          <li>Incluye bloques de respuesta clara para SEO/AEO: que haces, para quien, beneficios y CTA.</li>
          <li>Alinea tono e identidad de marca con su industria y con una oferta verificable.</li>
          <li>Prioriza contacto visible, formulario o CTA de diagnostico para conversion.</li>
        </ul>
      </article>

      {allowPlan ? (
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
      ) : null}
    </>
  );
}

export function BrandDiagnosticsPage() {
  const { token } = useAuth();
  const { tenantId } = useAdminContextScope();
  const [activeTab, setActiveTab] = useState<AnalysisTab>("internal");
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [settings, setSettings] = useState<BrandAdminSettings | null>(null);
  const [latest, setLatest] = useState<BrandDiagnostic | null>(null);
  const [externalLatest, setExternalLatest] = useState<BrandDiagnostic | null>(null);
  const [history, setHistory] = useState<BrandDiagnosticSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzingExternal, setAnalyzingExternal] = useState(false);
  const [savingPlan, setSavingPlan] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [externalUrl, setExternalUrl] = useState("");
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
      const internalHistory = historyRows.filter((row) => (row.analysis_type ?? "internal_brand") === "internal_brand");
      const externalHistory = historyRows.filter((row) => row.analysis_type === "external_url");
      setTenant(tenantRow);
      setSettings(brandSettings);
      setHistory(historyRows);
      try {
        const latestRow = await api.getBrandDiagnosticsLatest(token, tenantId);
        setLatest(latestRow);
      } catch (err) {
        if (!(err instanceof ApiError && err.status === 404)) throw err;
        setLatest(null);
      }
      try {
        if (externalHistory.length > 0) {
          const externalDetail = await api.getBrandDiagnosticsLatestExternal(token, tenantId);
          setExternalLatest(externalDetail);
        } else {
          setExternalLatest(null);
        }
      } catch (err) {
        if (!(err instanceof ApiError && err.status === 404)) throw err;
        setExternalLatest(null);
      }
      if (!internalHistory.length) setLatest(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No fue posible cargar el modulo de diagnostico.");
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
    setPlanNotes(typeof latest.improvement_plan?.notes === "string" ? String(latest.improvement_plan.notes) : "");
    setPlanOwner(typeof latest.improvement_plan?.owner === "string" ? String(latest.improvement_plan.owner) : "equipo-marca");
  }, [latest]);

  const runAnalysis = async () => {
    if (!token || !tenantId) return;
    setAnalyzing(true);
    setError("");
    setSuccess("");
    try {
      const row = await api.analyzeBrandDiagnostics(token, tenantId);
      setLatest(row);
      setSuccess("Diagnostico interno completado correctamente.");
      const updatedHistory = await api.getBrandDiagnosticsHistory(token, tenantId).catch(() => []);
      setHistory(updatedHistory);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No fue posible ejecutar el diagnostico interno.");
    } finally {
      setAnalyzing(false);
    }
  };

  const runExternalAnalysis = async () => {
    if (!token || !tenantId) return;
    const candidate = externalUrl.trim();
    if (!isValidHttpUrl(candidate)) {
      setError("Ingresa una URL valida (http:// o https://).");
      return;
    }
    setAnalyzingExternal(true);
    setError("");
    setSuccess("");
    try {
      const row = await api.analyzeExternalUrlDiagnostics(token, { url: candidate, tenant_id: tenantId });
      setExternalLatest(row);
      setSuccess("Diagnostico de URL externa completado correctamente.");
      const updatedHistory = await api.getBrandDiagnosticsHistory(token, tenantId).catch(() => []);
      setHistory(updatedHistory);
      setActiveTab("external");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No fue posible analizar la URL externa.");
    } finally {
      setAnalyzingExternal(false);
    }
  };

  const toggleRecommendation = (key: PriorityKey, recommendation: string) => {
    setSelected((prev) => {
      const next = new Set(prev[key]);
      if (next.has(recommendation)) next.delete(recommendation);
      else next.add(recommendation);
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
    if (!latest) return "Sin analisis previo";
    return new Date(latest.analyzed_at).toLocaleString("es-MX");
  }, [latest]);

  if (loading) return <p className="muted">Cargando diagnostico inteligente...</p>;
  if (!tenantId) return <p className="error">No hay marca activa para ejecutar diagnostico.</p>;

  return (
    <section>
      <PageHeader
        title="Diagnostico inteligente"
        subtitle="Analiza SEO, AEO e identidad de marca sobre la marca activa o una URL externa."
      />

      {error ? <p className="error">{error}</p> : null}
      {success ? <p className="success">{success}</p> : null}

      <article className="card">
        <div className="row-gap">
          <button
            className={activeTab === "internal" ? "button" : "button button-outline"}
            type="button"
            onClick={() => setActiveTab("internal")}
          >
            Analizar marca activa
          </button>
          <button
            className={activeTab === "external" ? "button" : "button button-outline"}
            type="button"
            onClick={() => setActiveTab("external")}
          >
            Analizar URL externa
          </button>
        </div>
      </article>

      {activeTab === "internal" ? (
        <>
          <article className="card">
            <h3>Resumen de marca activa</h3>
            <p><strong>Marca:</strong> {tenant?.name ?? `Tenant #${tenantId}`}</p>
            <p><strong>Tipo de negocio:</strong> {tenant?.business_type ?? "No definido"}</p>
            <p><strong>Idioma principal:</strong> {settings?.language_primary ?? "es"}</p>
            <p><strong>Tipo de analisis:</strong> Interno (marca activa)</p>
            <p><strong>Estado:</strong> {latest ? latest.status : "Sin diagnostico"}</p>
            <p><strong>Ultimo analisis:</strong> {lastDateLabel}</p>
            <div className="row-gap">
              <button className="button" type="button" onClick={runAnalysis} disabled={analyzing}>
                {latest ? "Reanalizar" : "Analizar marca"}
              </button>
            </div>
          </article>

          {!latest ? (
            <article className="card">
              <h3>Sin diagnostico previo</h3>
              <p>Ejecuta el primer diagnostico para obtener score SEO, AEO e identidad de marca.</p>
            </article>
          ) : (
            <DiagnosticResult
              diagnostic={latest}
              selected={selected}
              toggleRecommendation={toggleRecommendation}
              planOwner={planOwner}
              setPlanOwner={setPlanOwner}
              planNotes={planNotes}
              setPlanNotes={setPlanNotes}
              saveImprovementPlan={saveImprovementPlan}
              savingPlan={savingPlan}
              allowPlan
            />
          )}
        </>
      ) : (
        <>
          <article className="card">
            <h3>Analizar URL externa</h3>
            <p className="muted">
              Pega la URL de la landing o sitio actual del cliente para evaluar SEO, AEO e identidad de marca.
            </p>
            <label>
              URL externa
              <input
                value={externalUrl}
                onChange={(event) => setExternalUrl(event.target.value)}
                placeholder="https://sitio-del-cliente.com"
              />
            </label>
            <button className="button" type="button" onClick={runExternalAnalysis} disabled={analyzingExternal}>
              {analyzingExternal ? "Analizando..." : "Analizar URL"}
            </button>
            {externalLatest?.source_url ? (
              <p><strong>Ultima URL analizada:</strong> {externalLatest.source_url}</p>
            ) : null}
          </article>

          {!externalLatest ? (
            <article className="card">
              <h3>Sin diagnostico externo previo</h3>
              <p>Analiza una URL valida para generar score, hallazgos y recomendaciones accionables.</p>
            </article>
          ) : (
            <>
              <article className="card">
                <p><strong>Tipo de analisis:</strong> URL externa</p>
                <p><strong>URL analizada:</strong> {externalLatest.source_url ?? "No disponible"}</p>
                <p><strong>Fecha:</strong> {new Date(externalLatest.analyzed_at).toLocaleString("es-MX")}</p>
                <p><strong>Estado:</strong> {externalLatest.status}</p>
              </article>
              <DiagnosticResult
                diagnostic={externalLatest}
                selected={{
                  high_priority: new Set(externalLatest.recommendations.high_priority),
                  medium_priority: new Set(externalLatest.recommendations.medium_priority),
                  low_priority: new Set(externalLatest.recommendations.low_priority),
                }}
                toggleRecommendation={() => undefined}
                planOwner={planOwner}
                setPlanOwner={setPlanOwner}
                planNotes={planNotes}
                setPlanNotes={setPlanNotes}
                saveImprovementPlan={saveImprovementPlan}
                savingPlan={savingPlan}
                allowPlan={false}
              />
            </>
          )}
        </>
      )}

      <article className="card">
        <h3>Historial de analisis</h3>
        {history.length === 0 ? (
          <p className="muted">Aun no hay analisis guardados para esta marca.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Tipo</th>
                <th>Origen</th>
                <th>Estado</th>
                <th>Score global</th>
              </tr>
            </thead>
            <tbody>
              {history.map((row) => (
                <tr key={row.id}>
                  <td>{new Date(row.analyzed_at).toLocaleString("es-MX")}</td>
                  <td>{row.analysis_type === "external_url" ? "URL externa" : "Marca activa"}</td>
                  <td>{row.source_url ?? "Interno"}</td>
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
