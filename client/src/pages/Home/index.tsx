import "@/pages/Home/index.css";
import heroVideo from "@/assets/videos/homevideo.mp4";
import { Link } from "react-router-dom";
import { routes } from "@/constants/routes";
import { storeName } from "@/constants/brand";
import { useQuery } from "@tanstack/react-query";
import { WatchPhoto } from "@/components/common/WatchPhoto";
import { getRolexWatches } from "@/services/api/products";
import { formatUsd } from "@/utils/money";

function Index() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['home-featured-watches'],
    queryFn: ({ signal }) => getRolexWatches(1, signal),
  });

  return (
    <div className="home-content">
      <section className="hero">
        {/* Background Video */}
        <video className="hero-video" autoPlay muted loop playsInline>
          <source src={heroVideo} type="video/mp4" />
        </video>

        {/* Dark Overlay */}
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <p className="hero-subtitle">TIMELESS ELEGANCE</p>
          <h1>
            {storeName}
            <br />
            <span>THE ART OF PRECISION</span>
          </h1>

          <p className="hero-description">
            More than a watch. A legacy of excellence,
            <br />
            crafted for generations.
          </p>

          <Link to={routes.store} className="shop-button">
            {" "}
            SHOP NOW <span>→</span>
          </Link>
        </div>

        {/* <div className="hero-dots">
          <span className="dot active-dot"></span>
          <span className="dot"></span>
          <span className="dot"></span>
          <span className="dot"></span>
        </div> */}
      </section>

      {/*     
      <section className="warehouses" id="warehouses">
        <div className="section-label">
          <span></span>
          OUR WAREHOUSES
          <span></span>
        </div> */}
      {/* 
        <h2>Choose Your Warehouse</h2>

        <p className="warehouse-description">
          Select the location you want to visit or receive your order from.
        </p> */}

      {/* <div className="warehouse-buttons">
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
        </div> */}
      {/* </section> */}

      <section className="featured-products" id="shop">
        <div className="products-heading">
          <h2>Featured Products</h2>

          <div className="heading-line"></div>

          <Link to={routes.store} className="view-all">
            {" "}
            View All <span>→</span>
          </Link>
        </div>

        {isLoading && <p role="status">Loading featured watches…</p>}
        {isError && <p role="alert">Featured watches are unavailable right now.</p>}
        {!isLoading && !isError && (data?.data.length ?? 0) === 0 && <p>No watches are available right now.</p>}
        <div className="products-grid">
          {(data?.data ?? []).slice(0, 4).map((product) => (
            <article className="product-card" key={product.id}>
              <WatchPhoto path={product.thumbnailUrl} name={product.name} className="product-image" />
              <p className="product-series">{product.series.name}</p>
              <h3>{product.name}</h3>
              <p className="product-price">{formatUsd(product.priceCents)}</p>
              <Link className="add-to-cart" to={`/products/${product.slug}?branch=${product.branchId}`}>View Details</Link>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

export default Index;
