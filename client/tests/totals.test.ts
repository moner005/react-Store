import assert from 'node:assert/strict'
import test from 'node:test'
import type { CartItem } from '../src/types/cart.ts'
import { dollarsToMinor, formatUsd } from '../src/utils/money.ts'
import { countCartItems, lineTotalMinor, productSubtotal } from '../src/utils/totals.ts'

class MemoryStorage {
  private values = new Map<string, string>()
  failWrites = false
  getItem(key: string) { return this.values.get(key) ?? null }
  setItem(key: string, value: string) { if (this.failWrites) throw new Error('blocked'); this.values.set(key, value) }
  removeItem(key: string) { this.values.delete(key) }
  reset() { this.values.clear(); this.failWrites = false }
}

const storage = new MemoryStorage()
Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: storage })
Object.defineProperty(globalThis, 'navigator', { configurable: true, value: { locks: {
  request: (_name: string, _options: { mode: string }, callback: () => unknown) => Promise.resolve(callback()),
} } })
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
  assert.equal(useCartStore.getState().selectedBranchId, null)
})

test('migrates v2 cart lines and latest receipt while unscoping populated carts', async () => {
  const receipt = {
    id: 'v2-receipt', createdAt: '2026-11-14T12:00:00.000Z', branchId: 'damascus', reviewedRevision: 'v2-review',
    items: [{ productId: 'kept', name: 'Kept', quantity: 2, unitPriceCents: 1250, lineTotalCents: 2500 }], totalCents: 2500,
  }
  storage.removeItem('rolex-store-cart-v3')
  storage.setItem('rolex-store-cart-v2', JSON.stringify({
    version: 2, items: [savedValidItem], selectedBranchId: 'damascus', revision: 'prior-revision', latestOrder: receipt,
  }))
  const blockedAdd = await useCartStore.getState().addItem({ id: 'new', name: 'New', price: 1 }, 'latakia')
  assert.equal(blockedAdd.reason, 'branch-required')
  assert.deepEqual(useCartStore.getState().items, [savedValidItem])
  assert.equal(useCartStore.getState().selectedBranchId, null)
  assert.equal(useCartStore.getState().latestOrder?.id, 'v2-receipt')
  const cleared = await useCartStore.getState().clear(useCartStore.getState().revision)
  assert.equal(cleared.ok, true)
  const migrated = JSON.parse(storage.getItem('rolex-store-cart-v3') ?? 'null')
  assert.equal(migrated.version, 3)
  assert.equal(migrated.latestOrder.id, 'v2-receipt')
  assert.equal(storage.getItem('rolex-store-cart-v2'), null)
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

function seed(items: CartItem[], branch: 'damascus' | 'latakia' | null = 'damascus') {
  const envelope = { version: 3, items, selectedBranchId: branch, revision: 'test-revision', latestOrder: null }
  storage.setItem('rolex-store-cart-v3', JSON.stringify(envelope))
  useCartStore.setState(envelope)
}

test('quantity actions reject invalid values and update only the requested line', async () => {
  storage.reset()
  seed([item('first', 1, 2), item('second', 2, 3)])
  const update = useCartStore.getState().updateQuantity
  for (const quantity of [0, -1, 1.5, Number.NaN, Number.POSITIVE_INFINITY, Number.MAX_SAFE_INTEGER + 1]) {
    const result = await update('first', quantity, useCartStore.getState().revision)
    assert.equal(result.ok, false)
    assert.deepEqual(useCartStore.getState().items.map(({ quantity: q }) => q), [2, 3])
  }
  const updated = await update('first', 4, useCartStore.getState().revision)
  assert.equal(updated.ok, true)
  assert.deepEqual(useCartStore.getState().items.map(({ quantity: q }) => q), [4, 3])
  assert.equal(useCartStore.getState().selectedBranchId, 'damascus')
})

test('branch isolation is enforced and branch switch replaces the cart atomically', async () => {
  storage.reset()
  seed([])
  const store = useCartStore.getState()
  const first = await store.addItem({ id: 'watch-a', name: 'Watch A', price: 12 }, 'damascus', store.revision)
  assert.equal(first.ok, true)
  const rejected = await useCartStore.getState().addItem({ id: 'watch-b', name: 'Watch B', price: 15 }, 'latakia', first.revision)
  assert.equal(rejected.reason, 'branch-switch-required')
  assert.deepEqual(useCartStore.getState().items.map((line) => line.productId), ['watch-a'])
  const switched = await useCartStore.getState().switchBranchWithItem('latakia', { id: 'watch-b', name: 'Watch B', price: 15 }, useCartStore.getState().revision)
  assert.equal(switched.ok, true)
  assert.equal(useCartStore.getState().selectedBranchId, 'latakia')
  assert.deepEqual(useCartStore.getState().items.map((line) => line.productId), ['watch-b'])
})

test('addItem rejects overflow and remove/clear retain the branch', async () => {
  storage.reset()
  seed([item('max', null, Number.MAX_SAFE_INTEGER), item('remove-me', 1)])
  const beforeRevision = useCartStore.getState().revision
  const overflow = await useCartStore.getState().addItem({ id: 'max', name: 'max', price: null }, 'damascus', beforeRevision)
  assert.equal(overflow.reason, 'overflow')
  assert.equal(useCartStore.getState().items[0].quantity, Number.MAX_SAFE_INTEGER)
  const unsupported = await useCartStore.getState().addItem({ id: 'unsupported', name: 'unsupported', price: 1.239 }, 'damascus', beforeRevision)
  assert.equal(unsupported.ok, false)
  const removed = await useCartStore.getState().removeItem('remove-me', beforeRevision)
  assert.equal(removed.ok, true)
  assert.deepEqual(useCartStore.getState().items.map((line) => line.productId), ['max'])
  assert.equal(useCartStore.getState().selectedBranchId, 'damascus')
  const cleared = await useCartStore.getState().clear(useCartStore.getState().revision)
  assert.equal(cleared.ok, true)
  assert.deepEqual(useCartStore.getState().items, [])
  assert.equal(useCartStore.getState().selectedBranchId, 'damascus')
})

test('same review confirms once and replay never consumes a newer cart', async () => {
  storage.reset()
  seed([item('one', 10)])
  const revision = useCartStore.getState().revision
  const [first, replay] = await Promise.all([
    useCartStore.getState().placeOrder(revision, 1000),
    useCartStore.getState().placeOrder(revision, 1000),
  ])
  assert.equal(first.ok, true)
  assert.equal(replay.ok, true)
  assert.equal(first.order?.id, replay.order?.id)
  assert.equal(useCartStore.getState().items.length, 0)
  const added = await useCartStore.getState().addItem({ id: 'two', name: 'Two', price: 5 }, 'damascus', useCartStore.getState().revision)
  assert.equal(added.ok, true)
  const replayAfterNewCart = await useCartStore.getState().placeOrder(revision, 1000)
  assert.equal(replayAfterNewCart.order?.id, first.order?.id)
  assert.deepEqual(useCartStore.getState().items.map((line) => line.productId), ['two'])
})

test('stale review never consumes changed cart and failed storage writes stay unpublished', async () => {
  storage.reset()
  seed([item('one', 10)])
  const staleRevision = useCartStore.getState().revision
  const updated = await useCartStore.getState().updateQuantity('one', 2, staleRevision)
  assert.equal(updated.ok, true)
  const staleOrder = await useCartStore.getState().placeOrder(staleRevision, 1000)
  assert.equal(staleOrder.reason, 'stale')
  assert.equal(useCartStore.getState().items[0].quantity, 2)
  const revision = useCartStore.getState().revision
  storage.failWrites = true
  const failed = await useCartStore.getState().removeItem('one', revision)
  assert.equal(failed.reason, 'storage')
  assert.equal(useCartStore.getState().revision, revision)
  assert.equal(useCartStore.getState().items[0].quantity, 2)
})
