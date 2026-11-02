import { Link, Outlet } from 'react-router-dom'
import { Header } from '@/components/layout/Header'
import { routes } from '@/constants/routes'

export function MainLayout() {
  return <><Header /><main className="page-shell"><Outlet /></main><footer className="site-footer"><span>React Store · Learning project</span><nav aria-label="Footer navigation"><Link to={routes.products}>Collection</Link><Link to={routes.checkOrder}>Check order</Link><Link to={routes.contact}>Contact</Link><a href="https://www.rolex.com/" target="_blank" rel="noreferrer">Official Rolex website ↗</a></nav></footer></>
}
