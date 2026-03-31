import { useEffect, useState } from "react";
import { useAuth } from "../app/AuthContext";
import { PageHeader } from "../components/PageHeader";
import { api } from "../services/api";
import { DistributorApplication, Tenant } from "../types/domain";

export function DistributorApplicationsAdminPage() {
  const { token } = useAuth();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [tenantId, setTenantId] = useState<number | null>(null);
  const [items, setItems] = useState<DistributorApplication[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;
    api.getTenants(token).then((rows) => {
      setTenants(rows);
      setTenantId((prev) => prev ?? rows[0]?.id ?? null);
    });
  }, [token]);

  const load = async (selectedTenantId: number) => {
    if (!token) return;
    setItems(await api.getDistributorApplicationsByTenant(token, selectedTenantId));
  };

  useEffect(() => {
    if (!tenantId) return;
    load(tenantId).catch((err) => setError(err instanceof Error ? err.message : "No fue posible cargar solicitudes"));
  }, [tenantId, token]);

  const approve = async (id: number) => {
    if (!token || !tenantId) return;
    await api.approveDistributorApplication(token, id);
    await load(tenantId);
  };

  const reject = async (id: number) => {
    if (!token || !tenantId) return;
    await api.rejectDistributorApplication(token, id);
    await load(tenantId);
  };

  return (
    <section>
      <PageHeader title="Solicitudes de distribuidores" subtitle="Revision comercial por marca con aprobacion y rechazo." />
      {error ? <p className="error">{error}</p> : null}
      <article className="card">
        <h3>Marca</h3>
        <select value={tenantId ?? ""} onChange={(e) => setTenantId(Number(e.target.value))}>
          {tenants.map((tenant) => (
            <option key={tenant.id} value={tenant.id}>
              {tenant.name}
            </option>
          ))}
        </select>
      </article>
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Empresa</th>
              <th>Contacto</th>
              <th>Ubicacion</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>{item.id}</td>
                <td>{item.company_name}</td>
                <td>
                  {item.contact_name}
                  <br />
                  {item.email}
                  <br />
                  {item.phone}
                </td>
                <td>{[item.city, item.state, item.country].filter(Boolean).join(", ") || "Sin dato"}</td>
                <td>{item.status}</td>
                <td className="row-gap">
                  <button className="button button-outline" type="button" onClick={() => approve(item.id)} disabled={item.status !== "pending"}>
                    Aprobar
                  </button>
                  <button className="button button-outline" type="button" onClick={() => reject(item.id)} disabled={item.status !== "pending"}>
                    Rechazar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
