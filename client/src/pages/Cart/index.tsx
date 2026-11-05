
import { Link } from 'react-router-dom'
import { routes } from '@/constants/routes'
import { useCartStore } from '@/stores/cartStore'
import './Cart.css'

const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})

function formatPrice(price: number | null) {
  return price === null
    ? 'Price unavailable'
    : currency.format(price)
}

export default function CartPage() {
  const items = useCartStore((state) => state.items)
  const updateQuantity = useCartStore(
    (state) => state.updateQuantity
  )
  const removeItem = useCartStore(
    (state) => state.removeItem
  )
  const clear = useCartStore((state) => state.clear)

  const totalQuantity = items.reduce(
    (total, item) => total + item.quantity,
    0
  )

  const subtotal = items.reduce(
    (total, item) => {
      if (item.product.price === null) {
        return total
      }

      return total + item.product.price * item.quantity
    },
    0
  )

  const hasUnpricedItems = items.some(
    (item) => item.product.price === null
  )

  return (
    <main className="cart-page">

      <header className="cart-header">
        <div className="cart-eyebrow">
          ROLEX COLLECTION
        </div>

        <h1>Your Shopping Cart</h1>

        <p>
          Review your selected timepieces and manage your collection.
        </p>
      </header>

      {items.length === 0 ? (

        <section className="cart-empty">

          <div className="cart-empty-icon">♛</div>

          <h2>Your Cart is Empty</h2>

          <p>
            Your next timeless piece is waiting for you.
            Explore our Rolex collection.
          </p>

          <Link
            to={routes.products}
            className="cart-primary-button"
          >
            Discover Our Collection →
          </Link>

        </section>

      ) : (

        <div className="cart-layout">

          <section className="cart-items-panel">

            <div className="cart-panel-heading">
              <h2>Selected Watches</h2>
              <span>{totalQuantity} Items</span>
            </div>

            {items.map((item) => {

              const lineTotal =
                item.product.price === null
                  ? null
                  : item.product.price * item.quantity

              return (
                <article
                  className="cart-item"
                  key={item.productId}
                >

                  <div className="cart-item-image">

                    {item.product.image ? (
                      <img
                        src={item.product.image}
                        alt={item.product.name}
                      />
                    ) : (
                      <span className="cart-image-placeholder">
                        ♛
                      </span>
                    )}

                  </div>

                  <div className="cart-item-info">

                    <h3>{item.product.name}</h3>

                    {item.product.referenceNumber && (
                      <p className="cart-reference">
                        Reference: {item.product.referenceNumber}
                      </p>
                    )}

                    <p className="cart-unit-price">
                      {formatPrice(item.product.price)}
                    </p>

                    <div className="cart-quantity">

                      <button
                        type="button"
                        aria-label={`Decrease quantity of ${item.product.name}`}
                        disabled={item.quantity <= 1}
                        onClick={() =>
                          updateQuantity(
                            item.productId,
                            item.quantity - 1
                          )
                        }
                      >
                        −
                      </button>

                      <span>{item.quantity}</span>

                      <button
                        type="button"
                        aria-label={`Increase quantity of ${item.product.name}`}
                        onClick={() =>
                          updateQuantity(
                            item.productId,
                            item.quantity + 1
                          )
                        }
                      >
                        +
                      </button>

                    </div>

                  </div>

                  <div className="cart-item-actions">

                    <strong className="cart-line-total">
                      {formatPrice(lineTotal)}
                    </strong>

                    <button
                      type="button"
                      className="cart-remove"
                      onClick={() =>
                        removeItem(item.productId)
                      }
                    >
                      Remove
                    </button>

                  </div>

                </article>
              )
            })}

            <div className="cart-bottom-actions">

              <Link
                to={routes.products}
                className="cart-continue"
              >
                ← Continue Shopping
              </Link>

              <button
                type="button"
                className="cart-clear"
                onClick={clear}
              >
                Clear Cart
              </button>

            </div>

          </section>

          <aside className="cart-summary">

            <p className="summary-eyebrow">
              YOUR SELECTION
            </p>

            <h2>Order Summary</h2>

            <div className="summary-row">
              <span>Total Items</span>
              <strong>{totalQuantity}</strong>
            </div>

            <div className="summary-row">
              <span>Unique Watches</span>
              <strong>{items.length}</strong>
            </div>

            <div className="summary-row">
              <span>Subtotal</span>
              <strong>{currency.format(subtotal)}</strong>
            </div>

            <div className="summary-divider" />

            <div className="summary-total">
              <span>Known Price Total</span>
              <strong>{currency.format(subtotal)}</strong>
            </div>

            {hasUnpricedItems && (
              <div className="cart-notice">
                Some watches do not have a price in the
                catalogue. They are excluded from this subtotal.
              </div>
            )}

            <p className="summary-notice">
              This is a shopping cart estimate, not a confirmed
              order total. Shipping and taxes are not included.
            </p>

            <div className="cart-summary-actions">

              <Link
                to={routes.products}
                className="cart-primary-button"
              >
                Continue Shopping
              </Link>

              <Link
                to={routes.dashboard}
                className="cart-secondary-button"
              >
                View Dashboard
              </Link>

            </div>

          </aside>

        </div>
      )}

      <div className="cart-dashboard-footer">
        <Link
          to={routes.dashboard}
          className="cart-dashboard-link"
        >
          Explore Store Dashboard →
        </Link>
      </div>

    </main>
  )
}
