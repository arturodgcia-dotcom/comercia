import { FormEvent, useEffect, useState } from "react";
import { useAuth } from "../app/AuthContext";
import { ModuleOnboardingCard } from "../components/ModuleOnboardingCard";
import { PageHeader } from "../components/PageHeader";
import { api } from "../services/api";
import { Category, Product, Tenant } from "../types/domain";

export function ProductsPage() {
  const { token } = useAuth();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [tenantId, setTenantId] = useState<number | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<Product[]>([]);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    category_id: "",
    price_public: "0",
    price_wholesale: "",
    price_retail: "",
    stripe_product_id: "",
    stripe_price_id_public: "",
    stripe_price_id_retail: "",
    stripe_price_id_wholesale: "",
    is_featured: false
  });

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

  const loadTenantData = async (selectedTenantId: number) => {
    if (!token) return;
    const [products, categoriesByTenant] = await Promise.all([
      api.getProductsByTenant(token, selectedTenantId),
      api.getCategoriesByTenant(token, selectedTenantId)
    ]);
    setItems(products);
    setCategories(categoriesByTenant);
  };

  useEffect(() => {
    if (!tenantId) return;
    loadTenantData(tenantId).catch((err) => setError(err instanceof Error ? err.message : "Error cargando catalogo"));
  }, [token, tenantId]);

  const handleCreate = async (event: FormEvent) => {
    event.preventDefault();
    if (!token || !tenantId) return;
    try {
      setError("");
      await api.createProduct(token, {
        tenant_id: tenantId,
        category_id: form.category_id ? Number(form.category_id) : null,
        name: form.name,
        slug: form.slug,
        description: form.description || undefined,
        price_public: Number(form.price_public),
        price_wholesale: form.price_wholesale ? Number(form.price_wholesale) : undefined,
        price_retail: form.price_retail ? Number(form.price_retail) : undefined,
        stripe_product_id: form.stripe_product_id || undefined,
        stripe_price_id_public: form.stripe_price_id_public || undefined,
        stripe_price_id_retail: form.stripe_price_id_retail || undefined,
        stripe_price_id_wholesale: form.stripe_price_id_wholesale || undefined,
        is_featured: form.is_featured,
        is_active: true
      });
      setForm({
        name: "",
        slug: "",
        description: "",
        category_id: "",
        price_public: "0",
        price_wholesale: "",
        price_retail: "",
        stripe_product_id: "",
        stripe_price_id_public: "",
        stripe_price_id_retail: "",
        stripe_price_id_wholesale: "",
        is_featured: false
      });
      await loadTenantData(tenantId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No fue posible crear producto");
    }
  };

  const toggleFeatured = async (product: Product) => {
    if (!token || !tenantId) return;
    try {
      await api.updateProduct(token, product.id, { is_featured: !product.is_featured });
      await loadTenantData(tenantId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No fue posible actualizar producto");
    }
  };

  const syncStripeDemoIds = async (product: Product) => {
    if (!token || !tenantId) return;
    const key = `${tenantId}-${product.slug}`.replace(/[^a-zA-Z0-9-]/g, "-");
    await api.updateProduct(token, product.id, {
      stripe_product_id: product.stripe_product_id || `prod_local_${key}`,
      stripe_price_id_public: product.stripe_price_id_public || `price_public_${key}`,
      stripe_price_id_retail: product.stripe_price_id_retail || `price_retail_${key}`,
      stripe_price_id_wholesale: product.stripe_price_id_wholesale || `price_wholesale_${key}`,
    });
    await loadTenantData(tenantId);
  };

  return (
    <section>
      <PageHeader title="Productos" subtitle="Catalogo base por marca con sincronizacion Stripe." />
      <ModuleOnboardingCard
        moduleKey="products"
        title="Productos y ecommerce publico"
        whatItDoes="Administra productos, precios por canal y estado de sincronizacion con Stripe."
        whyItMatters="Este modulo alimenta ventas online y define margenes por segmento comercial."
        whatToCapture={["Nombre y SKU", "Precios publico/menudeo/mayoreo", "Categoria", "IDs Stripe"]}
        impact="Mejora conversion en tienda y evita inconsistencias entre catalogo y cobro."
      />
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

      <form className="inline-form" onSubmit={handleCreate}>
        <input required placeholder="Nombre" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
        <input required placeholder="Slug" value={form.slug} onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))} />
        <input placeholder="Descripcion" value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
        <input
          required
          type="number"
          placeholder="Precio publico"
          value={form.price_public}
          onChange={(e) => setForm((p) => ({ ...p, price_public: e.target.value }))}
        />
        <input placeholder="Precio mayoreo" type="number" value={form.price_wholesale} onChange={(e) => setForm((p) => ({ ...p, price_wholesale: e.target.value }))} />
        <input placeholder="Precio menudeo" type="number" value={form.price_retail} onChange={(e) => setForm((p) => ({ ...p, price_retail: e.target.value }))} />
        <input placeholder="Stripe product ID" value={form.stripe_product_id} onChange={(e) => setForm((p) => ({ ...p, stripe_product_id: e.target.value }))} />
        <input placeholder="Stripe price ID publico" value={form.stripe_price_id_public} onChange={(e) => setForm((p) => ({ ...p, stripe_price_id_public: e.target.value }))} />
        <input placeholder="Stripe price ID menudeo" value={form.stripe_price_id_retail} onChange={(e) => setForm((p) => ({ ...p, stripe_price_id_retail: e.target.value }))} />
        <input placeholder="Stripe price ID mayoreo" value={form.stripe_price_id_wholesale} onChange={(e) => setForm((p) => ({ ...p, stripe_price_id_wholesale: e.target.value }))} />
        <select value={form.category_id} onChange={(e) => setForm((p) => ({ ...p, category_id: e.target.value }))}>
          <option value="">Sin categoria</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        <label className="checkbox">
          <input
            type="checkbox"
            checked={form.is_featured}
            onChange={(e) => setForm((p) => ({ ...p, is_featured: e.target.checked }))}
          />
          Destacado
        </label>
        <button className="button" type="submit">
          Crear producto
        </button>
      </form>

      <table className="table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Producto</th>
            <th>Precio publico</th>
            <th>Stripe</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {items.map((product) => (
            <tr key={product.id}>
              <td>{product.id}</td>
              <td>{product.name}</td>
              <td>{Number(product.price_public).toLocaleString("es-MX")}</td>
              <td>
                {product.stripe_product_id ? "Sincronizado" : "Pendiente"}
              </td>
              <td className="row-gap">
                <button className="button button-outline" type="button" onClick={() => toggleFeatured(product)}>
                  {product.is_featured ? "Quitar" : "Marcar"}
                </button>
                <button className="button button-outline" type="button" onClick={() => syncStripeDemoIds(product)}>
                  Sincronizar Stripe
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {items.length === 0 ? (
        <article className="card">
          <p>Aun no hay productos. Aqui veras catalogo y estado de sincronizacion Stripe por producto.</p>
        </article>
      ) : null}
    </section>
  );
}
