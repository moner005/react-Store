import { Link } from 'react-router-dom'
import { routes } from '@/constants/routes'
import './Footer.css'

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-brand">
        <Link to={routes.home} className="footer-logo" aria-label="Rolex Store home">
          <span className="footer-crown" aria-hidden="true">♛</span>
          <span>ROLEX</span>
        </Link>
        <p>A course learning project inspired by the Rolex visual identity.</p>
      </div>
      <nav className="footer-column" aria-label="Store links">
        <h2>Explore</h2>
        <Link to={routes.home}>Home</Link>
        <Link to={routes.products}>Products</Link>
        <Link to={routes.cart}>Cart</Link>
        <Link to={routes.dashboard}>Dashboard</Link>
      </nav>
      <nav className="footer-column" aria-label="Project links">
        <h2>Project</h2>
        <Link to={routes.branches}>Branches</Link>
        <Link to={routes.checkOrder}>Check order</Link>
        <Link to={routes.contact}>Contact</Link>
      </nav>
      <div className="footer-column footer-social">
        <h2>Official Rolex channels</h2>
        <a href="https://www.instagram.com/rolex/" target="_blank" rel="noreferrer">Instagram ↗</a>
        <a href="https://www.facebook.com/rolex/" target="_blank" rel="noreferrer">Facebook ↗</a>
        <a href="https://x.com/ROLEX" target="_blank" rel="noreferrer">X ↗</a>
        <a href="https://www.rolex.com/" target="_blank" rel="noreferrer">Official website ↗</a>
      </div>
      <div className="footer-bottom">React Store · Course project</div>
    </footer>
  )
}

export default Footer
