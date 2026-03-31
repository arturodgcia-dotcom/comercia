import { FormEvent, useEffect, useState } from "react";
import { useAuth } from "../app/AuthContext";
import { PageHeader } from "../components/PageHeader";
import { api } from "../services/api";
import { PosLocation } from "../types/domain";

const LOCATION_LABELS: Record<string, string> = {
  brand_store: "Punto de marca",
  franchise: "Franquicia",
  distributor_point: "Punto distribuidor",
};

export function PosLocationsPage() {
  const { token, user } = useAuth();
  const tenantId = user?.tenant_id ?? 1;
  const [locations, setLocations] = useState<PosLocation[]>([]);
  const [form, setForm] = useState({ name: "", code: "", location_type: "brand_store", address: "" });

  const load = () => token && api.getPosLocations(token, tenantId).then(setLocations);
  useEffect(() => { load(); }, [token, tenantId]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!token) return;
    await api.createPosLocation(token, { tenant_id: tenantId, ...form, is_active: true });
    setForm({ name: "", code: "", location_type: "brand_store", address: "" });
    load();
  };

  return (
    <section>
      <PageHeader title="POS Ubicaciones" subtitle="Punto propio, franquicia o distribuidor." />
      <form className="inline-form" onSubmit={handleSubmit}>
        <input placeholder="Nombre" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
        <input placeholder="Codigo" value={form.code} onChange={(e) => setForm((p) => ({ ...p, code: e.target.value.toUpperCase() }))} />
        <select value={form.location_type} onChange={(e) => setForm((p) => ({ ...p, location_type: e.target.value }))}>
          <option value="brand_store">Punto de marca</option>
          <option value="franchise">Franquicia</option>
          <option value="distributor_point">Punto distribuidor</option>
        </select>
        <input placeholder="Direccion" value={form.address} onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))} />
        <button className="button" type="submit">Crear ubicacion</button>
      </form>
      <table className="table">
        <thead>
          <tr><th>ID</th><th>Nombre</th><th>Codigo</th><th>Tipo</th><th>Direccion</th><th>Activo</th></tr>
        </thead>
        <tbody>
          {locations.map((location) => (
            <tr key={location.id}>
              <td>{location.id}</td>
              <td>{location.name}</td>
              <td>{location.code}</td>
              <td>{LOCATION_LABELS[location.location_type] ?? location.location_type}</td>
              <td>{location.address}</td>
              <td>{location.is_active ? "Si" : "No"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
