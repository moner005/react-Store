import type { CartItem } from '@/types/cart'
import { dollarsToMinor } from './money.ts'

export function lineTotalMinor(item: CartItem): number | null {
  if (!Number.isSafeInteger(item.quantity) || item.quantity < 1) return null
  const unitPrice = item.product.price === null ? null : dollarsToMinor(item.product.price)
  if (unitPrice === null) return null
  const total = unitPrice * item.quantity
  return Number.isSafeInteger(total) ? total : null
}

export function productSubtotal(items: CartItem[]): number | null {
  let total = 0
  for (const item of items) {
    const line = lineTotalMinor(item)
    if (line === null || !Number.isSafeInteger(total + line)) return null
    total += line
  }
  return total
}

export function countCartItems(items: CartItem[]): number | null {
  let count = 0
  for (const item of items) {
    if (!Number.isSafeInteger(item.quantity) || item.quantity < 1 || !Number.isSafeInteger(count + item.quantity)) return null
    count += item.quantity
  }
  return count
}
