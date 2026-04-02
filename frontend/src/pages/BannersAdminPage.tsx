import { FormEvent, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../app/AuthContext";
import { PageHeader } from "../components/PageHeader";
import { api } from "../services/api";
import { Banner, Tenant } from "../types/domain";

export function BannersAdminPage() {
  const { token } = useAuth();
  const { t } = useTranslation();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [tenantId, setTenantId] = useState<number | null>(null);
  const [items, setItems] = useState<Banner[]>([]);
  const [form, setForm] = useState({
    title: "",
    image_url: "",
    target_type: "promotion",
    target_value: "",
    position: "hero",
    priority: 1
  });

  const load = async (id: number) => {
    if (!token) return;
    setItems(await api.getBanners(token, id));
  };

  useEffect(() => {
    if (!token) return;
    api.getTenants(token).then((list) => {
      setTenants(list);
      setTenantId(list[0]?.id ?? null);
    });
  }, [token]);

  useEffect(() => {
    if (!tenantId) return;
    load(tenantId).catch(() => undefined);
  }, [tenantId, token]);

  const create = async (event: FormEvent) => {
    event.preventDefault();
    if (!token || !tenantId) return;
    await api.createBanner(token, { tenant_id: tenantId, ...form, is_active: true });
    setForm({ title: "", image_url: "", target_type: "promotion", target_value: "", position: "hero", priority: 1 });
    await load(tenantId);
  };

  return (
    <section>
      <PageHeader title="Banners" subtitle={t("nav.banners")} />
      <select value={tenantId ?? ""} onChange={(e) => setTenantId(Number(e.target.value))}>
        {tenants.map((tenant) => (
          <option key={tenant.id} value={tenant.id}>
            {tenant.name}
          </option>
        ))}
      </select>
      <form className="inline-form" onSubmit={create}>
        <input required placeholder={t("common.name")} value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} />
        <input placeholder={t("banners.imageUrl")} value={form.image_url} onChange={(e) => setForm((p) => ({ ...p, image_url: e.target.value }))} />
        <select value={form.target_type} onChange={(e) => setForm((p) => ({ ...p, target_type: e.target.value }))}>
          <option value="promotion">{t("banners.typePromotion")}</option>
          <option value="product">{t("banners.typeProduct")}</option>
          <option value="category">{t("banners.typeCategory")}</option>
          <option value="url">{t("banners.typeUrl")}</option>
        </select>
        <input placeholder={t("banners.targetValue")} value={form.target_value} onChange={(e) => setForm((p) => ({ ...p, target_value: e.target.value }))} />
        <select value={form.position} onChange={(e) => setForm((p) => ({ ...p, position: e.target.value }))}>
          <option value="hero">{t("banners.posHero")}</option>
          <option value="store_top">{t("banners.posStoreTop")}</option>
          <option value="distributors_top">{t("banners.posDistributorsTop")}</option>
          <option value="checkout_upsell">{t("banners.posCheckoutUpsell")}</option>
        </select>
        <input type="number" value={form.priority} onChange={(e) => setForm((p) => ({ ...p, priority: Number(e.target.value) }))} />
        <button className="button" type="submit">
          {t("banners.createBanner")}
        </button>
      </form>
      <table className="table">
        <thead>
          <tr>
            <th>ID</th>
            <th>{t("common.name")}</th>
            <th>{t("security.action")}</th>
            <th>Target</th>
            <th>Prioridad</th>
          </tr>
        </thead>
        <tbody>
          {items.map((banner) => (
            <tr key={banner.id}>
              <td>{banner.id}</td>
              <td>{banner.title}</td>
              <td>{banner.position}</td>
              <td>
                {banner.target_type}: {banner.target_value}
              </td>
              <td>{banner.priority}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
