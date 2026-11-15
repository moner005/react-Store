import type { CartItem, OrderReceipt, StoredOrder } from '../types/cart.ts'
import { dollarsToMinor } from '../utils/money.ts'
import { lineTotalMinor, productSubtotal } from '../utils/totals.ts'

const LEGACY_RECEIPT_KEY = 'tutorial-order-receipt'

export function buildStoredOrder(items: CartItem[], totalCents: number, branchId: 'damascus' | 'latakia', revision: string): StoredOrder {
  if (!items.length || productSubtotal(items) !== totalCents) throw new Error('Order total is stale or unavailable.')
  const orderItems = items.map((item) => {
    const unitPriceCents = item.product.price === null ? null : dollarsToMinor(item.product.price)
    const lineTotalCents = lineTotalMinor(item)
    if (unitPriceCents === null || lineTotalCents === null) throw new Error('An order item has no valid price.')
    return { productId: item.productId, name: item.product.name.trim() || `Product ${item.productId}`, quantity: item.quantity, unitPriceCents, lineTotalCents }
  })
  return { id: crypto.randomUUID(), createdAt: new Date().toISOString(), branchId, reviewedRevision: revision, items: orderItems, totalCents }
}

export function isOrderReceipt(value: unknown): value is OrderReceipt {
  if (!value || typeof value !== 'object') return false
  const order = value as Partial<OrderReceipt>
  if (typeof order.id !== 'string' || !order.id || typeof order.createdAt !== 'string'
    || !Number.isFinite(Date.parse(order.createdAt)) || !Array.isArray(order.items) || !order.items.length) return false
  let total = 0
  for (const line of order.items) {
    if (!line || typeof line.productId !== 'string' || typeof line.name !== 'string'
      || !Number.isSafeInteger(line.quantity) || line.quantity < 1
      || !Number.isSafeInteger(line.unitPriceCents) || line.unitPriceCents < 0
      || !Number.isSafeInteger(line.lineTotalCents) || line.lineTotalCents !== line.quantity * line.unitPriceCents) return false
    total += line.lineTotalCents
    if (!Number.isSafeInteger(total)) return false
  }
  return total === order.totalCents
}

export function readLegacyOrderById(id: string): OrderReceipt | null {
  try {
    const raw = sessionStorage.getItem(LEGACY_RECEIPT_KEY)
    const value: unknown = raw ? JSON.parse(raw) : null
    return isOrderReceipt(value) && value.id === id ? value : null
  } catch { return null }
}
