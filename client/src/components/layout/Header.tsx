import { Link, NavLink, useNavigate } from 'react-router-dom'
import { routes } from '@/constants/routes'
import { useCartStore } from '@/stores/cartStore'
import { countCartItems } from '@/utils/totals'
import Theme from '@/components/Theme/Theme'
import './Header.css'

const links = [
  ['Home', routes.home],
  ['Products', routes.products],
  ['Cart', routes.cart],
  ['Dashboard', routes.dashboard],
  ['Branches', routes.branches],
  ['Check order', routes.checkOrder],
  ['Contact', routes.contact],
] as const

function Header() {
  const navigate = useNavigate()
  const count = useCartStore((state) => countCartItems(state.items))

  return (
    <header className="header">
      <Link to={routes.home} className="logo" aria-label="Rolex Store home">
        <span className="crown" aria-hidden="true">♛</span>
        <span>ROLEX</span>
      </Link>
      <nav className="nav-links" aria-label="Main navigation">
        {links.map(([label, path]) => (
          <NavLink key={path} to={path} end={path === routes.home}>
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="header-icons">
        <Link to={routes.login} className="account-button" aria-label="Login">♙</Link>
        <button type="button" aria-label={`Shopping cart, ${count ?? 'unavailable'} items`} className="cart-button" onClick={() => navigate(routes.cart)}>
          🛒<span className="cart-count">{count ?? '—'}</span>
        </button>
        <Theme />
      </div>
    </header>
  )
}

export default Header
