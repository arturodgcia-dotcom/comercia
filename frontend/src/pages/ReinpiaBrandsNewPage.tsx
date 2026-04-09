import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../app/AuthContext";
import { PageHeader } from "../components/PageHeader";
import { api } from "../services/api";

export function ReinpiaBrandsNewPage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    slug: "",
    subdomain: "",
    business_type: "mixed",
    is_active: true,
    billing_model: "fixed_subscription",
    commission_percentage: 3,
    commission_scope: "ventas_online_pagadas",
    commission_notes: "",
  });

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!token) return;
    try {
      setSaving(true);
      setError("");
      const created = await api.createTenant(token, form);
      navigate(`/reinpia/brands/${created.id}/setup`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No fue posible crear la marca.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section>
      <PageHeader
        title="Nueva marca cliente"
        subtitle="ComerCia administra marcas hijas. Crea la marca y continúa con el workflow guiado."
      />
      <form className="card" onSubmit={handleSubmit}>
        <label>
          Nombre de marca
          <input
            value={form.name}
            onChange={(event) =>
              setForm((previous) => ({ ...previous, name: event.target.value }))
            }
            required
          />
        </label>
        <label>
          Slug
          <input
            value={form.slug}
            onChange={(event) =>
              setForm((previous) => ({
                ...previous,
                slug: event.target.value.toLowerCase().replace(/\s+/g, "-"),
              }))
            }
            required
          />
        </label>
        <label>
          Subdominio lógico
          <input
            value={form.subdomain}
            onChange={(event) =>
              setForm((previous) => ({ ...previous, subdomain: event.target.value.toLowerCase() }))
            }
            required
          />
        </label>
        <label>
          Tipo de negocio
          <select
            value={form.business_type}
            onChange={(event) =>
              setForm((previous) => ({ ...previous, business_type: event.target.value }))
            }
          >
            <option value="products">Productos</option>
            <option value="services">Servicios</option>
            <option value="mixed">Mixto</option>
          </select>
        </label>
        <label className="checkbox">
          <input
            type="checkbox"
            checked={form.is_active}
            onChange={(event) =>
              setForm((previous) => ({ ...previous, is_active: event.target.checked }))
            }
          />
          Marca activa
        </label>
        <label>
          Modelo comercial
          <select
            value={form.billing_model}
            onChange={(event) =>
              setForm((previous) => ({
                ...previous,
                billing_model: event.target.value,
                commission_percentage: event.target.value === "commission_based" ? Math.max(previous.commission_percentage, 1) : 0,
              }))
            }
          >
            <option value="fixed_subscription">Cuota fija</option>
            <option value="commission_based">Comision por venta</option>
          </select>
        </label>
        {form.billing_model === "commission_based" ? (
          <>
            <label>
              Porcentaje de comision (%)
              <input
                type="number"
                min={0.1}
                step={0.1}
                value={form.commission_percentage}
                onChange={(event) =>
                  setForm((previous) => ({ ...previous, commission_percentage: Number(event.target.value || 0) }))
                }
              />
            </label>
            <label>
              Notas internas (opcional)
              <textarea
                value={form.commission_notes}
                onChange={(event) => setForm((previous) => ({ ...previous, commission_notes: event.target.value }))}
              />
            </label>
          </>
        ) : (
          <p className="muted">La cuota fija no cobra porcentaje sobre venta.</p>
        )}
        {error ? <p className="error">{error}</p> : null}
        <button className="button" type="submit" disabled={saving}>
          {saving ? "Creando..." : "Crear marca y abrir workflow"}
        </button>
      </form>
    </section>
  );
}
