import { useState } from 'react'
import { generatePath, Link } from 'react-router-dom'
import { routes, storeBranches } from '@/constants/routes'
import { WatchPhoto } from '@/components/common/WatchPhoto'
import { useCartStore } from '@/stores/cartStore'
import { dollarsToMinor, formatUsd } from '@/utils/money'
import { countCartItems, lineTotalMinor, productSubtotal } from '@/utils/totals'
import './Cart.css'

export default function CartPage() {
  const items = useCartStore((state) => state.items)
  const branchId = useCartStore((state) => state.selectedBranchId)
  const revision = useCartStore((state) => state.revision)
  const latestOrder = useCartStore((state) => state.latestOrder)
  const updateQuantity = useCartStore((state) => state.updateQuantity)
  const removeItem = useCartStore((state) => state.removeItem)
  const clear = useCartStore((state) => state.clear)
  const [error, setError] = useState('')
  const subtotal = productSubtotal(items)
  const count = countCartItems(items)
  const hasBranch = branchId === 'damascus' || branchId === 'latakia'
  const confirmation = latestOrder ? generatePath(routes.orderConfirmation, { id: latestOrder.id }) : null

  async function mutate(action: () => Promise<{ ok: boolean; reason?: string }>) {
    setError('')
    const result = await action()
    if (!result.ok) setError(result.reason === 'stale'
      ? 'Your cart changed in another tab. The latest cart is shown; review it again.'
      : 'The cart could not be saved. Your items are still here. Please try again.')
  }

  return (
    <section className="cart-page">
      <header className="cart-header">
        <h1>Your cart</h1>
        <p>Review your selection before checkout.</p>
        {items.length > 0 && <Link className="cart-primary-button cart-header-checkout" to={routes.checkout}>Checkout</Link>}
      </header>

      {error && <p className="review-error" role="alert">{error}</p>}
      {items.length === 0 ? (
        <div className="cart-empty">
          <h2>Your cart is empty</h2>
          <p>Choose a branch to browse the collection.</p>
          <Link className="cart-primary-button" to={routes.store}>Browse watches</Link>
          {confirmation && <p><Link to={confirmation}>View your latest order confirmation</Link></p>}
        </div>
      ) : (
        <div className="cart-layout">
          <section className="cart-items-panel" aria-label="Cart items">
            <div className="cart-panel-heading">
              <h2>Selected watches</h2>
              <span>{count ?? 'Unavailable'} {count === 1 ? 'item' : 'items'}</span>
            </div>
            {branchId && <p className="cart-notice">Selected branch · {storeBranches[branchId as keyof typeof storeBranches]}</p>}
            {!hasBranch && <p className="cart-notice" role="status">This older cart has no branch selection. Clear it, then choose a branch before adding watches.</p>}
            {items.map((item) => {
              const line = lineTotalMinor(item)
              return <article className="cart-item" key={item.productId}>
                <div className="cart-item-image"><WatchPhoto path={item.product.image} name={item.product.name} className="cart-item-photo" /></div>
                <div className="cart-item-info">
                  <h3>{item.product.name}</h3>
                  <p className="cart-unit-price">{item.product.price === null || dollarsToMinor(item.product.price) === null ? 'Price unavailable' : formatUsd(dollarsToMinor(item.product.price)!)}</p>
                  <div className="cart-quantity" aria-label={`Quantity for ${item.product.name}`}>
                    <button type="button" aria-label={`Decrease ${item.product.name} quantity`} disabled={item.quantity <= 1}
                      onClick={() => void mutate(() => updateQuantity(item.productId, item.quantity - 1, revision))}>−</button>
                    <span>{item.quantity}</span>
                    <button type="button" aria-label={`Increase ${item.product.name} quantity`} disabled={!Number.isSafeInteger(item.quantity + 1)}
                      onClick={() => void mutate(() => updateQuantity(item.productId, item.quantity + 1, revision))}>+</button>
                  </div>
                </div>
                <div className="cart-item-actions">
                  <strong className="cart-line-total">{line === null ? 'Unavailable' : formatUsd(line)}</strong>
                  <button type="button" className="cart-remove" onClick={() => void mutate(() => removeItem(item.productId, revision))}>Remove</button>
                </div>
              </article>
            })}
            <div className="cart-bottom-actions">
              <Link className="cart-continue" to={routes.store}>Continue shopping</Link>
              <button type="button" className="cart-clear" onClick={() => void mutate(() => clear(revision))}>Clear cart</button>
            </div>
          </section>
          <aside className="cart-summary">
            <h2>Order summary</h2>
            <p className="summary-row"><span>Product subtotal</span><strong>{subtotal === null ? 'Unavailable' : formatUsd(subtotal)}</strong></p>
            <p className="summary-row"><span>Taxes and delivery</span><strong>Not included</strong></p>
            <div className="summary-divider" />
            <div className="summary-total"><span>Order total</span><strong>{subtotal === null ? 'Unavailable' : formatUsd(subtotal)}</strong></div>
            {subtotal === null && <p className="summary-notice">One or more prices or quantities cannot be totaled. Remove unsupported items to continue.</p>}
            <div className="cart-summary-actions">
              {hasBranch && subtotal !== null
                ? <Link className="cart-primary-button" to={routes.checkout}>Checkout</Link>
                : <span className="summary-notice">Choose a branch and verify prices before checkout.</span>}
              {confirmation && <Link className="cart-secondary-button" to={confirmation}>Latest order confirmation</Link>}
            </div>
          </aside>
        </div>
      )}
    </section>
  )
}
