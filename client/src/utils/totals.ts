import type { CartItem } from '@/types/cart'

export function productSubtotal(items: CartItem[]): number | null {
  let total = 0
  for (const item of items) {
    const price = item.product?.priceMinor
    if (!Number.isSafeInteger(item.quantity) || item.quantity < 1 || !Number.isSafeInteger(price) || (price as number) < 0 || item.product?.currency !== 'USD') return null
    const line = (price as number) * item.quantity
    if (!Number.isSafeInteger(line) || !Number.isSafeInteger(total + line)) return null
    total += line
  }
  return total
}
