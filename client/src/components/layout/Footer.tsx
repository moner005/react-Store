import { Link } from 'react-router-dom'
import { routes } from '@/constants/routes'
import { storeName } from '@/constants/brand'
import './Footer.css'

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-brand">
        <Link to={routes.home} className="footer-logo" aria-label={storeName + ' home'}>
          <span>{storeName}</span>
        </Link>
      </div>
      <nav className="footer-column" aria-label="Store links">
        <h2>Explore</h2>
        <Link to={routes.home}>Home</Link>
        <Link to={routes.store}>Store</Link>
        <Link to={routes.cart}>Cart</Link>
      </nav>
      <nav className="footer-column" aria-label="Customer links">
        <h2>Customer service</h2>
        <Link to={routes.checkOrder}>Check order</Link>
        <Link to={routes.contact}>Contact</Link>
      </nav>
      <div className="footer-column footer-social">
        <h2>External links</h2>
        <a href="https://www.instagram.com/rolex/" target="_blank" rel="noreferrer">Instagram ↗</a>
        <a href="https://www.facebook.com/rolex/" target="_blank" rel="noreferrer">Facebook ↗</a>
        <a href="https://x.com/ROLEX" target="_blank" rel="noreferrer">X ↗</a>
        <a href="https://www.rolex.com/" target="_blank" rel="noreferrer">Manufacturer website ↗</a>
      </div>
    </footer>
  )
}

export default Footer
