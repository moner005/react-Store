import { Link, NavLink } from 'react-router-dom'
import { routes } from '@/constants/routes'
import { useCartStore } from '@/stores/cartStore'
import Theme from '@/components/Theme/Theme'

import "./Header.css";

function Header() {
  return (
    <header className="header">
      <NavLink to={routes.home} className="logo">
        <span className="crown">♛</span>
        <span>ROLEX</span>
      </NavLink>

      <nav className="nav-links">
        <Link to={routes.home} className="active">
          Home
        </Link>
        <Link to={routes.products}>Products</Link>
        <Link to={routes.cart}>Cart</Link>
        {/* <NavLink to={routes.contact}>Contact</NavLink> */}
      </nav>

      <div className="header-icons">
        <button aria-label="Search">⌕</button>
        <button aria-label="Account">♙</button>
        <button aria-label="Shopping cart" className="cart-button">
          🛒
          <span className="cart-count">0</span>
        </button>
        <Theme />
      </div>
    </header>
  );
}

export default Header;
