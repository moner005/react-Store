import { Link } from 'react-router-dom'
import { routes } from '@/constants/routes'
import { useCartStore } from '@/stores/cartStore'
import { dollarsToMinor, formatUsd } from '@/utils/money'
import { countCartItems, lineTotalMinor, productSubtotal } from '@/utils/totals'
import './checkout.css'

export default function CheckoutPage() {
  const items = useCartStore((state) => state.items)
  const branch = useCartStore((state) => state.selectedBranchId)
  const update = useCartStore((state) => state.updateQuantity)
  const remove = useCartStore((state) => state.removeItem)
  const clear = useCartStore((state) => state.clear)
  const subtotal = productSubtotal(items)
  const count = countCartItems(items)

  return (
    <section className="review-page">
      <p className="eyebrow">Your selection · Review only</p>
      <h1>Check your order</h1>
      <p className="review-intro">Take a moment to review your selection. No order is placed from this page.</p>
      <div className="review-notice" role="note">
        <strong>Availability and final pricing are not confirmed.</strong>
        Stock has not been checked. Taxes and delivery are not yet calculated; the full order total is unconfirmed.
      </div>

      {items.length === 0 ? (
        <div className="review-empty">
          <h2>Your cart is waiting</h2>
          <p>Explore the collection and return here when you have a selection to review.</p>
          <Link className="review-button" to={routes.products}>Browse watches</Link>
        </div>
      ) : (
        <>
          <div className="review-branch">
            <span>Selected boutique</span>
            <strong>{branch || 'No boutique selected'}</strong>
          </div>
          <div className="review-columns">
            <section aria-label="Cart items">
              <div className="review-count">{count ?? 'Unavailable'} {count === 1 ? 'item' : 'items'}</div>
              {items.map((item) => {
                const product = item.product
                const unitPrice = dollarsToMinor(product.price ?? Number.NaN)
                const lineTotal = lineTotalMinor(item)

                return (
                  <article className="review-item" key={item.productId}>
                    <div className="review-item-copy">
                      <h2>{product?.name || `Product ${item.productId}`}</h2>
                      <span>Unit price · {unitPrice === null ? 'Unavailable' : formatUsd(unitPrice)}</span>
                      <span>Line price · {lineTotal === null ? 'Unavailable' : formatUsd(lineTotal)}</span>
                      <small>Stock · Not checked</small>
                    </div>
                    <div className="review-item-actions">
                      <label htmlFor={`quantity-${item.productId}`}>
                        Quantity
                        <input
                          id={`quantity-${item.productId}`}
                          type="number"
                          min="1"
                          step="1"
                          value={item.quantity}
                          onChange={(event) => {
                            const quantity = event.currentTarget.valueAsNumber
                            if (Number.isSafeInteger(quantity) && quantity > 0) update(item.productId, quantity)
                          }}
                        />
                      </label>
                      <button type="button" className="review-text-button" onClick={() => remove(item.productId)}>Remove</button>
                    </div>
                  </article>
                )
              })}
              <button type="button" className="review-text-button" onClick={clear}>Clear selection</button>
            </section>
            <aside className="review-summary">
              <h2>Summary</h2>
              <p><span>Product subtotal</span><strong>{subtotal === null ? 'Unavailable' : formatUsd(subtotal)}</strong></p>
              <p><span>Tax and delivery</span><strong>Not calculated</strong></p>
              <div className="review-total"><span>Full order total</span><strong>Unconfirmed</strong></div>
              <p className="review-summary-note">Review only. Order placement will be available when this project’s commerce flow is ready.</p>
              <Link className="review-button" to={routes.products}>Continue browsing</Link>
            </aside>
          </div>
        </>
      )}
    </section>
  )
}
