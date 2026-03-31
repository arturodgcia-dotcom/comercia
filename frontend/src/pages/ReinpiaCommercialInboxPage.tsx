import { FormEvent, useEffect, useMemo, useState } from "react";
import { useAuth } from "../app/AuthContext";
import { PageHeader } from "../components/PageHeader";
import { api } from "../services/api";
import { CustomerContactLead } from "../types/domain";

const STATUS_OPTIONS = [
  { label: "Todos", value: "" },
  { label: "Nuevo", value: "nuevo" },
  { label: "En seguimiento", value: "en_seguimiento" },
  { label: "Contactado", value: "contactado" },
  { label: "Agendado", value: "agendado" },
  { label: "Cerrado ganado", value: "cerrado_ganado" },
  { label: "Cerrado perdido", value: "cerrado_perdido" },
];

const CHANNEL_OPTIONS = [
  { label: "Todos", value: "" },
  { label: "Lía widget", value: "lia_widget" },
  { label: "Contáctanos", value: "contacto" },
  { label: "Diagnóstico", value: "diagnostico" },
  { label: "WhatsApp", value: "whatsapp" },
];

export function ReinpiaCommercialInboxPage() {
  const { token } = useAuth();
  const [rows, setRows] = useState<CustomerContactLead[]>([]);
  const [status, setStatus] = useState("");
  const [channel, setChannel] = useState("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<CustomerContactLead | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = () => {
    if (!token) return;
    setLoading(true);
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (channel) params.set("channel", channel);
    api
      .getReinpiaCustomerContactLeads(token, params.toString())
      .then((data) => {
        setRows(data);
        setSelected((prev) => (prev ? data.find((r) => r.id === prev.id) ?? prev : null));
      })
      .catch((err) => setError(err instanceof Error ? err.message : "No fue posible cargar la bandeja comercial."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [token, status, channel]);

  const filteredRows = useMemo(() => {
    if (!search.trim()) return rows;
    const q = search.trim().toLowerCase();
    return rows.filter((row) =>
      [row.name, row.company ?? "", row.email, row.phone ?? "", row.message, row.contact_reason, row.channel]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [rows, search]);

  const updateStatus = async (event: FormEvent) => {
    event.preventDefault();
    if (!token || !selected) return;
    await api.updateReinpiaCustomerContactLead(token, selected.id, { status: selected.status });
    load();
  };

  return (
    <section>
      <PageHeader
        title="Inbox comercial"
        subtitle="Atiende mensajes de Contáctanos, diagnósticos y leads de Lía desde una sola bandeja."
      />

      <section className="store-banner">
        <h3>Filtros</h3>
        <div className="inline-form">
          <label>
            Estatus
            <select value={status} onChange={(event) => setStatus(event.target.value)}>
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
          <label>
            Canal
            <select value={channel} onChange={(event) => setChannel(event.target.value)}>
              {CHANNEL_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <div className="row-gap" style={{ marginBottom: 12 }}>
        <input
          placeholder="Buscar por nombre, empresa, correo o mensaje"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          style={{ minWidth: 320 }}
        />
        <button type="button" className="button button-outline" onClick={load}>Actualizar</button>
      </div>

      {loading ? <p>Cargando bandeja comercial...</p> : null}
      {error ? <p className="error">{error}</p> : null}

      <div className="card-grid" style={{ gridTemplateColumns: "1.3fr 1fr" }}>
        <article className="card">
          <h3>Mensajes y leads</h3>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Nombre</th>
                  <th>Empresa</th>
                  <th>Canal</th>
                  <th>Estatus</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row) => (
                  <tr key={row.id} onClick={() => setSelected(row)} style={{ cursor: "pointer" }}>
                    <td>{new Date(row.created_at).toLocaleString("es-MX")}</td>
                    <td>{row.name}</td>
                    <td>{row.company ?? "-"}</td>
                    <td>{row.channel}</td>
                    <td>{row.status}</td>
                  </tr>
                ))}
                {!filteredRows.length ? (
                  <tr>
                    <td colSpan={5}>No hay registros para los filtros actuales.</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </article>

        <article className="card">
          <h3>Detalle y seguimiento</h3>
          {!selected ? <p>Selecciona un registro para revisar detalles y cambiar estatus.</p> : null}
          {selected ? (
            <>
              <p><strong>Nombre:</strong> {selected.name}</p>
              <p><strong>Empresa:</strong> {selected.company ?? "-"}</p>
              <p><strong>Email:</strong> {selected.email}</p>
              <p><strong>Teléfono:</strong> {selected.phone ?? "-"}</p>
              <p><strong>Canal:</strong> {selected.channel}</p>
              <p><strong>Motivo:</strong> {selected.contact_reason}</p>
              <p><strong>Plan recomendado:</strong> {selected.recommended_plan ?? "-"}</p>
              <p><strong>Mensaje:</strong> {selected.message}</p>

              <form className="detail-form" onSubmit={updateStatus}>
                <label>
                  Estatus
                  <select
                    value={selected.status}
                    onChange={(event) => setSelected((prev) => (prev ? { ...prev, status: event.target.value } : prev))}
                  >
                    {STATUS_OPTIONS.filter((option) => option.value).map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </label>
                <button className="button" type="submit">Guardar estatus</button>
              </form>
            </>
          ) : null}
        </article>
      </div>
    </section>
  );
}
