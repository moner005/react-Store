import { useEffect, useState } from "react";
import { getRolexWatches, type Watch } from "@/data/Products";
import "@/pages/Products/index.css";
import{ Link } from "react-router-dom";

function Products() {
  const [watches, setWatches] = useState<Watch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadWatches() {
      try {
        const result = await getRolexWatches();
        setWatches(result.data);
      } catch {
        setError("Something went wrong. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    loadWatches();
  }, []);

  if (loading) {
    return <p className="products-message">Loading Rolex watches...</p>;
  }

  if (error) {
    return <p className="products-message">{error}</p>;
  }

  return (
    <>
    <section className="catalog-page">
      <section className="products-intro">
        <span>TIMELESS ELEGANCE</span>
        <h1>Our Collection</h1>
        <p>Discover the world of Rolex watches.</p>
      </section>

      <section className="products-grid">
        {watches.map((watch) => (
          <article className="product-card" key={watch.id}>
            <div className="product-image-wrapper">
              <img
                src={watch.thumbnailUrl}
                alt={watch.name}
                className="product-image"
                loading="lazy"
              />
            </div>

            <p className="product-series">
              {watch.series?.name ?? "Rolex Collection"}
            </p>

            <h2>{watch.name}</h2>

            <p className="product-reference">
              Reference: {watch.referenceNumber || "Not available"}
            </p>

          <Link
  className="details-button" to={`/products/${watch.slug}`}
>
  View Details <span>→</span>
</Link>
          </article>
        ))}
      </section>

      <p className="api-credit">
        Watch catalogue data provided by{" "}
        <a
          href="https://dials.co"
          target="_blank"
          rel="noreferrer"
        >
          Dials
        </a>
      </p>
    </section>

    </>
  );
}

export default Products;
