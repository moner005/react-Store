
import { Link } from 'react-router-dom'
import { routes } from '@/constants/routes'
import { useCartStore } from '@/stores/cartStore'
import { dollarsToMinor, formatUsd } from '@/utils/money'
import { countCartItems, lineTotalMinor, productSubtotal } from '@/utils/totals'
import './Dashboard.css'

function DashboardPage() {
  const items = useCartStore((state) => state.items)

  const totalUnits = countCartItems(items)
  const totalValue = productSubtotal(items)
  const unpricedItems = items.filter((item) => lineTotalMinor(item) === null)

  const mostSelected = [...items].sort(
    (a, b) => b.quantity - a.quantity
  )[0]

  const productShares = items.map((item) => ({
    ...item,
    share: totalUnits !== null && totalUnits > 0
      ? (item.quantity / totalUnits) * 100
      : 0,
  }))

  const stats = [
    {
      label: 'Unique Products',
      value: items.length,
      description: 'Different watches selected',
      icon: '♛',
    },
    {
      label: 'Total Units',
      value: totalUnits ?? 'Unavailable',
      description: 'Total selected quantities',
      icon: '◈',
    },
    {
      label: 'Cart Value',
      value: totalValue === null ? 'Unavailable' : formatUsd(totalValue),
      description: 'Product subtotal',
      icon: '$',
    },
    {
      label: 'Prices Unavailable',
      value: unpricedItems.length,
      description: 'Products without catalogue prices',
      icon: '◇',
    },
  ]

  return (
    <section className="dashboard-page">

      <header className="dashboard-header">

        <div>
          <p className="dashboard-eyebrow">
            ROLEX STORE MANAGEMENT
          </p>

          <h1>Dashboard</h1>

          <p>
            An overview of your current store selection.
          </p>
        </div>

        <Link
          to={routes.cart}
          className="dashboard-cart-button"
        >
          View Shopping Cart →
        </Link>

      </header>

      {/* STATISTICS */}

      <section className="dashboard-stats">

        {stats.map((stat, index) => (
          <article
            className="dashboard-stat"
            key={stat.label}
            style={{
              animationDelay: `${index * 100}ms`,
            }}
          >

            <div className="dashboard-stat-top">
              <span>{stat.label}</span>
              <span className="dashboard-icon">
                {stat.icon}
              </span>
            </div>

            <h2>{stat.value}</h2>

            <p>{stat.description}</p>

          </article>
        ))}

      </section>

      {/* MAIN DASHBOARD CONTENT */}

      <section className="dashboard-content">

        <div className="dashboard-panel">

          <div className="dashboard-panel-header">

            <div>
              <p className="dashboard-eyebrow">
                PRODUCT ANALYTICS
              </p>

              <h2>Selection Breakdown</h2>
            </div>

            <span className="dashboard-total">
              {totalUnits ?? 'Unavailable'} Units
            </span>

          </div>

          {items.length === 0 ? (

            <div className="dashboard-empty">
              <span>♛</span>

              <h3>No Products Selected</h3>

              <p>
                Add watches to your shopping cart to
                see your selection analytics.
              </p>

              <Link to={routes.products}>
                Explore Collection →
              </Link>
            </div>

          ) : (

            <div className="dashboard-bars">

              {productShares.map((item) => (
                <div
                  className="dashboard-bar-item"
                  key={item.productId}
                >

                  <div className="dashboard-bar-info">
                    <strong>{item.product.name}</strong>

                    <span>
                      {item.quantity} units
                    </span>
                  </div>

                  <div className="dashboard-track">

                    <div
                      className="dashboard-progress"
                      style={{
                        width: `${item.share}%`,
                      }}
                    />

                  </div>

                  <p>
                    {item.share.toFixed(1)}% of selected units
                  </p>

                </div>
              ))}

            </div>

          )}

        </div>

        {/* QUICK SUMMARY */}

        <aside className="dashboard-panel dashboard-side">

          <p className="dashboard-eyebrow">
            COLLECTION SUMMARY
          </p>

          <h2>Quick Insights</h2>

          <div className="dashboard-insight">

            <span>Most Selected Watch</span>

            <strong>
              {mostSelected
                ? mostSelected.product.name
                : 'No selection yet'}
            </strong>

          </div>

          <div className="dashboard-insight">

            <span>Total Cart Items</span>

            <strong>{items.length}</strong>

          </div>

          <div className="dashboard-insight">

            <span>Known Cart Value</span>

            <strong>{totalValue === null ? 'Unavailable' : formatUsd(totalValue)}</strong>

          </div>

          <div className="dashboard-actions">

            <Link to={routes.products}>
              Browse Collection →
            </Link>

            <Link to={routes.cart}>
              Manage Cart →
            </Link>

          </div>

        </aside>

      </section>

      {/* CURRENT CART PRODUCTS */}

      <section className="dashboard-panel dashboard-table-panel">

        <div className="dashboard-panel-header">

          <div>
            <p className="dashboard-eyebrow">
              CURRENT SELECTION
            </p>

            <h2>Selected Products</h2>
          </div>

          <Link to={routes.cart}>
            Manage Cart →
          </Link>

        </div>

        {items.length === 0 ? (

          <p className="dashboard-table-empty">
            No products available to display.
          </p>

        ) : (

          <div className="dashboard-table-wrapper">

            <table className="dashboard-table">

              <thead>
                <tr>
                  <th>Product</th>
                  <th>Reference</th>
                  <th>Quantity</th>
                  <th>Unit Price</th>
                  <th>Subtotal</th>
                </tr>
              </thead>

              <tbody>

                {items.map((item) => {
                  const unitPrice = dollarsToMinor(item.product.price ?? Number.NaN)
                  const lineTotal = lineTotalMinor(item)
                  return (
                  <tr key={item.productId}>

                    <td>{item.product.name}</td>

                    <td>
                      {item.product.referenceNumber || '—'}
                    </td>

                    <td>{item.quantity}</td>

                    <td>
                      {unitPrice === null
                        ? 'Unavailable'
                        : formatUsd(unitPrice)}
                    </td>

                    <td>
                      {lineTotal === null
                        ? 'Unavailable'
                        : formatUsd(lineTotal)}
                    </td>

                  </tr>

                  )
                })}

              </tbody>

            </table>

          </div>

        )}

      </section>

    </section>
  )
}

export default DashboardPage
