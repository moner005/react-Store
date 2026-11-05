import "./Footer.css";
import { Link, NavLink } from 'react-router-dom'
import { routes } from '@/constants/routes'
import { useCartStore } from '@/stores/cartStore'

function Footer() {
  return (
    <footer className="footer" id="contact">
      <div className="footer-brand">
        <a href="/" className="footer-logo">
          <span className="footer-crown">♛</span>
          <span>ROLEX</span>
        </a>

        <p>A symbol of excellence<br />since 1905.</p>
      </div>

      <div className="footer-column">
        <h3>Quick Links</h3>
        <a href="/">Home</a>
        <a href="#shop">Shop</a>
        <a href="#about">Cart</a>
        <a href="#contact">Contact</a>
      </div>

      <div className="footer-column">
        <h3>Customer Service</h3>
        <a href="#shipping">Shipping &amp; Returns</a>
        <a href="#faqs">FAQs</a>
        <a href="#terms">Terms &amp; Conditions</a>
        <a href="#privacy">Privacy Policy</a>
      </div>

      <div className="footer-column footer-social">
        <h3>Follow Us</h3>

        <div className="social-icons">
          <a href="#instagram" aria-label="Instagram">◎</a>
          <a href="#facebook" aria-label="Facebook">f</a>
          <a href="#youtube" aria-label="YouTube">▶</a>
          <a href="#x" aria-label="X">𝕏</a>
        </div>
      </div>

      <div className="footer-motto">
        <span className="footer-crown">♛</span>
        <p>The best investment<br />is time.</p>
      </div>

      <div className="footer-bottom">
        © 2026 Rolex Store. All rights reserved.
      </div>
    </footer>
  );
}

export default Footer;