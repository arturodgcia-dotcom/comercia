import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../app/AuthContext";
import { PageHeader } from "../components/PageHeader";
import { api } from "../services/api";
import { Product, ProductReview, Tenant } from "../types/domain";

export function ReviewsAdminPage() {
  const { token } = useAuth();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [tenantId, setTenantId] = useState<number | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [error, setError] = useState("");

  const pending = useMemo(() => reviews.filter((review) => !review.is_approved), [reviews]);

  useEffect(() => {
    if (!token) return;
    api.getTenants(token).then((list) => {
      setTenants(list);
      setTenantId(list[0]?.id ?? null);
    });
  }, [token]);

  useEffect(() => {
    if (!token || !tenantId) return;
    api
      .getProductsByTenant(token, tenantId)
      .then(async (productList) => {
        setProducts(productList);
        const reviewsByProduct = await Promise.all(
          productList.slice(0, 25).map((product) => api.getProductReviews(product.id, true))
        );
        setReviews(reviewsByProduct.flat().filter((review) => review.tenant_id === tenantId));
      })
      .catch((err) => setError(err instanceof Error ? err.message : "No fue posible cargar reseñas"));
  }, [token, tenantId]);

  const approve = async (reviewId: number) => {
    if (!token) return;
    await api.approveProductReview(token, reviewId);
    setReviews((prev) => prev.map((review) => (review.id === reviewId ? { ...review, is_approved: true } : review)));
  };

  return (
    <section>
      <PageHeader title="Reviews Moderation" subtitle="Reseñas nuevas pendientes de aprobación antes de publicación." />
      {error ? <p className="error">{error}</p> : null}
      <select value={tenantId ?? ""} onChange={(e) => setTenantId(Number(e.target.value))}>
        {tenants.map((tenant) => (
          <option key={tenant.id} value={tenant.id}>
            {tenant.name}
          </option>
        ))}
      </select>

      <table className="table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Product</th>
            <th>Rating</th>
            <th>Title</th>
            <th>Comment</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {pending.map((review) => (
            <tr key={review.id}>
              <td>{review.id}</td>
              <td>{products.find((product) => product.id === review.product_id)?.name ?? review.product_id}</td>
              <td>{review.rating}</td>
              <td>{review.title}</td>
              <td>{review.comment}</td>
              <td>
                <button className="button" type="button" onClick={() => approve(review.id)}>
                  Aprobar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
