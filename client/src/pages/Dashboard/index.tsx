
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { WatchPhoto } from '@/components/common/WatchPhoto'
import { getRolexWatches, type Watch, type WatchesResponse } from '@/services/api/products'
import { routes } from '@/constants/routes'
import { storeName } from '@/constants/brand'
import './Dashboard.css'

const EMPTY_WATCHES: Watch[] = []

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function requiredText(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function safeRelation(value: unknown): Watch['series'] {
  if (!isRecord(value)) return { name: 'Unclassified', slug: '' }
  return {
    name: requiredText(value.name) ?? 'Unclassified',
    slug: requiredText(value.slug) ?? '',
  }
}

function normalizeWatch(value: unknown, index: number): Watch {
  if (!isRecord(value)) {
    throw new Error(`Catalogue API returned an invalid model at row ${index + 1}.`)
  }

  const id = requiredText(value.id)
  const name = requiredText(value.name)
  const slug = requiredText(value.slug)
  if (!id || !name || !slug) {
    throw new Error(`Catalogue API returned an incomplete model at row ${index + 1}.`)
  }

  return {
    id,
    name,
    slug,
    thumbnailUrl: typeof value.thumbnailUrl === 'string' ? value.thumbnailUrl : '',
    series: safeRelation(value.series),
    sourceUrl: typeof value.sourceUrl === 'string' && value.sourceUrl.startsWith('https://dials.co/watches/rolex/')
      ? value.sourceUrl
      : '',
    priceCents: typeof value.priceCents === 'number' ? value.priceCents : 0,
    branchId: value.branchId === 'latakia' ? 'latakia' : 'damascus',
    gender: value.gender === 'men' || value.gender === 'women' ? value.gender : 'unisex',
  }
}

function validateCatalog(value: unknown): WatchesResponse {
  if (!isRecord(value) || !Array.isArray(value.data)) {
    throw new Error('Catalogue API returned an invalid response.')
  }

  if (!Number.isSafeInteger(value.total) || (value.total as number) < 0) {
    throw new Error('Catalogue API returned an invalid total count.')
  }
  if (!Number.isSafeInteger(value.page) || (value.page as number) < 1) {
    throw new Error('Catalogue API returned an invalid page number.')
  }

  const data = value.data.map(normalizeWatch)
  const pageSize = Number.isSafeInteger(value.pageSize) && (value.pageSize as number) > 0
    ? value.pageSize as number
    : Math.max(1, data.length)
  const totalPages = Number.isSafeInteger(value.totalPages) && (value.totalPages as number) >= 0
    ? value.totalPages as number
    : Math.ceil((value.total as number) / pageSize)

  return {
    data,
    page: value.page as number,
    pageSize,
    total: value.total as number,
    totalPages,
  }
}

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
        const result = validateCatalog(await getRolexWatches())

        if (isActive) {
          setCatalog(result)
        }
      } catch (err) {
        console.error('Dashboard catalogue error:', err)

        if (isActive) {
          setCatalog(null)
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

  const watches = catalog?.data ?? EMPTY_WATCHES
  const visibleWatches = watches.slice(0, 8)

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
      label: 'TOTAL MODELS',
      value: loading
        ? '...'
        : error
          ? '—'
          : catalog?.total.toLocaleString() ?? '—',
      description: 'Total models reported by the API',
      icon: '♛',
    },
    {
      label: 'MODELS LOADED',
      value: loading
        ? '...'
        : error
          ? '—'
          : watches.length.toLocaleString(),
      description: 'Models returned in the current page',
      icon: '◈',
    },
    {
      label: 'COLLECTIONS',
      value: loading
        ? '...'
        : error
          ? '—'
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
    <section className="admin-dashboard">

      {/* PAGE HEADER */}

      <header className="admin-dashboard-header">

        <div>
          <p className="admin-eyebrow">
            {storeName} STORE MANAGEMENT
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
            to={routes.store}
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

          ) : error ? (
            <div className="admin-state-message">
              Collection data is unavailable.
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
                Store catalogue API
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
              ◈
            </div>

            <div className="admin-operation-info">

              <strong>Warehouse</strong>
              <Link className="admin-details-link" to={routes.warehouse}>Stock and receipts →</Link>

            </div>

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
            to={routes.store}
            className="admin-text-link"
          >
            View All Products →
          </Link>

        </div>

        {loading ? (

          <div className="admin-state-message">
            Loading watches…
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
                  <th>DETAILS</th>
                </tr>
              </thead>

              <tbody>

                {visibleWatches.map((watch) => (

                  <tr key={watch.id}>

                    <td>

                      <div className="admin-watch-cell">

                        <WatchPhoto path={watch.thumbnailUrl} name={watch.name} className="admin-watch-photo" />

                        <strong>{watch.name}</strong>

                      </div>

                    </td>

                    <td>
                      {watch.series?.name || '—'}
                    </td>

                    <td>

                      <Link
                        to={`/products/${watch.slug}`}
                        className="admin-details-link"
                      >
                        View →
                      </Link>
                      {watch.sourceUrl && <a className="catalog-source" href={watch.sourceUrl} target="_blank" rel="noreferrer">Source: Dials</a>}

                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        )}

        {!loading && catalog && (

          <div className="admin-table-footer">

            <span>
              Showing {visibleWatches.length} of {watches.length} loaded models from page {catalog.page}.
            </span>

            <span>
              API catalogue total: {catalog.total.toLocaleString()}
            </span>

          </div>

        )}

      </section>

      {/* DASHBOARD FOOTNOTE */}

      <footer className="admin-dashboard-footer">
        Catalogue information comes from our saved Dials reference data.

      </footer>

    </section>
  )
}

export default DashboardPage
