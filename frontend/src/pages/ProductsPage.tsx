import { useEffect, useState } from "react";
import { PageHeader } from "../components/PageHeader";
import { apiGet } from "../services/api";
import { Product } from "../types/domain";

export function ProductsPage() {
  const [items, setItems] = useState<Product[]>([]);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    apiGet<Product[]>("/api/v1/products")
      .then(setItems)
      .catch((err) => setError(err.message));
  }, []);

  return (
    <section>
      <PageHeader title="Products" subtitle="Catalogo multi precio por tenant." />
      {error ? <p className="error">{error}</p> : null}
      <table className="table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Tenant</th>
            <th>Name</th>
            <th>Public</th>
            <th>Wholesale</th>
            <th>Retail</th>
            <th>Featured</th>
            <th>Active</th>
          </tr>
        </thead>
        <tbody>
          {items.map((product) => (
            <tr key={product.id}>
              <td>{product.id}</td>
              <td>{product.tenant_id}</td>
              <td>{product.name}</td>
              <td>{Number(product.price_public).toLocaleString("es-MX")}</td>
              <td>{product.price_wholesale ? Number(product.price_wholesale).toLocaleString("es-MX") : "-"}</td>
              <td>{product.price_retail ? Number(product.price_retail).toLocaleString("es-MX") : "-"}</td>
              <td>{product.is_featured ? "Yes" : "No"}</td>
              <td>{product.is_active ? "Yes" : "No"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
