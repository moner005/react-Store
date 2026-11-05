
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getRolexWatches, type Watch } from "@/data/Products";
import "./ProductDetails.css";

function ProductDetails() {
  const { slug } = useParams();

  const [watch, setWatch] = useState<Watch | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // نقلنا الـ state والوظيفة إلى داخل المكون هنا 👇
  const [added, setAdded] = useState(false);

  function handleAddToCart() {
    // تم تصحيح علامات التجميع الناقصة || أيضاً في هذه السطور
    const cart = JSON.parse(localStorage.getItem("cart") || "[]");

    const existingProduct = cart.find(
      (item: any) => item.id === watch?.id
    );

    if (existingProduct) {
      existingProduct.quantity += 1;
    } else {
      cart.push({
        ...watch,
        quantity: 1,
      });
    }

    localStorage.setItem("cart", JSON.stringify(cart));

    setAdded(true);

    setTimeout(() => {
      setAdded(false);
    }, 2000);
  }

  useEffect(() => {
    async function loadWatch() {
      try {
        const result = await getRolexWatches();

        const selectedWatch = result.data.find(
          (item) => item.slug === slug
        );

        if (selectedWatch) {
          setWatch(selectedWatch);
        } else {
          setError("Watch not found.");
        }
      } catch (error) {
        console.error(error);
        setError("Something went wrong.");
      } finally {
        setLoading(false);
      }
    }

    loadWatch();
  }, [slug]);

  if (loading) {
    return <p className="details-message">Loading watch details...</p>;
  }

  if (error || !watch) {
    return <p className="details-message">{error}</p>;
  }

  return (
    <main className="details-page">
      <div className="details-container">

        <div className="details-image-section">
          <div className="details-image-wrapper">
            <img
              src={watch.thumbnailUrl}
              alt={watch.name}
              className="details-image"
            />
          </div>
        </div>

        <div className="details-info">
          <span className="details-label">ROLEX COLLECTION</span>

          <h1>{watch.name}</h1>

          <div className="details-line"></div>

          <div className="watch-info">
            <div>
              <span>Brand</span>
              <p>{watch.brand?.name || "Rolex"}</p>
            </div>

            <div>
              <span>Collection</span>
              <p>{watch.series?.name || "Rolex Collection"}</p>
            </div>

            <div>
              <span>Reference Number</span>
              <p>{watch.referenceNumber || "Not available"}</p>
            </div>

            <div>
              <span>Model</span>
              <p>{watch.slug}</p>
            </div>
          </div>

          <p className="details-description">
            Discover the elegance and timeless design of this
            Rolex timepiece.
          </p>

          <div className="details-buttons">
            <button
              className="add-cart-button"
              onClick={handleAddToCart}
            >
              {added ? "Added Successfully ✓" : "Add to Cart"}
            </button>

            <Link to="/products" className="back-button">
              ← Back to Products
            </Link>
          </div>
        </div>

      </div>
    </main>
  );
}

export default ProductDetails;