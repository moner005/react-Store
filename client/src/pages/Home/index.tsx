import { Link } from 'react-router-dom'
import { routes } from '@/constants/routes'

const areas = [
  { name: 'Product catalog', tasks: 'S09–S16', path: routes.products, description: 'Catalog, search, filters and product details.' },
  { name: 'Favorites', tasks: 'S14–S16', path: routes.favorites, description: 'Save and revisit favorite products.' },
  { name: 'Cart and checkout', tasks: 'S17–S29', path: routes.cart, description: 'Branch-aware cart and a future demo order flow.' },
  { name: 'Orders', tasks: 'S30–S32', path: routes.orders, description: 'Order history and saved order details.' },
  { name: 'Warehouse', tasks: 'S33–S40', path: routes.warehouse, description: 'Warehouse stock, receipts and branch transfers.' },
] as const

export default function HomePage() {
  return <div className="home-page"><section className="hero"><p className="eyebrow">Project foundation · Store A</p><h1>A clear starting point<br />for the React Store.</h1><p>This runnable shell establishes the client, route layout, shared API configuration and a small Express health service. The planned commerce features are still backlog.</p><div className="hero-actions"><Link className="button primary" to={routes.products}>Browse planned pages</Link><a className="button secondary" href="https://github.com/moner005/react-Store/blob/main/docs/project-analysis.md">Project plan</a></div></section><section className="section-heading"><div><p className="eyebrow">Work map</p><h2>Feature areas</h2></div><span className="status-pill">Structure only</span></section><div className="area-grid">{areas.map((area) => <Link className="area-card" key={area.name} to={area.path}><span className="card-task">{area.tasks}</span><h3>{area.name}</h3><p>{area.description}</p><span className="text-link">Open placeholder →</span></Link>)}</div><section className="api-status"><div><p className="eyebrow">API baseline</p><h2>Health endpoint only</h2><p>The server runs separately on port 5001. No fake API, database or store operations are included.</p></div><code>GET /health</code></section></div>
}
