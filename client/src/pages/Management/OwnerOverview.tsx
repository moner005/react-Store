import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { routes } from '@/constants/routes'
import { getDashboardBranches, hasStatus, type Branch } from '@/services/api/accounts'
import './Management.css'

export function OwnerOverview() {
  const [branches, setBranches] = useState<Branch[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const controller = new AbortController()
    getDashboardBranches(controller.signal)
      .then(setBranches)
      .catch((cause: unknown) => {
        if (controller.signal.aborted) return
        setError(hasStatus(cause, 401) || hasStatus(cause, 403)
          ? 'Your account cannot view this owner overview.'
          : 'Branch information could not be loaded. Please try again.')
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [])

  return <section className="management-page">
    <header><p className="management-eyebrow">OWNER</p><h1>Branch overview</h1>
      <p>Manage branch contact settings and staff access.</p></header>
    {loading && <p role="status">Loading branches…</p>}
    {error && <p role="alert">{error}</p>}
    {!loading && !error && <div className="management-cards">
      {branches.map((branch) => <article className="management-card" key={branch.id}>
        <h2>{branch.name}</h2><p>{branch.address}</p><p>{branch.phone}</p>
        <p>{branch.openingHours}</p><Link to={`/management/branches/${branch.id}`}>Edit branch settings</Link>
      </article>)}
      {branches.length === 0 && <p>No branches are configured.</p>}
    </div>}
    <nav className="management-links" aria-label="Owner tools">
      <Link to="/management/admins">Manage administrator accounts</Link>
      <Link to="/dashboard">Catalog dashboard</Link>
      <Link to={routes.warehouse}>Warehouse stock and receipts</Link>
    </nav>
  </section>
}
