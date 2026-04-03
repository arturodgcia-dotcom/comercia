import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../app/AuthContext";
import { PageHeader } from "../components/PageHeader";
import { api } from "../services/api";
import { BrandDiagnosticSummary } from "../types/domain";

export function ReinpiaDiagnosticsPage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [rows, setRows] = useState<BrandDiagnosticSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;
    api
      .getReinpiaDiagnostics(token)
      .then((result) => setRows(result))
      .catch((err) => setError(err instanceof Error ? err.message : "No fue posible cargar diagnósticos globales."))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return <p className="muted">Cargando diagnósticos globales...</p>;
  if (error) return <p className="error">{error}</p>;

  return (
    <section>
      <PageHeader
        title="Diagnósticos globales"
        subtitle="Listado base de diagnósticos inteligentes ejecutados por marca en la plataforma."
      />
      <article className="card">
        {rows.length === 0 ? (
          <p className="muted">Aún no hay diagnósticos registrados.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Marca</th>
                <th>Fecha</th>
                <th>Score global</th>
                <th>Estado</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td>{row.brand_name}</td>
                  <td>{new Date(row.analyzed_at).toLocaleString("es-MX")}</td>
                  <td>{row.global_score}</td>
                  <td>{row.status}</td>
                  <td>
                    <button className="button button-outline" type="button" onClick={() => navigate("/admin/diagnostico-inteligente")}>
                      Ver
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </article>
    </section>
  );
}

