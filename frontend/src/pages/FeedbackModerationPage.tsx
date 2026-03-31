import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../app/AuthContext";
import { ModuleOnboardingCard } from "../components/ModuleOnboardingCard";
import { PageHeader } from "../components/PageHeader";
import { api } from "../services/api";
import { Product, ProductReview } from "../types/domain";

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
  const [productsById, setProductsById] = useState<Record<number, Product>>({});
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [statusFilter, setStatusFilter] = useState<FeedbackStatus>("pending");
  const [channelFilter, setChannelFilter] = useState<"all" | FeedbackChannel>("all");

  useEffect(() => {
    if (!token || !user?.tenant_id) return;
    api.getProductsByTenant(token, user.tenant_id)
      .then(async (products) => {
        const productMap = products.reduce<Record<number, Product>>((acc, product) => {
          acc[product.id] = product;
          return acc;
        }, {});
        setProductsById(productMap);
        const allReviews = await Promise.all(products.map((product) => api.getProductReviews(product.id, true)));
        setReviews(allReviews.flat());
      })
      .catch((err) => setError(err instanceof Error ? err.message : "No fue posible cargar retroalimentacion."));
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
      setError(err instanceof Error ? err.message : "No fue posible aprobar la resena.");
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
      setError(err instanceof Error ? err.message : "No fue posible rechazar la resena.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section>
      <PageHeader title="Retroalimentacion moderable" subtitle="Comentarios de publico y distribuidores con control antes de publicar." />
      <ModuleOnboardingCard
        moduleKey="feedback"
        title="Retroalimentacion y moderacion"
        whatItDoes="Centraliza comentarios y resenas para aprobar, rechazar o mantener en revision."
        whyItMatters="Protege reputacion y permite aprender del cliente antes de publicar contenido."
        whatToCapture={["Estado de moderacion", "Canal de origen", "Comentario y calificacion", "Producto o servicio relacionado"]}
        impact="Mejora confianza de marca y calidad de contenido publico."
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
              <option value="publico">Publico</option>
              <option value="distribuidor">Distribuidor</option>
            </select>
          </label>
        </div>
      </section>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Quien comento</th>
              <th>Canal</th>
              <th>Producto/servicio</th>
              <th>Comentario</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredReviews.map((review) => {
              const channel = detectChannel(review);
              const product = productsById[review.product_id];
              return (
                <tr key={review.id}>
                  <td>{new Date(review.created_at).toLocaleString("es-MX")}</td>
                  <td>{review.customer_id ? `Cliente #${review.customer_id}` : "Anonimo"}</td>
                  <td>{channel === "publico" ? "Publico" : "Distribuidor"}</td>
                  <td>{product?.name ?? `Producto #${review.product_id}`}</td>
                  <td>
                    <strong>{review.title ?? "Sin titulo"}</strong>
                    <br />
                    {review.comment ?? "Sin comentario"}
                    <br />
                    Calificacion: {review.rating}/5
                  </td>
                  <td>{review.moderation_status}</td>
                  <td className="row-gap">
                    <button className="button button-outline" type="button" disabled={saving} onClick={() => approve(review.id)}>
                      Aprobar
                    </button>
                    <button className="button button-outline" type="button" disabled={saving} onClick={() => reject(review.id)}>
                      Rechazar
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {filteredReviews.length === 0 ? <p>No hay elementos para los filtros seleccionados.</p> : null}
    </section>
  );
}
