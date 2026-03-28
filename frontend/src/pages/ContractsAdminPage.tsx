import { FormEvent, useEffect, useState } from "react";
import { useAuth } from "../app/AuthContext";
import { PageHeader } from "../components/PageHeader";
import { api } from "../services/api";
import { ContractTemplate, SignedContract, Tenant } from "../types/domain";

export function ContractsAdminPage() {
  const { token } = useAuth();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [tenantId, setTenantId] = useState<number | null>(null);
  const [templates, setTemplates] = useState<ContractTemplate[]>([]);
  const [signed, setSigned] = useState<SignedContract[]>([]);
  const [editingTemplateId, setEditingTemplateId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    contract_type: "distributor",
    name: "Contrato Distribuidor Base",
    content_markdown: "## Contrato base\n\nAcepto operar como distribuidor autorizado."
  });

  useEffect(() => {
    if (!token) return;
    api.getTenants(token).then((rows) => {
      setTenants(rows);
      setTenantId((prev) => prev ?? rows[0]?.id ?? null);
    });
  }, [token]);

  const load = async (selectedTenantId: number) => {
    if (!token) return;
    const [templateRows, signedRows] = await Promise.all([
      api.getContractTemplates(token, selectedTenantId),
      api.getSignedContractsByTenant(token, selectedTenantId)
    ]);
    setTemplates(templateRows);
    setSigned(signedRows);
  };

  useEffect(() => {
    if (!tenantId) return;
    load(tenantId).catch((err) => setError(err instanceof Error ? err.message : "No fue posible cargar contratos"));
  }, [tenantId, token]);

  const createTemplate = async (event: FormEvent) => {
    event.preventDefault();
    if (!token || !tenantId) return;
    if (editingTemplateId) {
      await api.updateContractTemplate(token, editingTemplateId, form);
    } else {
      await api.createContractTemplate(token, { tenant_id: tenantId, ...form, is_active: true });
    }
    setEditingTemplateId(null);
    await load(tenantId);
  };

  return (
    <section>
      <PageHeader title="Contracts" subtitle="Plantillas y contratos firmados de distribuidores." />
      {error ? <p className="error">{error}</p> : null}
      <div className="row-gap">
        <select value={tenantId ?? ""} onChange={(e) => setTenantId(Number(e.target.value))}>
          {tenants.map((tenant) => (
            <option key={tenant.id} value={tenant.id}>
              {tenant.name}
            </option>
          ))}
        </select>
      </div>

      <form className="detail-form" onSubmit={createTemplate}>
        <label>
          Tipo
          <select value={form.contract_type} onChange={(e) => setForm((p) => ({ ...p, contract_type: e.target.value }))}>
            <option value="distributor">distributor</option>
            <option value="confidentiality">confidentiality</option>
            <option value="generic">generic</option>
          </select>
        </label>
        <label>
          Nombre
          <input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
        </label>
        <label>
          Contenido markdown
          <textarea value={form.content_markdown} onChange={(e) => setForm((p) => ({ ...p, content_markdown: e.target.value }))} />
        </label>
        <button className="button" type="submit">
          {editingTemplateId ? "Actualizar plantilla" : "Guardar plantilla"}
        </button>
      </form>

      <h3>Plantillas</h3>
      <table className="table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Nombre</th>
            <th>Tipo</th>
            <th>Tenant</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {templates.map((item) => (
            <tr key={item.id}>
              <td>{item.id}</td>
              <td>{item.name}</td>
              <td>{item.contract_type}</td>
              <td>{item.tenant_id ?? "Global"}</td>
              <td>
                <button
                  className="button button-outline"
                  type="button"
                  onClick={() => {
                    setEditingTemplateId(item.id);
                    setForm({
                      contract_type: item.contract_type,
                      name: item.name,
                      content_markdown: item.content_markdown
                    });
                  }}
                >
                  Editar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3>Contratos firmados</h3>
      <table className="table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Firmante</th>
            <th>Email</th>
            <th>Fecha</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          {signed.map((item) => (
            <tr key={item.id}>
              <td>{item.id}</td>
              <td>{item.signed_by_name}</td>
              <td>{item.signed_by_email}</td>
              <td>{new Date(item.signed_at).toLocaleString("es-MX")}</td>
              <td>{item.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
