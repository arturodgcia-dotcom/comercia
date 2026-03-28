import { useEffect, useState } from "react";
import { PageHeader } from "../components/PageHeader";
import { apiGet } from "../services/api";
import { Category } from "../types/domain";

export function CategoriesPage() {
  const [items, setItems] = useState<Category[]>([]);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    apiGet<Category[]>("/api/v1/categories")
      .then(setItems)
      .catch((err) => setError(err.message));
  }, []);

  return (
    <section>
      <PageHeader title="Categories" subtitle="Categorias de ecommerce por tenant." />
      {error ? <p className="error">{error}</p> : null}
      <table className="table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Tenant</th>
            <th>Name</th>
            <th>Slug</th>
            <th>Active</th>
          </tr>
        </thead>
        <tbody>
          {items.map((category) => (
            <tr key={category.id}>
              <td>{category.id}</td>
              <td>{category.tenant_id}</td>
              <td>{category.name}</td>
              <td>{category.slug}</td>
              <td>{category.is_active ? "Yes" : "No"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
