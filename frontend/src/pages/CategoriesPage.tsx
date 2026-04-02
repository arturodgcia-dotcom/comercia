import { FormEvent, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../app/AuthContext";
import { PageHeader } from "../components/PageHeader";
import { api } from "../services/api";
import { Category, Tenant } from "../types/domain";

export function CategoriesPage() {
  const { token } = useAuth();
  const { t } = useTranslation();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [tenantId, setTenantId] = useState<number | null>(null);
  const [items, setItems] = useState<Category[]>([]);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", slug: "", description: "" });

  const selectedTenant = useMemo(() => tenants.find((tenant) => tenant.id === tenantId), [tenantId, tenants]);

  useEffect(() => {
    if (!token) return;
    api
      .getTenants(token)
      .then((list) => {
        setTenants(list);
        setTenantId((prev) => prev ?? (list[0]?.id ?? null));
      })
      .catch((err) => setError(err instanceof Error ? err.message : "No fue posible cargar tenants"));
  }, [token]);

  useEffect(() => {
    if (!token || !tenantId) return;
    api
      .getCategoriesByTenant(token, tenantId)
      .then(setItems)
      .catch((err) => setError(err instanceof Error ? err.message : "No fue posible cargar categorias"));
  }, [token, tenantId]);

  const handleCreate = async (event: FormEvent) => {
    event.preventDefault();
    if (!token || !tenantId) return;
    try {
      await api.createCategory(token, { tenant_id: tenantId, ...form, is_active: true });
      setForm({ name: "", slug: "", description: "" });
      setItems(await api.getCategoriesByTenant(token, tenantId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "No fue posible crear categoria");
    }
  };

  const toggleActive = async (category: Category) => {
    if (!token) return;
    try {
      await api.updateCategory(token, category.id, { is_active: !category.is_active });
      if (tenantId) setItems(await api.getCategoriesByTenant(token, tenantId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "No fue posible actualizar categoria");
    }
  };

  return (
    <section>
      <PageHeader title={t("nav.categories")} subtitle="Administración de categorías por marca." />
      {error ? <p className="error">{error}</p> : null}
      <div className="row-gap">
        <select value={tenantId ?? ""} onChange={(e) => setTenantId(Number(e.target.value))}>
          {tenants.map((tenant) => (
            <option key={tenant.id} value={tenant.id}>
              {tenant.name} ({tenant.slug})
            </option>
          ))}
        </select>
        <span>{t("filter.brand")} activa: {selectedTenant?.name ?? "N/A"}</span>
      </div>
      <form className="inline-form" onSubmit={handleCreate}>
        <input value={form.name} placeholder={t("common.name")} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} required />
        <input value={form.slug} placeholder={t("common.slug")} onChange={(e) => setForm((prev) => ({ ...prev, slug: e.target.value }))} required />
        <input
          value={form.description}
          placeholder={t("common.description")}
          onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
        />
        <button className="button" type="submit">
          {t("common.create")} {t("nav.categories").toLowerCase()}
        </button>
      </form>

      <table className="table">
        <thead>
          <tr>
            <th>ID</th>
            <th>{t("common.name")}</th>
            <th>{t("common.slug")}</th>
            <th>{t("common.description")}</th>
            <th>{t("common.active")}</th>
          </tr>
        </thead>
        <tbody>
          {items.map((category) => (
            <tr key={category.id}>
              <td>{category.id}</td>
              <td>{category.name}</td>
              <td>{category.slug}</td>
              <td>{category.description}</td>
              <td>
                <button className="button button-outline" type="button" onClick={() => toggleActive(category)}>
                  {category.is_active ? t("security.deactivate") : t("security.activate")}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
