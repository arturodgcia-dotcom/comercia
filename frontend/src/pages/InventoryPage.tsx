import { useEffect, useState } from "react";
import { useAuth } from "../app/AuthContext";
import { PageHeader } from "../components/PageHeader";
import { api } from "../services/api";
import { Product } from "../types/domain";

export function InventoryPage() {
  const { token, user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token || !user?.tenant_id) return;
    api.getProductsByTenant(token, user.tenant_id)
      .then((data) => setProducts(data))
      .catch((err) => setError(err instanceof Error ? err.message : "No fue posible cargar inventario."));
  }, [token, user?.tenant_id]);

  return (
    <section>
      <PageHeader
        title="Inventario y surtido"
        subtitle="Vista operativa base de stock general por producto. Preparado para stock por almacén y canales."
      />
      {error ? <p className="error">{error}</p> : null}
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Producto</th>
              <th>SKU</th>
              <th>Stock general</th>
              <th>Canal público</th>
              <th>Canal distribuidor</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id}>
                <td>{product.name}</td>
                <td>{product.slug.toUpperCase()}</td>
                <td>{product.is_active ? "Disponible" : "Inactivo"}</td>
                <td>{product.is_active ? "Sí" : "No"}</td>
                <td>{product.price_wholesale ? "Sí" : "No"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
