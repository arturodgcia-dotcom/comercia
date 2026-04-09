import { FormEvent, useEffect, useMemo, useState } from "react";
import { useAuth } from "../app/AuthContext";
import { PageHeader } from "../components/PageHeader";
import { api } from "../services/api";
import { MarketingProspect } from "../types/domain";

const STATUS_OPTIONS = [
  { label: "Todos", value: "" },
  { label: "Nuevo", value: "nuevo" },
  { label: "Revisado", value: "revisado" },
  { label: "Contactado", value: "contactado" },
  { label: "Propuesta enviada", value: "propuesta_enviada" },
  { label: "En negociacion", value: "en_negociacion" },
  { label: "Ganado", value: "ganado" },
  { label: "Perdido", value: "perdido" },
];

const URGENCY_OPTIONS = [
  { label: "Todas", value: "" },
  { label: "Inmediata", value: "inmediata" },
  { label: "Alta", value: "alta" },
  { label: "Media", value: "media" },
  { label: "Baja", value: "baja" },
];

export function ReinpiaMarketingProspectsPage() {
  const { token } = useAuth();
  const [rows, setRows] = useState<MarketingProspect[]>([]);
  const [selected, setSelected] = useState<MarketingProspect | null>(null);
  const [status, setStatus] = useState("");
  const [urgency, setUrgency] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const load = () => {
    if (!token) return;
    setLoading(true);
    setError("");
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (urgency) params.set("urgency", urgency);
    api
      .getReinpiaMarketingProspects(token, params.toString())
      .then((data) => {
        setRows(data);
        setSelected((prev) => (prev ? data.find((item) => item.id === prev.id) ?? null : null));
      })
      .catch((err) => setError(err instanceof Error ? err.message : "No fue posible cargar prospectos de mercadotecnia."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [token, status, urgency]);

  const filtered = useMemo(() => {
    if (!search.trim()) return rows;
    const q = search.trim().toLowerCase();
    return rows.filter((row) =>
      [row.contact_name, row.company_brand, row.contact_email, row.contact_phone ?? "", row.industry ?? "", row.desired_conversion_channel]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [rows, search]);

  const openDetail = async (row: MarketingProspect) => {
    if (!token) return;
    setError("");
    try {
      const detail = await api.getReinpiaMarketingProspectById(token, row.id);
      setSelected(detail);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No fue posible abrir el detalle.");
    }
  };

  const saveDetail = async (event: FormEvent) => {
    event.preventDefault();
    if (!token || !selected) return;
    try {
      setSaving(true);
      setError("");
      setMessage("");
      const updated = await api.updateReinpiaMarketingProspect(token, selected.id, {
        status: selected.status,
        internal_notes: selected.internal_notes ?? "",
        responsible_user_id: selected.responsible_user_id ?? null,
      });
      setSelected(updated);
      setMessage("Prospecto actualizado correctamente.");
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No fue posible guardar el prospecto.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section>
      <PageHeader
        title="Prospectos MKT"
        subtitle="Gestion interna de solicitudes de mercadotecnia con diagnostico ejecutivo y precotizacion."
      />

      <section className="store-banner">
        <h3>Filtros</h3>
        <div className="inline-form">
          <label>
            Estatus
            <select value={status} onChange={(event) => setStatus(event.target.value)}>
              {STATUS_OPTIONS.map((item) => (
                <option key={item.value} value={item.value}>{item.label}</option>
              ))}
            </select>
          </label>
          <label>
            Urgencia
            <select value={urgency} onChange={(event) => setUrgency(event.target.value)}>
              {URGENCY_OPTIONS.map((item) => (
                <option key={item.value} value={item.value}>{item.label}</option>
              ))}
            </select>
          </label>
          <label>
            Buscar
            <input
              placeholder="Nombre, empresa, correo o canal"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
          <button type="button" className="button button-outline" onClick={load}>
            Actualizar
          </button>
        </div>
      </section>

      {loading ? <p>Cargando prospectos...</p> : null}
      {error ? <p className="error">{error}</p> : null}
      {message ? <p>{message}</p> : null}

      <div className="card-grid" style={{ gridTemplateColumns: "1.25fr 1fr" }}>
        <article className="card">
          <h3>Solicitudes captadas</h3>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Empresa</th>
                  <th>Contacto</th>
                  <th>Canal</th>
                  <th>Urgencia</th>
                  <th>Estatus</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => (
                  <tr key={row.id} onClick={() => void openDetail(row)} style={{ cursor: "pointer" }}>
                    <td>{new Date(row.created_at).toLocaleString("es-MX")}</td>
                    <td>{row.company_brand}</td>
                    <td>{row.contact_name}</td>
                    <td>{row.desired_conversion_channel}</td>
                    <td>{row.urgency}</td>
                    <td>{row.status}</td>
                  </tr>
                ))}
                {!filtered.length ? (
                  <tr>
                    <td colSpan={6}>No hay prospectos para los filtros actuales.</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </article>

        <article className="card">
          <h3>Detalle interno</h3>
          {!selected ? <p>Selecciona un prospecto para ver diagnostico y precotizacion interna.</p> : null}
          {selected ? (
            <form className="detail-form" onSubmit={saveDetail}>
              <p><strong>Empresa:</strong> {selected.company_brand}</p>
              <p><strong>Contacto:</strong> {selected.contact_name}</p>
              <p><strong>Email:</strong> {selected.contact_email}</p>
              <p><strong>Telefono:</strong> {selected.contact_phone ?? "-"}</p>
              <p><strong>Ubicacion:</strong> {selected.location ?? "-"}</p>
              <p><strong>Industria:</strong> {selected.industry ?? "-"}</p>
              <p><strong>Canal deseado:</strong> {selected.desired_conversion_channel}</p>
              <p><strong>Urgencia:</strong> {selected.urgency}</p>
              <p><strong>Seguimiento:</strong> {selected.followup_level}</p>
              <p><strong>Resumen interno:</strong> {selected.internal_summary}</p>
              <p>
                <strong>Precotizacion sugerida:</strong> $
                {Number(selected.suggested_price_mxn).toLocaleString("es-MX")} MXN + IVA
                {" | "}Rango: ${Number(selected.suggested_price_min_mxn).toLocaleString("es-MX")} - $
                {Number(selected.suggested_price_max_mxn).toLocaleString("es-MX")} MXN
              </p>
              <h4>Diagnostico ejecutivo interno</h4>
              <ul className="marketing-list">
                {selected.internal_sections.map((section) => (
                  <li key={section.title}>
                    <strong>{section.title}:</strong> {section.body}
                  </li>
                ))}
              </ul>
              <h4>Servicios recomendados</h4>
              <ul className="marketing-list">
                {selected.recommended_services.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <h4>Riesgos y consideraciones</h4>
              <ul className="marketing-list">
                {selected.risks.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <label>
                Notas internas
                <textarea
                  value={selected.internal_notes ?? ""}
                  onChange={(event) => setSelected((prev) => (prev ? { ...prev, internal_notes: event.target.value } : prev))}
                />
              </label>
              <label>
                Estatus comercial
                <select
                  value={selected.status}
                  onChange={(event) => setSelected((prev) => (prev ? { ...prev, status: event.target.value } : prev))}
                >
                  {STATUS_OPTIONS.filter((item) => item.value).map((item) => (
                    <option key={item.value} value={item.value}>{item.label}</option>
                  ))}
                </select>
              </label>
              <label>
                Responsable (ID usuario, opcional)
                <input
                  type="number"
                  value={selected.responsible_user_id ?? ""}
                  onChange={(event) =>
                    setSelected((prev) => (prev ? { ...prev, responsible_user_id: event.target.value ? Number(event.target.value) : null } : prev))
                  }
                />
              </label>
              <button className="button" type="submit" disabled={saving}>
                {saving ? "Guardando..." : "Guardar cambios"}
              </button>
            </form>
          ) : null}
        </article>
      </div>
    </section>
  );
}
