import assert from 'node:assert/strict'
import test from 'node:test'
import type { CartItem } from '../src/types/cart.ts'
import { dollarsToMinor, formatUsd } from '../src/utils/money.ts'
import { countCartItems, lineTotalMinor, productSubtotal } from '../src/utils/totals.ts'

class MemoryStorage {
  private values = new Map<string, string>()
  getItem(key: string) { return this.values.get(key) ?? null }
  setItem(key: string, value: string) { this.values.set(key, value) }
  removeItem(key: string) { this.values.delete(key) }
}

const storage = new MemoryStorage()
Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: storage })
const savedValidItem = { productId: 'kept', quantity: 2, product: { id: 'kept', name: 'Kept', price: 12.5 } }
storage.setItem('rolex-store-cart', JSON.stringify({ state: {
  items: [
    savedValidItem,
    { productId: 'unsafe', quantity: Number.MAX_SAFE_INTEGER + 1, product: { id: 'unsafe', name: 'Unsafe', price: 2 } },
    { productId: 'fractional', quantity: 1, product: { id: 'fractional', name: 'Fractional', price: 1.239 } },
    { productId: 'negative', quantity: 1, product: { id: 'negative', name: 'Negative', price: -1 } },
    { productId: 'broken', quantity: 1, product: { id: 'other', name: 'Broken', price: 1 } },
  ],
  selectedBranchId: 'branch-north',
} }))
const { useCartStore } = await import('../src/stores/cartStore.ts')

function item(productId: string, price: number | null, quantity = 1): CartItem {
  return { productId, quantity, product: { id: productId, name: productId, price } }
}

test('hydrates valid cart lines, normalizes unsupported legacy prices, and rejects unsafe entries', () => {
  assert.deepEqual(useCartStore.getState().items, [
    savedValidItem,
    { productId: 'fractional', quantity: 1, product: { id: 'fractional', name: 'Fractional', price: null } },
    { productId: 'negative', quantity: 1, product: { id: 'negative', name: 'Negative', price: null } },
  ])
  assert.equal(useCartStore.getState().selectedBranchId, 'branch-north')
})

test('converts supported legacy dollar prices to exact minor units', () => {
  assert.equal(dollarsToMinor(0), 0)
  assert.equal(dollarsToMinor(12.5), 1250)
  assert.equal(dollarsToMinor(0.29), 29)
  assert.equal(dollarsToMinor(-1), null)
  assert.equal(dollarsToMinor(1.239), null)
  assert.equal(dollarsToMinor(Number.NaN), null)
  assert.equal(dollarsToMinor(90_071_992_547_410), null)
})

test('formats cents exactly, including the safe integer boundary', () => {
  assert.equal(formatUsd(0), '$0.00')
  assert.equal(formatUsd(1250), '$12.50')
  assert.equal(formatUsd(Number.MAX_SAFE_INTEGER), '$90,071,992,547,409.91')
  assert.equal(formatUsd(-1), 'Price unavailable')
  assert.equal(formatUsd(1.5), 'Price unavailable')
})

test('shares safe subtotal and line calculations across cart views', () => {
  assert.equal(lineTotalMinor(item('zero', 0, 2)), 0)
  assert.equal(lineTotalMinor(item('fractional', 2.345)), null)
  assert.equal(lineTotalMinor(item('overflow-line', 90_071_992_547_409.9, 2)), null)
  assert.equal(productSubtotal([item('a', 12.5, 2), item('b', 0.29)]), 2529)
  assert.equal(productSubtotal([item('a', 12.5), item('b', null)]), null)
  assert.equal(productSubtotal([item('a', 90_071_992_547_409.9), item('b', 0.08)]), null)
  assert.equal(countCartItems([item('a', null, 2), item('b', 0, 3)]), 5)
  assert.equal(countCartItems([item('bad', 1, Number.MAX_SAFE_INTEGER), item('overflow', 1, 1)]), null)
})

test('quantity actions reject invalid values and update only the requested line', () => {
  useCartStore.setState({ items: [item('first', 1, 2), item('second', 2, 3)], selectedBranchId: 'branch-south' })
  const update = useCartStore.getState().updateQuantity
  for (const quantity of [0, -1, 1.5, Number.NaN, Number.POSITIVE_INFINITY, Number.MAX_SAFE_INTEGER + 1]) {
    update('first', quantity)
    assert.deepEqual(useCartStore.getState().items.map(({ quantity: q }) => q), [2, 3])
  }
  update('first', 4)
  assert.deepEqual(useCartStore.getState().items.map(({ quantity: q }) => q), [4, 3])
  assert.equal(useCartStore.getState().selectedBranchId, 'branch-south')
})

test('addItem reports rejected overflow and remove/clear retain the branch', () => {
  useCartStore.setState({ items: [item('max', null, Number.MAX_SAFE_INTEGER), item('remove-me', 1)], selectedBranchId: 'branch-west' })
  assert.equal(useCartStore.getState().addItem({ id: 'max', name: 'max', price: null }), false)
  assert.equal(useCartStore.getState().items[0].quantity, Number.MAX_SAFE_INTEGER)
  assert.equal(useCartStore.getState().addItem({ id: 'unsupported', name: 'unsupported', price: 1.239 }), false)
  useCartStore.getState().removeItem('remove-me')
  assert.deepEqual(useCartStore.getState().items.map((line) => line.productId), ['max'])
  assert.equal(useCartStore.getState().selectedBranchId, 'branch-west')
  useCartStore.getState().clear()
  assert.deepEqual(useCartStore.getState().items, [])
  assert.equal(useCartStore.getState().selectedBranchId, 'branch-west')
})
