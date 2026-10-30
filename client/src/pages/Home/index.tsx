import "@/pages/Home/index.css";
import heroImage from '@/assets/images/rolex-hero.jpg';
import watch1 from '@/assets/images/watch-1.jpg';
// import watch2 from "../assets/images/watch-2.jpg";
import watch2 from '@/assets/images/watch-2.jpg';
import watch3 from "@/assets/images/watch-3.jpg";
import watch4 from "@/assets/images/watch-4.jpg";
function Index() {
  const products = [
    {
      id: 1,
      name: "Submariner",
      price: "14,800",
      image: watch2,
    },
    {
      id: 2,
      name: "Datejust 41",
      price: "12,500",
      image: watch1,
    },
    {
      id: 3,
      name: "Oyster Perpetual",
      price: "8,900",
      image: watch3,
    },
    {
      id: 4,
      name: "Daytona",
      price: "16,900",
      image: watch4,
    },
  ];

  return (
    <main>
      <section className="hero">
        <img
          src={heroImage}
          alt="Luxury watch"
          className="hero-image"
        />
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <p className="hero-subtitle">TIMELESS ELEGANCE</p>
          <h1>
            ROLEX
            <br />
            <span>THE ART OF PRECISION</span>
          </h1>

          <p className="hero-description">
            More than a watch. A legacy of excellence,
            <br />
            crafted for generations.
          </p>

          <a href="#shop" className="shop-button">
            SHOP NOW <span>→</span>
          </a>
        </div>

        {/* <div className="hero-dots">
          <span className="dot active-dot"></span>
          <span className="dot"></span>
          <span className="dot"></span>
          <span className="dot"></span>
        </div> */}
      </section>

    
      <section className="warehouses" id="warehouses">
        <div className="section-label">
          <span></span>
          OUR WAREHOUSES
          <span></span>
        </div>

        <h2>Choose Your Warehouse</h2>

        <p className="warehouse-description">
          Select the location you want to visit or receive your order from.
        </p>

        <div className="warehouse-buttons">
          <button className="warehouse-button">
            <span className="location-icon">♧</span>

            <span className="warehouse-text">
              <strong>Warehouse 1</strong>
              <small>LATTAKIA</small>
            </span>
          </button>

          <button className="warehouse-button">
            <span className="location-icon">♧</span>

            <span className="warehouse-text">
              <strong>Warehouse 2</strong>
              <small>DAMASCUS</small>
            </span>
          </button>
        </div>
      </section>

    
      <section className="featured-products" id="shop">
        <div className="products-heading">
          <h2>Featured Products</h2>

          <div className="heading-line"></div>

          <a href="#shop" className="view-all">
            View All <span>→</span>
          </a>
        </div>

        <div className="products-grid">
          {products.map((product) => (
            <article className="product-card" key={product.id}>
              <img
                src={product.image}
                alt={product.name}
                className="product-image"
              />

              <h3>{product.name}</h3>

              <p className="product-price">
                ${product.price}
              </p>

              <button
                className="add-to-cart"
                // onClick={() => alert(${product.name} added to cart!)}
              >
                <span>🛒</span> Add to Cart
              </button>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

export default Index;