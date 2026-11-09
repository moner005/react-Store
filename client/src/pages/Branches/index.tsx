import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getRolexWatches, type Watch } from "@/data/Products";
import "./Branches.css";

type City = "Damascus" | "Latakia";

function Branches() {
  const [selectedCity, setSelectedCity] = useState<"All" | City>("All");
  const [watches, setWatches] = useState<Watch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadWatches() {
      try {
        const result = await getRolexWatches();
        setWatches(result.data);
      } catch (err) {
        console.error(err);
        setError("Something went wrong. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    loadWatches();
  }, []);

  // توزيع تجريبي للساعات بالتناوب بين الفرعين
  const watchesWithBranch = watches.map((watch, index) => ({
    ...watch,
    city: index % 2 === 0 ? "Damascus" as City : "Latakia" as City,
  }));

  const filteredWatches =
    selectedCity === "All"
      ? watchesWithBranch
      : watchesWithBranch.filter(
          (watch) => watch.city === selectedCity
        );

  if (loading) {
    return <p className="products-message">Loading watches...</p>;
  }

  if (error) {
    return <p className="products-message">{error}</p>;
  }

  return (
    <section className="branches-page" dir="ltr">
      <section className="products-banner">
        <p className="products-subtitle">
          DISCOVER OUR COLLECTION
        </p>

        <h1>Luxury Watches</h1>

        <p>
          Discover our exclusive collection of luxury watches,
          carefully selected to match your style.
        </p>
      </section>

      <section className="products-section">
        <div className="products-heading">
          <h2>Our Watches</h2>

          <div className="heading-line" />

          <span className="products-count">
            {filteredWatches.length} Products
          </span>
        </div>

        <div className="products-filters">
          <span>Filter by branch:</span>

          {(["All", "Damascus", "Latakia"] as const).map((city) => (
            <button
              key={city}
              type="button"
              aria-pressed={selectedCity === city}
              className={`filter-button ${
                selectedCity === city ? "active" : ""
              }`}
              onClick={() => setSelectedCity(city)}
            >
              {city}
            </button>
          ))}
        </div>

        <div className="products-grid">
          {filteredWatches.map((watch) => (
            <article className="product-card" key={watch.id}>
              <div className="product-image-wrapper">
                <img
                  src={watch.thumbnailUrl}
                  alt={watch.name}
                  className="product-image"
                  loading="lazy"
                />

                <span className="product-city">
                  {watch.city}
                </span>
              </div>

              <p className="product-category">
                {watch.series?.name ?? "Rolex Collection"}
              </p>

              <h3>{watch.name}</h3>

              <p className="product-reference">
                Reference: {watch.referenceNumber || "Not available"}
              </p>

              <Link
                className="details-button"
                to={`/products/${watch.slug}`}
              >
                View Details <span>→</span>
              </Link>
            </article>
          ))}
        </div>

        {filteredWatches.length === 0 && (
          <p className="no-products">
            No products available in this branch.
          </p>
        )}
      </section>
    </section>
  );
}

export default Branches;