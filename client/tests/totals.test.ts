import assert from 'node:assert/strict'
import test from 'node:test'
import type { CartItem } from '../src/types/cart.ts'
import { productSubtotal } from '../src/utils/totals.ts'
import { formatUsd } from '../src/utils/money.ts'
import { useCartStore } from '../src/stores/cartStore.ts'

test('calculates USD subtotal including zero prices', () => {
  const items: CartItem[] = [
    { productId: 'a', quantity: 2, product: { name: 'A', priceMinor: 1250, currency: 'USD' } },
    { productId: 'b', quantity: 1, product: { name: 'B', priceMinor: 0, currency: 'USD' } },
  ]
  assert.equal(productSubtotal(items), 2500)
})

test('formats minor USD units without losing cents at the safe integer limit', () => {
  assert.equal(formatUsd(0), '$0.00')
  assert.equal(formatUsd(1250), '$12.50')
  assert.equal(formatUsd(Number.MAX_SAFE_INTEGER), '$90,071,992,547,409.91')
  assert.equal(formatUsd(-1), 'Price unavailable')
  assert.equal(formatUsd(1.5), 'Price unavailable')
})

test('marks incomplete, invalid, or overflowing totals unavailable', () => {
  assert.equal(productSubtotal([{ productId: 'a', quantity: 1 }]), null)
  assert.equal(productSubtotal([{ productId: 'a', quantity: 1, product: { name: 'A', priceMinor: -1, currency: 'USD' } }]), null)
  assert.equal(productSubtotal([{ productId: 'a', quantity: 1, product: { name: 'A', priceMinor: 1, currency: 'EUR' as 'USD' } }]), null)
  assert.equal(productSubtotal([{ productId: 'a', quantity: Number.MAX_SAFE_INTEGER, product: { name: 'A', priceMinor: 2, currency: 'USD' } }]), null)
  assert.equal(productSubtotal([{ productId: 'a', quantity: 0, product: { name: 'A', priceMinor: 1, currency: 'USD' } }]), null)
  assert.equal(productSubtotal([{ productId: 'a', quantity: 1, product: { name: 'A', priceMinor: 1.5, currency: 'USD' } }]), null)
  assert.equal(productSubtotal([
    { productId: 'a', quantity: 1, product: { name: 'A', priceMinor: Number.MAX_SAFE_INTEGER, currency: 'USD' } },
    { productId: 'b', quantity: 1, product: { name: 'B', priceMinor: 1, currency: 'USD' } },
  ]), null)
})

test('cart quantity updates validate input and only change the matching item', () => {
  const items = [
    { productId: 'a', quantity: 2 },
    { productId: 'b', quantity: 3 },
  ]
  useCartStore.setState({ items, selectedBranchId: 'branch-a' })
  const update = useCartStore.getState().updateQuantity
  for (const quantity of [0, -1, 1.5, Number.NaN, Number.POSITIVE_INFINITY, Number.MAX_SAFE_INTEGER + 1]) {
    update('a', quantity)
    assert.deepEqual(useCartStore.getState().items, items)
  }
  update('a', 4)
  assert.deepEqual(useCartStore.getState().items, [
    { productId: 'a', quantity: 4 },
    { productId: 'b', quantity: 3 },
  ])
  assert.equal(useCartStore.getState().selectedBranchId, 'branch-a')
})

test('remove and clear preserve the selected branch', () => {
  useCartStore.setState({ items: [{ productId: 'a', quantity: 1 }, { productId: 'b', quantity: 2 }], selectedBranchId: 'branch-b' })
  useCartStore.getState().remove('a')
  assert.deepEqual(useCartStore.getState().items, [{ productId: 'b', quantity: 2 }])
  assert.equal(useCartStore.getState().selectedBranchId, 'branch-b')
  useCartStore.getState().clear()
  assert.deepEqual(useCartStore.getState().items, [])
  assert.equal(useCartStore.getState().selectedBranchId, 'branch-b')
})
