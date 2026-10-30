import { Link, NavLink } from 'react-router-dom'
import { routes } from '@/constants/routes'
import { useCartStore } from '@/stores/cartStore'

import "./Header.css";

function Header() {
  return (
    <header className="header">
      <a href="/" className="logo">
        <span className="crown">♛</span>
        <span>ROLEX</span>
      </a>

      <nav className="nav-links">
        <a href="/" className="active">Home</a>
        <a href="#shop">Shop</a>
        <a href="#about">Cart</a>
        <a href="#contact">Contact</a>
      </nav>

      <div className="header-icons">
        <button aria-label="Search">⌕</button>
        <button aria-label="Account">♙</button>
        <button aria-label="Shopping cart" className="cart-button">
          🛒
          <span className="cart-count">0</span>
        </button>
      </div>
    </header>
  );
}

export default Header;
