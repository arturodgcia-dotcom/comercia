import { FormEvent, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../services/api";
import { Product, ProductReview, StorefrontHomePayload } from "../types/domain";

export function ProductDetailPage() {
  const { tenantSlug, productId } = useParams();
  const [home, setHome] = useState<StorefrontHomePayload | null>(null);
  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [error, setError] = useState("");
  const [reviewForm, setReviewForm] = useState({ rating: 5, title: "", comment: "" });

  useEffect(() => {
    if (!tenantSlug || !productId) return;
    api
      .getStorefrontHomeData(tenantSlug)
      .then((data) => {
        setHome(data);
        const allProducts = [...data.featured_products, ...data.recent_products, ...data.best_sellers, ...data.promo_products];
        const selected = allProducts.find((item) => item.id === Number(productId));
        if (!selected) throw new Error("Producto no encontrado");
        setProduct(selected);
        return api.getProductReviews(selected.id);
      })
      .then(setReviews)
      .catch((err) => setError(err instanceof Error ? err.message : "No fue posible cargar producto"));
  }, [tenantSlug, productId]);

  const submitReview = async (event: FormEvent) => {
    event.preventDefault();
    if (!home || !product) return;
    await api.createProductReview({
      tenant_id: home.tenant.id,
      product_id: product.id,
      rating: reviewForm.rating,
      title: reviewForm.title,
      comment: reviewForm.comment
    });
    setReviewForm({ rating: 5, title: "", comment: "" });
    setError("Resena enviada. Quedara pendiente de aprobacion.");
  };

  if (error) return <p className="error">{error}</p>;
  if (!home || !product) return <p>Cargando producto...</p>;

  const avgRating = reviews.length ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length : null;

  return (
    <main className="storefront">
      <section className="store-hero">
        <h1>{product.name}</h1>
        <p>{product.description}</p>
        <p>Precio: ${Number(product.price_public).toLocaleString("es-MX")}</p>
        <p>Rating promedio: {avgRating ? avgRating.toFixed(1) : "Sin resenas"}</p>
        <div className="store-actions">
          <Link className="button" to={`/store/${home.tenant.slug}`}>
            Volver a la tienda
          </Link>
          {(home.tenant.business_type === "services" || home.tenant.business_type === "mixed") && (
            <Link className="button button-outline" to={`/store/${home.tenant.slug}/services`}>
              Ver servicios
            </Link>
          )}
        </div>
      </section>

      <section className="store-banner">
        <h2>Imagenes</h2>
        <p>Placeholder de galeria para siguiente iteracion.</p>
      </section>

      <section>
        <h2>Resenas aprobadas</h2>
        <div className="card-grid">
          {reviews.map((review) => (
            <article key={review.id} className="card">
              <strong>{review.rating}/5</strong>
              <h3>{review.title}</h3>
              <p>{review.comment}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="store-banner">
        <h2>Escribir resena</h2>
        <form className="detail-form" onSubmit={submitReview}>
          <label>
            Rating
            <input
              type="number"
              min={1}
              max={5}
              value={reviewForm.rating}
              onChange={(e) => setReviewForm((prev) => ({ ...prev, rating: Number(e.target.value) }))}
            />
          </label>
          <label>
            Titulo
            <input value={reviewForm.title} onChange={(e) => setReviewForm((prev) => ({ ...prev, title: e.target.value }))} />
          </label>
          <label>
            Comentario
            <input value={reviewForm.comment} onChange={(e) => setReviewForm((prev) => ({ ...prev, comment: e.target.value }))} />
          </label>
          <button className="button" type="submit">
            Enviar resena
          </button>
        </form>
      </section>
    </main>
  );
}

