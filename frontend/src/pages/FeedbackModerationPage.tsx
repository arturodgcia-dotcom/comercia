import { useEffect, useState } from "react";
import { useAuth } from "../app/AuthContext";
import { PageHeader } from "../components/PageHeader";
import { api } from "../services/api";
import { ProductReview } from "../types/domain";

export function FeedbackModerationPage() {
  const { token, user } = useAuth();
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!token || !user?.tenant_id) return;
    api.getProductsByTenant(token, user.tenant_id)
      .then(async (products) => {
        const allReviews = await Promise.all(products.map((product) => api.getProductReviews(product.id, true)));
        setReviews(allReviews.flat().filter((review) => !review.is_approved));
      })
      .catch((err) => setError(err instanceof Error ? err.message : "No fue posible cargar retroalimentación."));
  }, [token, user?.tenant_id]);

  const approve = async (reviewId: number) => {
    if (!token) return;
    try {
      setSaving(true);
      await api.approveProductReview(token, reviewId);
      setReviews((previous) => previous.filter((item) => item.id !== reviewId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "No fue posible aprobar la reseña.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section>
      <PageHeader
        title="Retroalimentación moderable"
        subtitle="Aprueba o rechaza comentarios antes de publicarlos en tienda."
      />
      {error ? <p className="error">{error}</p> : null}
      <div className="card-grid">
        {reviews.map((review) => (
          <article key={review.id} className="card">
            <h3>{review.title ?? "Comentario sin título"}</h3>
            <p>Calificación: {review.rating}/5</p>
            <p>{review.comment ?? "Sin comentario"}</p>
            <button className="button" type="button" disabled={saving} onClick={() => approve(review.id)}>
              Aprobar publicación
            </button>
          </article>
        ))}
      </div>
      {reviews.length === 0 ? <p>No hay comentarios pendientes de moderación.</p> : null}
    </section>
  );
}
