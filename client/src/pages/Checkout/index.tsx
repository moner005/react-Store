import { useRef, useState } from 'react'
import { generatePath, Link, useNavigate, useParams } from 'react-router-dom'
import { routes, storeBranches } from '@/constants/routes'
import { readLegacyOrderById } from '@/services/orderStorage'
import { useCartStore } from '@/stores/cartStore'
import { dollarsToMinor, formatUsd } from '@/utils/money'
import { countCartItems, lineTotalMinor, productSubtotal } from '@/utils/totals'
import './checkout.css'

export default function CheckoutPage() {
  const { id } = useParams()
  return id ? <OrderConfirmation id={id} /> : <OrderReview />
}

function OrderReview() {
  const navigate = useNavigate()
  const items = useCartStore((state) => state.items)
  const branchId = useCartStore((state) => state.selectedBranchId)
  const revision = useCartStore((state) => state.revision)
  const latestOrder = useCartStore((state) => state.latestOrder)
  const update = useCartStore((state) => state.updateQuantity)
  const remove = useCartStore((state) => state.removeItem)
  const clear = useCartStore((state) => state.clear)
  const placeOrder = useCartStore((state) => state.placeOrder)
  const subtotal = productSubtotal(items)
  const count = countCartItems(items)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const submitting = useRef(false)
  const confirmation = latestOrder ? generatePath(routes.orderConfirmation, { id: latestOrder.id }) : null

  async function confirmOrder() {
    if (submitting.current || subtotal === null || !items.length) return
    submitting.current = true
    setSaving(true)
    setError('')
    const result = await placeOrder(revision, subtotal)
    submitting.current = false
    setSaving(false)
    if (result.ok && result.order) {
      navigate(generatePath(routes.orderConfirmation, { id: result.order.id }), { replace: true })
      return
    }
    if (result.reason === 'stale') {
      setError('Your cart changed in another tab. The latest cart is shown; review it again before confirming.')
    } else if (result.reason === 'branch-required') {
      setError('Choose a branch before confirming this order.')
    } else {
      setError('The order could not be saved. Your cart is still here. Please try again.')
    }
  }

  async function mutate(action: () => Promise<{ ok: boolean; reason?: string }>) {
    setError('')
    const result = await action()
    if (!result.ok) setError(result.reason === 'stale'
      ? 'Your cart changed in another tab. The latest cart is shown; review it again.'
      : 'The cart could not be saved. Your items are still here. Please try again.')
  }

  return <section className="review-page">
    <h1>Check your order</h1>
    <p className="review-intro">Review your items and subtotal before confirming.</p>
    {error && <p className="review-error" role="alert">{error}</p>}
    {items.length === 0 ? <div className="review-empty">
      <h2>Your cart is empty</h2>
      <p>Choose a branch to browse the collection.</p>
      <Link className="review-button" to={routes.store}>Browse watches</Link>
      {confirmation && <p><Link to={confirmation}>View your latest order confirmation</Link></p>}
    </div> : <>
      {branchId && <div className="review-branch"><strong>Selected branch</strong><span>{storeBranches[branchId as keyof typeof storeBranches] ?? 'Unavailable'}</span></div>}
      {!branchId && <p className="review-error" role="alert">This cart has no branch selection. Clear it and choose a branch before checkout.</p>}
      <div className="review-columns">
        <section aria-label="Cart items">
          <div className="review-count">{count ?? 'Unavailable'} {count === 1 ? 'item' : 'items'}</div>
          {items.map((item) => {
            const unitPrice = item.product.price === null ? null : dollarsToMinor(item.product.price)
            const line = lineTotalMinor(item)
            return <article className="review-item" key={item.productId}>
              <div className="review-item-copy">
                <h2>{item.product.name || `Product ${item.productId}`}</h2>
                <span>Unit price · {unitPrice === null ? 'Unavailable' : formatUsd(unitPrice)}</span>
                <span>Line price · {line === null ? 'Unavailable' : formatUsd(line)}</span>
              </div>
              <div className="review-item-actions">
                <label htmlFor={`quantity-${item.productId}`}>Quantity
                  <input id={`quantity-${item.productId}`} type="number" min="1" max={Number.MAX_SAFE_INTEGER} step="1" value={item.quantity}
                    onChange={(event) => { const quantity = event.currentTarget.valueAsNumber; if (Number.isSafeInteger(quantity) && quantity > 0) void mutate(() => update(item.productId, quantity, revision)) }} />
                </label>
                <button type="button" className="review-text-button" onClick={() => void mutate(() => remove(item.productId, revision))}>Remove</button>
              </div>
            </article>
          })}
          <button type="button" className="review-text-button" onClick={() => void mutate(() => clear(revision))}>Clear selection</button>
        </section>
        <aside className="review-summary">
          <h2>Summary</h2>
          <p><span>Product subtotal</span><strong>{subtotal === null ? 'Unavailable' : formatUsd(subtotal)}</strong></p>
          <p><span>Taxes and delivery</span><strong>Not included</strong></p>
          <div className="review-total"><span>Order total</span><strong>{subtotal === null ? 'Unavailable' : formatUsd(subtotal)}</strong></div>
          {subtotal === null && <p className="review-summary-note">Remove items with unavailable or unsupported prices to continue.</p>}
          <button className="review-button" type="button" onClick={() => void confirmOrder()}
            disabled={saving || subtotal === null || !branchId}>{saving ? 'Saving…' : 'Confirm order'}</button>
          <Link className="review-button review-secondary" to={routes.store}>Continue shopping</Link>
          {confirmation && <Link className="review-button review-secondary" to={confirmation}>Latest order confirmation</Link>}
        </aside>
      </div>
    </>}
  </section>
}

function OrderConfirmation({ id }: { id: string }) {
  const stored = useCartStore((state) => state.latestOrder)
  const shared = stored?.id === id ? stored : null
  const order = shared ?? readLegacyOrderById(id)
  if (!order) return <section className="review-page"><h1>Order confirmation unavailable</h1>
    <p>This browser can open its latest saved confirmation.</p>
    <Link className="review-button" to={routes.store}>Return to store</Link></section>

  return <section className="review-page">
    <h1>Order confirmed</h1>
    <div className="review-notice"><strong>Confirmation ID</strong>{order.id}<br />{new Date(order.createdAt).toLocaleString()}</div>
    {shared && <div className="review-branch"><strong>Branch</strong><span>{storeBranches[shared.branchId]}</span></div>}
    <section aria-label="Confirmed items">{order.items.map((item) => <article className="review-item" key={item.productId}>
      <div className="review-item-copy"><h2>{item.name}</h2><span>Quantity · {item.quantity}</span>
        <span>Unit price · {formatUsd(item.unitPriceCents)}</span><span>Line total · {formatUsd(item.lineTotalCents)}</span></div>
    </article>)}</section>
    <div className="review-total"><span>Order total</span><strong>{formatUsd(order.totalCents)}</strong></div>
    <Link className="review-button" to={routes.store}>Return to store</Link>
  </section>

}
