import { FormEvent, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../services/api";
import { Tenant } from "../types/domain";

export function DistributorRegistrationPage() {
  const { tenantSlug } = useParams();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState({
    company_name: "",
    contact_name: "",
    email: "",
    phone: "",
    city: "",
    state: "",
    country: "MX",
    notes: ""
  });

  useEffect(() => {
    if (!tenantSlug) return;
    api
      .getStorefront(tenantSlug)
      .then((payload) => setTenant(payload.tenant))
      .catch((err) => setError(err instanceof Error ? err.message : "No fue posible cargar tienda"));
  }, [tenantSlug]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!tenant) return;
    try {
      await api.createDistributorApplication({ tenant_id: tenant.id, ...form });
      setSuccess("Solicitud enviada. Revisaremos tu perfil y te contactaremos.");
      setForm({
        company_name: "",
        contact_name: "",
        email: "",
        phone: "",
        city: "",
        state: "",
        country: "MX",
        notes: ""
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "No fue posible enviar solicitud");
    }
  };

  if (error) return <p className="error">{error}</p>;
  if (!tenant) return <p>Cargando...</p>;

  return (
    <main className="storefront">
      <section className="store-hero">
        <h1>Registro de distribuidores</h1>
        <p>Marca: {tenant.name}</p>
        <div className="store-actions">
          <Link className="button button-outline" to={`/store/${tenant.slug}/distribuidores`}>
            Volver
          </Link>
          <Link className="button button-outline" to={`/store/${tenant.slug}/distribuidores/login-placeholder`}>
            Login placeholder
          </Link>
        </div>
      </section>
      <section className="store-banner">
        <form className="detail-form" onSubmit={submit}>
          <label>
            Empresa
            <input required value={form.company_name} onChange={(e) => setForm((p) => ({ ...p, company_name: e.target.value }))} />
          </label>
          <label>
            Contacto
            <input required value={form.contact_name} onChange={(e) => setForm((p) => ({ ...p, contact_name: e.target.value }))} />
          </label>
          <label>
            Email
            <input required value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} />
          </label>
          <label>
            Telefono
            <input required value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} />
          </label>
          <label>
            Ciudad
            <input value={form.city} onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))} />
          </label>
          <label>
            Estado
            <input value={form.state} onChange={(e) => setForm((p) => ({ ...p, state: e.target.value }))} />
          </label>
          <label>
            Pais
            <input value={form.country} onChange={(e) => setForm((p) => ({ ...p, country: e.target.value }))} />
          </label>
          <label>
            Notas
            <textarea value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} />
          </label>
          <button className="button" type="submit">
            Enviar solicitud
          </button>
        </form>
        {success ? <p>{success}</p> : null}
      </section>
    </main>
  );
}

