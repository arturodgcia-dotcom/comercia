import { useEffect, useState } from "react";
import { PageHeader } from "../components/PageHeader";
import { apiGet } from "../services/api";
import { Tenant } from "../types/domain";

export function TenantsPage() {
  const [items, setItems] = useState<Tenant[]>([]);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    apiGet<Tenant[]>("/api/v1/tenants")
      .then(setItems)
      .catch((err) => setError(err.message));
  }, []);

  return (
    <section>
      <PageHeader title="Tenants" subtitle="Marcas, subdominios y estado de activacion." />
      {error ? <p className="error">{error}</p> : null}
      <table className="table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Slug</th>
            <th>Subdomain</th>
            <th>Business Type</th>
            <th>Active</th>
          </tr>
        </thead>
        <tbody>
          {items.map((tenant) => (
            <tr key={tenant.id}>
              <td>{tenant.id}</td>
              <td>{tenant.name}</td>
              <td>{tenant.slug}</td>
              <td>{tenant.subdomain}</td>
              <td>{tenant.business_type}</td>
              <td>{tenant.is_active ? "Yes" : "No"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
