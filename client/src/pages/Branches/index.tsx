import { useState } from "react";
import "./Branches.css";

type City = "Damascus" | "Latakia";

type Product = {
  id: number;
  name: string;
  price: number;
  city: City;
  category: string;
  image: string;
};

const products: Product[] = [
  {
    id: 1,
    name: "Rolex Submariner",
    price: 12500000,
    city: "Damascus",
    category: "Men's Watches",
    image:
      "https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=500",
  },
  {
    id: 2,
    name: "Classic Gold Watch",
    price: 8500000,
    city: "Latakia",
    category: "Classic Watches",
    image:
      "https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=500",
  },
  {
    id: 3,
    name: "Luxury Silver",
    price: 9500000,
    city: "Damascus",
    category: "Men's Watches",
    image:
      "https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=500",
  },
  {
    id: 4,
    name: "Elegant Lady",
    price: 7200000,
    city: "Latakia",
    category: "Women's Watches",
    image:
      "https://images.unsplash.com/photo-1547996160-81dfa63595aa?w=500",
  },
  {
    id: 5,
    name: "Minimalist Black",
    price: 6500000,
    city: "Damascus",
    category: "Classic Watches",
    image:
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500",
  },
  {
    id: 6,
    name: "Premium Chronograph",
    price: 11000000,
    city: "Latakia",
    category: "Men's Watches",
    image:
      "https://images.unsplash.com/photo-1533139502658-0198f920d8e8?w=500",
  },
  {
    id: 7,
    name: "Luxury Brown",
    price: 7800000,
    city: "Damascus",
    category: "Classic Watches",
    image:
      "https://images.unsplash.com/photo-1434056886845-dac89ffe9b56?w=500",
  },
  {
    id: 8,
    name: "Modern Silver",
    price: 8900000,
    city: "Latakia",
    category: "Women's Watches",
    image:
      "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=500",
  },
];

function Branches() {
  const [selectedCity, setSelectedCity] = useState<"All" | City>("All");

  const filteredProducts =
    selectedCity === "All"
      ? products
      : products.filter((product) => product.city === selectedCity);

  return (
    <section className="branches-page" dir="ltr">
      <section className="products-banner">
        <p className="products-subtitle">DISCOVER OUR COLLECTION</p>

        <h1>Luxury Watches</h1>

        <p>
          Discover our exclusive collection of luxury watches,
          carefully selected to match your style.
        </p>
        <p className="branch-demo-note">Demonstration listings only. Sample prices are shown in SYP; availability has not been checked.</p>
      </section>

      <section className="products-section">
        <div className="products-heading">
          <h2>Our Watches</h2>

          <div className="heading-line" />

          <span className="products-count">
            {filteredProducts.length} Products
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
          {filteredProducts.map((product) => (
            <article className="product-card" key={product.id}>
              <div className="product-image-wrapper">
                <img
                  src={product.image}
                  alt={product.name}
                  className="product-image"
                  loading="lazy"
                />

                <span className="product-city">
                  {product.city}
                </span>
              </div>

              <p className="product-category">
                {product.category}
              </p>

              <h3>{product.name}</h3>

              <p className="product-price">
                {product.price.toLocaleString("en-US")} SYP
              </p>

              <span className="branch-demo-label">Demo listing</span>
            </article>
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <p className="no-products">
            No products available in this branch.
          </p>
        )}
      </section>
    </section>
  );
}

export default Branches;
