
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { getRolexWatches, type Watch, type WatchesResponse } from '@/data/Products'
import { routes } from '@/constants/routes'
import './Dashboard.css'

function DashboardPage() {
  const [catalog, setCatalog] = useState<WatchesResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)

  // Load the catalogue from the existing API
  useEffect(() => {
    let isActive = true

    async function loadCatalog() {
      setLoading(true)
      setError('')

      try {
        const result = await getRolexWatches()

        if (isActive) {
          setCatalog(result)
        }
      } catch (err) {
        console.error('Dashboard catalogue error:', err)

        if (isActive) {
          setError(
            err instanceof Error
              ? err.message
              : 'Unable to load catalogue data.'
          )
        }
      } finally {
        if (isActive) {
          setLoading(false)
        }
      }
    }

    void loadCatalog()

    return () => {
      isActive = false
    }
  }, [refreshKey])

  const watches = catalog?.data ?? []

  // Calculate collection distribution from loaded API results
  const collections = useMemo(() => {
    const counts: Record<string, number> = {}

    watches.forEach((watch) => {
      const collectionName =
        watch.series?.name || 'Unclassified'

      counts[collectionName] =
        (counts[collectionName] || 0) + 1
    })

    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
  }, [watches])

  const stats = [
    {
      label: 'TOTAL ROLEX MODELS',
      value: loading
        ? '...'
        : catalog?.total.toLocaleString() ?? '—',
      description: 'Total models reported by the API',
      icon: '♛',
    },
    {
      label: 'MODELS LOADED',
      value: loading
        ? '...'
        : watches.length.toLocaleString(),
      description: 'Models returned in the current page',
      icon: '◈',
    },
    {
      label: 'COLLECTIONS',
      value: loading
        ? '...'
        : collections.length.toLocaleString(),
      description: 'Collections in the loaded results',
      icon: '◇',
    },
    {
      label: 'CATALOGUE STATUS',
      value: loading
        ? 'Loading'
        : error
          ? 'Offline'
          : 'Connected',
      description: error
        ? 'Could not retrieve catalogue data'
        : 'Connection to catalogue API',
      icon: '◎',
    },
  ]

  const maxCollectionCount = Math.max(
    1,
    ...collections.map((collection) => collection.count)
  )

  return (
    <main className="admin-dashboard">

      {/* PAGE HEADER */}

      <header className="admin-dashboard-header">

        <div>
          <p className="admin-eyebrow">
            ROLEX STORE MANAGEMENT
          </p>

          <h1>Store Dashboard</h1>

          <p className="admin-subtitle">
            Monitor your catalogue and store operations.
          </p>
        </div>

        <div className="admin-header-actions">

          <button
            type="button"
            className="admin-refresh-button"
            onClick={() => setRefreshKey((current) => current + 1)}
            disabled={loading}
          >
            <span>↻</span>
            {loading ? 'Loading...' : 'Refresh Data'}
          </button>

          <Link
            to={routes.products}
            className="admin-primary-button"
          >
            View Catalogue →
          </Link>

        </div>

      </header>

      {/* STATISTICS */}

      <section className="admin-stats-grid">

        {stats.map((stat, index) => (

          <article
            className="admin-stat-card"
            key={stat.label}
            style={{
              animationDelay: `${index * 100}ms`,
            }}
          >

            <div className="admin-stat-top">

              <span>{stat.label}</span>

              <span className="admin-stat-icon">
                {stat.icon}
              </span>

            </div>

            <h2
              className={
                stat.label === 'CATALOGUE STATUS'
                  ? error
                    ? 'status-offline'
                    : 'status-online'
                  : ''
              }
            >
              {stat.value}
            </h2>

            <p>{stat.description}</p>

          </article>

        ))}

      </section>

      {/* ERROR STATE */}

      {error && (

        <section className="admin-error">

          <div>
            <strong>Catalogue unavailable</strong>

            <p>{error}</p>
          </div>

          <button
            type="button"
            onClick={() => setRefreshKey((current) => current + 1)}
          >
            Try Again
          </button>

        </section>

      )}

      {/* ANALYTICS AND OPERATIONS */}

      <section className="admin-main-grid">

        {/* COLLECTION ANALYTICS */}

        <article className="admin-panel">

          <div className="admin-panel-header">

            <div>
              <p className="admin-eyebrow">
                CATALOGUE ANALYTICS
              </p>

              <h2>Collection Distribution</h2>
            </div>

            <span className="admin-panel-icon">◈</span>

          </div>

          {loading ? (

            <div className="admin-state-message">
              Loading collections...
            </div>

          ) : collections.length === 0 ? (

            <div className="admin-state-message">
              No collection data available.
            </div>

          ) : (

            <div className="admin-collection-list">

              {collections.slice(0, 8).map((collection) => {

                const percentage =
                  (collection.count / watches.length) * 100

                const barWidth =
                  (collection.count / maxCollectionCount) * 100

                return (

                  <div
                    className="admin-collection-item"
                    key={collection.name}
                  >

                    <div className="admin-collection-info">

                      <strong>{collection.name}</strong>

                      <span>
                        {collection.count} models
                      </span>

                    </div>

                    <div className="admin-progress-track">

                      <div
                        className="admin-progress-fill"
                        style={{
                          width: `${barWidth}%`,
                        }}
                      />

                    </div>

                    <p>
                      {percentage.toFixed(1)}% of loaded models
                    </p>

                  </div>

                )
              })}

            </div>

          )}

          {!loading && collections.length > 0 && (
            <p className="admin-footnote">
              Analysis is based on the currently loaded API page,
              not necessarily the entire catalogue.
            </p>
          )}

        </article>

        {/* BUSINESS OPERATIONS */}

        <article className="admin-panel admin-operations">

          <div className="admin-panel-header">

            <div>
              <p className="admin-eyebrow">
                STORE OPERATIONS
              </p>

              <h2>System Overview</h2>
            </div>

            <span className="admin-panel-icon">◇</span>

          </div>

          <div className="admin-operation-item">

            <div className="admin-operation-icon">
              ♛
            </div>

            <div className="admin-operation-info">

              <strong>Product Catalogue</strong>

              <span>
                External catalogue API
              </span>

            </div>

            <span className={
              loading
                ? 'admin-status pending'
                : error
                  ? 'admin-status offline'
                  : 'admin-status online'
            }>
              {loading
                ? 'Loading'
                : error
                  ? 'Offline'
                  : 'Connected'}
            </span>

          </div>

          <div className="admin-operation-item">

            <div className="admin-operation-icon">
              ◷
            </div>

            <div className="admin-operation-info">

              <strong>Sales & Orders</strong>

              <span>
                Order management API
              </span>

            </div>

            <span className="admin-status pending">
              Not connected
            </span>

          </div>

          <div className="admin-operation-item">

            <div className="admin-operation-icon">
              ◈
            </div>

            <div className="admin-operation-info">

              <strong>Inventory</strong>

              <span>
                Stock management API
              </span>

            </div>

            <span className="admin-status pending">
              Not connected
            </span>

          </div>

          <div className="admin-operation-notice">
            Sales, orders and inventory statistics will become
            available after connecting the store backend.
          </div>

        </article>

      </section>

      {/* PRODUCT CATALOGUE TABLE */}

      <section className="admin-panel admin-catalogue-panel">

        <div className="admin-panel-header">

          <div>
            <p className="admin-eyebrow">
              PRODUCT MANAGEMENT
            </p>

            <h2>Catalogue Overview</h2>
          </div>

          <Link
            to={routes.products}
            className="admin-text-link"
          >
            View All Products →
          </Link>

        </div>

        {loading ? (

          <div className="admin-state-message">
            Loading Rolex catalogue...
          </div>

        ) : error ? (

          <div className="admin-state-message">
            Catalogue data could not be loaded.
          </div>

        ) : watches.length === 0 ? (

          <div className="admin-state-message">
            No products returned by the API.
          </div>

        ) : (

          <div className="admin-table-wrapper">

            <table className="admin-table">

              <thead>
                <tr>
                  <th>WATCH</th>
                  <th>COLLECTION</th>
                  <th>REFERENCE</th>
                  <th>BRAND</th>
                  <th>DETAILS</th>
                </tr>
              </thead>

              <tbody>

                {watches.slice(0, 8).map((watch: Watch) => (

                  <tr key={watch.id}>

                    <td>

                      <div className="admin-watch-cell">

                        <img
                          src={watch.thumbnailUrl}
                          alt={watch.name}
                          loading="lazy"
                        />

                        <strong>{watch.name}</strong>

                      </div>

                    </td>

                    <td>
                      {watch.series?.name || '—'}
                    </td>

                    <td>
                      {watch.referenceNumber || '—'}
                    </td>

                    <td>
                      {watch.brand?.name || 'Rolex'}
                    </td>

                    <td>

                      <Link
                        to={`/products/${watch.slug}`}
                        className="admin-details-link"
                      >
                        View →
                      </Link>

                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        )}

        {catalog && (

          <div className="admin-table-footer">

            <span>
              Showing {watches.length} models from page {catalog.page}.
            </span>

            <span>
              API catalogue total: {catalog.total.toLocaleString()}
            </span>

          </div>

        )}

      </section>

      {/* DASHBOARD FOOTNOTE */}

      <footer className="admin-dashboard-footer">
        Catalogue information is provided by the existing Dials API.
        Sales and stock figures are not available until backend
        integration is implemented.
      </footer>

    </main>
  )
}

export default DashboardPage
