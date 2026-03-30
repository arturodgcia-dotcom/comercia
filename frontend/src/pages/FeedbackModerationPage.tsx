import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../app/AuthContext";
import { PageHeader } from "../components/PageHeader";
import { api } from "../services/api";
import { ProductReview } from "../types/domain";

type FeedbackChannel = "publico" | "distribuidor";
type FeedbackStatus = "pending" | "approved" | "rejected" | "all";

function detectChannel(review: ProductReview): FeedbackChannel {
  const text = `${review.title ?? ""} ${review.comment ?? ""}`.toLowerCase();
  if (text.includes("distribuidor") || text.includes("mayoreo")) return "distribuidor";
  return "publico";
}

export function FeedbackModerationPage() {
  const { token, user } = useAuth();
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [statusFilter, setStatusFilter] = useState<FeedbackStatus>("pending");
  const [channelFilter, setChannelFilter] = useState<"all" | FeedbackChannel>("all");

  useEffect(() => {
    if (!token || !user?.tenant_id) return;
    api.getProductsByTenant(token, user.tenant_id)
      .then(async (products) => {
        const allReviews = await Promise.all(
          products.map((product) => api.getProductReviews(product.id, true))
        );
        setReviews(allReviews.flat());
      })
      .catch((err) => setError(err instanceof Error ? err.message : "No fue posible cargar retroalimentación."));
  }, [token, user?.tenant_id]);

  const filteredReviews = useMemo(() => {
    return reviews.filter((review) => {
      const statusOk = statusFilter === "all" ? true : review.moderation_status === statusFilter;
      const channel = detectChannel(review);
      const channelOk = channelFilter === "all" ? true : channelFilter === channel;
      return statusOk && channelOk;
    });
  }, [reviews, statusFilter, channelFilter]);

  const approve = async (reviewId: number) => {
    if (!token) return;
    try {
      setSaving(true);
      const updated = await api.approveProductReview(token, reviewId);
      setReviews((previous) => previous.map((item) => (item.id === updated.id ? updated : item)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "No fue posible aprobar la reseña.");
    } finally {
      setSaving(false);
    }
  };

  const reject = async (reviewId: number) => {
    if (!token) return;
    try {
      setSaving(true);
      const updated = await api.rejectProductReview(token, reviewId);
      setReviews((previous) => previous.map((item) => (item.id === updated.id ? updated : item)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "No fue posible rechazar la reseña.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section>
      <PageHeader
        title="Retroalimentación moderable"
        subtitle="Gestiona comentarios públicos y comerciales antes de publicación en tienda."
      />
      {error ? <p className="error">{error}</p> : null}

      <section className="store-banner">
        <div className="inline-form">
          <label>
            Estado
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as FeedbackStatus)}>
              <option value="pending">Pendiente</option>
              <option value="approved">Aprobado</option>
              <option value="rejected">Rechazado</option>
              <option value="all">Todos</option>
            </select>
          </label>
          <label>
            Canal
            <select value={channelFilter} onChange={(event) => setChannelFilter(event.target.value as "all" | FeedbackChannel)}>
              <option value="all">Todos</option>
              <option value="publico">Público</option>
              <option value="distribuidor">Distribuidor</option>
            </select>
          </label>
        </div>
      </section>

      <div className="card-grid">
        {filteredReviews.map((review) => {
          const channel = detectChannel(review);
          return (
            <article key={review.id} className="card">
              <h3>{review.title ?? "Comentario sin título"}</h3>
              <p>Calificación: {review.rating}/5</p>
              <p>Canal: {channel === "publico" ? "Público" : "Distribuidor"}</p>
              <p>Estado: {review.moderation_status}</p>
              <p>{review.comment ?? "Sin comentario"}</p>
              <div className="row-gap">
                <button className="button" type="button" disabled={saving} onClick={() => approve(review.id)}>
                  Aprobar
                </button>
                <button className="button button-outline" type="button" disabled={saving} onClick={() => reject(review.id)}>
                  Rechazar
                </button>
              </div>
            </article>
          );
        })}
      </div>
      {filteredReviews.length === 0 ? <p>No hay elementos para los filtros seleccionados.</p> : null}
    </section>
  );
}
