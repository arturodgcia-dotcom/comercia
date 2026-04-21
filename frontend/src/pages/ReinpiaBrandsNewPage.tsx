import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../app/AuthContext";
import { PageHeader } from "../components/PageHeader";
import { ApiError, api } from "../services/api";

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
    acquisition_origin: "reinpia_direct",
    acquisition_commission_agent_id: "",
    acquisition_referral_code: "",
    acquisition_notes: "",
    nervia_sync_enabled: false,
    nervia_customer_identifier: "",
    nervia_marketing_contract_active: false,
  });

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!token || saving) return;
    try {
      setSaving(true);
      setError("");
      const payload = {
        ...form,
        acquisition_commission_agent_id: form.acquisition_commission_agent_id
          ? Number(form.acquisition_commission_agent_id)
          : undefined,
        acquisition_referral_code: form.acquisition_referral_code || undefined,
        acquisition_notes: form.acquisition_notes || undefined,
        nervia_customer_identifier: form.nervia_customer_identifier || undefined,
      };
      const created = await api.createTenant(token, payload);
      navigate(`/reinpia/brands/${created.id}/setup`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "No fue posible crear la marca.";
      if (err instanceof ApiError && err.status === 400 && message.includes("slug o subdomain ya existen")) {
        try {
          const tenants = await api.getTenants(token);
          const existing = tenants.find((tenant) => tenant.slug === form.slug || tenant.subdomain === form.subdomain);
          if (existing) {
            setError(`La marca ya existía (${existing.name}). Redirigiendo al workflow existente.`);
            navigate(`/reinpia/brands/${existing.id}/setup`);
            return;
          }
        } catch {
          // Si falla el lookup, mostramos el error original.
        }
      }
      setError(message);
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
        <h3 style={{ marginTop: 8 }}>Origen comercial de la marca</h3>
        <label>
          Origen
          <select
            value={form.acquisition_origin}
            onChange={(event) =>
              setForm((previous) => ({
                ...previous,
                acquisition_origin: event.target.value,
              }))
            }
          >
            <option value="reinpia_direct">Cliente interno REINPIA</option>
            <option value="comercia_direct">Cliente directo ComerCia</option>
            <option value="nervia_direct">Cliente directo Nervia</option>
            <option value="agency_client">Cliente de agencia externa</option>
            <option value="commission_agent_referral">Referido por comisionista</option>
            <option value="unknown">Origen no clasificado</option>
          </select>
        </label>
        {form.acquisition_origin === "commission_agent_referral" ? (
          <>
            <label>
              ID de comisionista
              <input
                type="number"
                min={1}
                value={form.acquisition_commission_agent_id}
                onChange={(event) =>
                  setForm((previous) => ({ ...previous, acquisition_commission_agent_id: event.target.value }))
                }
              />
            </label>
            <label>
              Código de referencia
              <input
                value={form.acquisition_referral_code}
                onChange={(event) =>
                  setForm((previous) => ({ ...previous, acquisition_referral_code: event.target.value }))
                }
              />
            </label>
          </>
        ) : null}
        <label>
          Notas de origen (opcional)
          <textarea
            value={form.acquisition_notes}
            onChange={(event) => setForm((previous) => ({ ...previous, acquisition_notes: event.target.value }))}
          />
        </label>
        <h3 style={{ marginTop: 8 }}>Activación de comunicación con Nervia</h3>
        <label className="checkbox">
          <input
            type="checkbox"
            checked={form.nervia_sync_enabled}
            onChange={(event) =>
              setForm((previous) => ({ ...previous, nervia_sync_enabled: event.target.checked }))
            }
          />
          Activar comunicación de esta marca con Nervia
        </label>
        {form.nervia_sync_enabled ? (
          <>
            <label>
              Identificador de cliente Nervia
              <input
                placeholder="Ej. NERVIA-CLI-ACME-001"
                value={form.nervia_customer_identifier}
                onChange={(event) =>
                  setForm((previous) => ({ ...previous, nervia_customer_identifier: event.target.value }))
                }
                required={form.nervia_sync_enabled}
              />
            </label>
            <label className="checkbox">
              <input
                type="checkbox"
                checked={form.nervia_marketing_contract_active}
                onChange={(event) =>
                  setForm((previous) => ({ ...previous, nervia_marketing_contract_active: event.target.checked }))
                }
              />
              Contrato de marketing con Nervia activo
            </label>
          </>
        ) : null}
        {error ? <p className="error">{error}</p> : null}
        <button className="button" type="submit" disabled={saving}>
          {saving ? "Creando..." : "Crear marca y abrir workflow"}
        </button>
      </form>
    </section>
  );
}
