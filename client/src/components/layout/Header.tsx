import { useRef, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { routes } from '@/constants/routes'
import { storeName } from '@/constants/brand'
import { useCartStore } from '@/stores/cartStore'
import { useAuthStore } from '@/stores/authStore'
import { countCartItems } from '@/utils/totals'
import Theme from '@/components/Theme/Theme'
import './Header.css'

const storeLinks: { label: string; path: string; icon: string }[] = [
  { label: 'Home', path: routes.home, icon: 'm3 11 9-8 9 8M5.5 9v11h5v-5.5h3V20h5V9' },
  { label: 'Store', path: routes.store, icon: 'M4 10V20h16V10M3 10l2-5h14l2 5M3 10h18M9 20v-6h6v6' },
  { label: 'Check order', path: routes.checkOrder, icon: 'M9 5H6v16h12V5h-3M9 3h6v4H9zM9 14l2 2 4-4' },
  { label: 'Contact', path: routes.contact, icon: 'M3 5h18v14H3zM3 6l9 7 9-7' },
]

function Header() {
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuButton = useRef<HTMLButtonElement>(null)
  const count = useCartStore((state) => countCartItems(state.items))
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  const links = [...storeLinks]
  if (user?.role === 'owner') {
    links.push({ label: 'Dashboard', path: routes.dashboard, icon: 'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z' })
  }
  if (user?.role === 'admin' && user.branchId) {
    links.push({
      label: 'Manage branch',
      path: routes.branches + '/' + user.branchId,
      icon: 'M4 20h8M6 20V4h10v7M9 8h4m-4 4h3m-3 4h2m3 4 1-3 4-4 2 2-4 4-3 1z',
    })
  }

  function closeMenu() {
    setMenuOpen(false)
  }

  function followMenuLink() {
    if (menuOpen && menuButton.current?.getClientRects().length) menuButton.current.focus()
    closeMenu()
  }

  async function signOut() {
    try {
      await logout()
      navigate(routes.home)
    } catch {
      toast.error('Could not sign out. Try again.')
    }
  }

  return (
    <header className="header" onKeyDown={(event) => {
      if (event.key === 'Escape' && menuOpen && menuButton.current?.getClientRects().length) {
        event.preventDefault()
        followMenuLink()
      }
    }}>
      <Link to={routes.home} className="logo" aria-label={storeName + ' home'} onClick={closeMenu}>
        <span>{storeName}</span>
      </Link>
      <button
        ref={menuButton}
        className="menu-toggle"
        type="button"
        aria-controls="main-navigation"
        aria-expanded={menuOpen}
        aria-label={menuOpen ? 'Close menu' : 'Open menu'}
        onClick={() => setMenuOpen((open) => !open)}
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <path d={menuOpen ? 'M6 6l12 12M18 6L6 18' : 'M4 6h16M4 12h16M4 18h16'} />
        </svg>
      </button>
      <nav id="main-navigation" className={menuOpen ? 'nav-links is-open' : 'nav-links'} aria-label="Main navigation">
        {links.map(({ label, path, icon }) => (
          <NavLink key={path} to={path} end={path === routes.home} aria-label={label} title={label} onClick={followMenuLink}>
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d={icon} />
            </svg>
          </NavLink>
        ))}
      </nav>
      <div className="header-icons">
        {user
          ? <button type="button" aria-label="Sign out" title="Sign out" onClick={() => { closeMenu(); void signOut() }} className="account-button">
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H5v16h6M10 12h10m-4-4 4 4-4 4" />
            </svg>
          </button>
          : <Link to={routes.login} className="account-button" aria-label="Login" title="Login" onClick={closeMenu}>
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="8" r="3.25" />
              <path d="M5 20v-1a5 5 0 0 1 5-5h4a5 5 0 0 1 5 5v1" />
            </svg>
          </Link>}
        <Link to={routes.cart} aria-label={`Shopping cart, ${count ?? 'unavailable'} items`} title="Shopping cart" className="cart-button" onClick={closeMenu}>
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5.5 7.5h13L20 21H4L5.5 7.5ZM9 9V6a3 3 0 1 1 6 0v3" />
          </svg>
          <span className="cart-count" aria-hidden="true">{count === null ? '—' : count > 99 ? '99+' : count}</span>
        </Link>
        <Theme />
      </div>
    </header>
  )
}

export default Header
