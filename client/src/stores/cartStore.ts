import { create } from 'zustand'
import type { CartItem, CartProduct, CartState, StoredOrder } from '../types/cart.ts'
import { dollarsToMinor } from '../utils/money.ts'
import { buildStoredOrder, isOrderReceipt } from '../services/orderStorage.ts'

export const CART_STORAGE_KEY = 'rolex-store-cart-v3'
const V2_CART_KEY = 'rolex-store-cart-v2'
const V1_CART_KEY = 'rolex-store-cart'
const CART_LOCK = 'rolex-store-cart-write'
export type CartFailure = 'storage' | 'lock' | 'stale' | 'branch-required' | 'branch-switch-required' | 'invalid' | 'overflow'
export interface CartActionResult { ok: boolean; reason?: CartFailure; order?: StoredOrder; revision?: string }

interface CartStore extends CartState {
  addItem(product: CartProduct, branchId: 'damascus' | 'latakia', expectedRevision?: string): Promise<CartActionResult>
  updateQuantity(productId: string, quantity: number, expectedRevision: string): Promise<CartActionResult>
  removeItem(productId: string, expectedRevision: string): Promise<CartActionResult>
  clear(expectedRevision: string): Promise<CartActionResult>
  switchBranch(branchId: 'damascus' | 'latakia', expectedRevision: string): Promise<CartActionResult>
  switchBranchWithItem(branchId: 'damascus' | 'latakia', product: CartProduct, expectedRevision: string): Promise<CartActionResult>
  placeOrder(expectedRevision: string, totalCents: number): Promise<CartActionResult>
}

interface Envelope extends CartState { version: 3 }

function newRevision(): string { return crypto.randomUUID() }
function fingerprint(value: string): string {
  let hash = 2_166_136_261
  for (const character of value) hash = Math.imul(hash ^ character.charCodeAt(0), 16_777_619) >>> 0
  return `legacy-${hash.toString(16)}`
}
function emptyEnvelope(): Envelope { return { version: 3, items: [], selectedBranchId: null, revision: 'empty-v3', latestOrder: null } }
function isRecord(value: unknown): value is Record<string, unknown> { return typeof value === 'object' && value !== null && !Array.isArray(value) }
function validBranch(value: unknown): value is 'damascus' | 'latakia' { return value === 'damascus' || value === 'latakia' }

function validProduct(value: unknown): value is CartProduct {
  if (!isRecord(value)) return false
  return typeof value.id === 'string' && value.id.length > 0 && typeof value.name === 'string'
    && (value.price === null || (typeof value.price === 'number' && Number.isFinite(value.price)))
    && (value.image === undefined || typeof value.image === 'string')
    && (value.referenceNumber === undefined || typeof value.referenceNumber === 'string')
}

function validItem(value: unknown): value is CartItem {
  if (!isRecord(value) || !validProduct(value.product)) return false
  return typeof value.productId === 'string' && value.productId === value.product.id
    && Number.isSafeInteger(value.quantity) && (value.quantity as number) > 0
}

function cleanItems(value: unknown): CartItem[] {
  if (!Array.isArray(value)) return []
  return value.filter(validItem).map((item) => ({
    ...item,
    product: { ...item.product, price: item.product.price !== null && dollarsToMinor(item.product.price) === null ? null : item.product.price },
  }))
}

function parseEnvelope(raw: string | null): Envelope | null {
  if (!raw) return null
  try {
    const value: unknown = JSON.parse(raw)
    if (!isRecord(value) || value.version !== 3 || typeof value.revision !== 'string') return null
    return {
      version: 3,
      revision: value.revision,
      items: cleanItems(value.items),
      selectedBranchId: validBranch(value.selectedBranchId) ? value.selectedBranchId : null,
      latestOrder: isStoredOrder(value.latestOrder) ? value.latestOrder : null,
    }
  } catch { return null }
}

function parseV2(raw: string | null): Envelope | null {
  if (!raw) return null
  try {
    const value: unknown = JSON.parse(raw)
    if (!isRecord(value) || value.version !== 2) return null
    const items = cleanItems(value.items)
    return {
      version: 3,
      items,
      selectedBranchId: items.length === 0 && validBranch(value.selectedBranchId) ? value.selectedBranchId : null,
      latestOrder: isStoredOrder(value.latestOrder) ? value.latestOrder : null,
      revision: fingerprint(raw),
    }
  } catch { return null }
}

function parseV1(raw: string | null): Envelope | null {
  if (!raw) return null
  try {
    const outer: unknown = JSON.parse(raw)
    const state = isRecord(outer) && isRecord(outer.state) ? outer.state : outer
    if (!isRecord(state)) return null
    return {
      version: 3,
      items: cleanItems(state.items),
      selectedBranchId: null,
      latestOrder: null,
      revision: fingerprint(raw),
    }
  } catch { return null }
}

function isStoredOrder(value: unknown): value is StoredOrder {
  return isRecord(value) && validBranch(value.branchId) && typeof value.reviewedRevision === 'string' && isOrderReceipt(value)
}

function readDurable(): Envelope {
  const rawCurrent = localStorage.getItem(CART_STORAGE_KEY)
  if (rawCurrent !== null) return parseEnvelope(rawCurrent) ?? emptyEnvelope()
  const rawV2 = localStorage.getItem(V2_CART_KEY)
  if (rawV2 !== null) return parseV2(rawV2) ?? emptyEnvelope()
  return parseV1(localStorage.getItem(V1_CART_KEY)) ?? emptyEnvelope()
}

async function transact(
  setState: (state: CartState) => void,
  expectedRevision: string | undefined,
  operation: (current: Envelope) => { next?: Envelope; result: CartActionResult },
): Promise<CartActionResult> {
  try {
    const lockManager = navigator.locks
    if (!lockManager) return { ok: false, reason: 'lock' }
    return await lockManager.request(CART_LOCK, { mode: 'exclusive' }, () => {
      let current: Envelope
      try { current = readDurable() } catch { return { ok: false, reason: 'storage' } }
      if (expectedRevision && current.revision !== expectedRevision) {
        setState(current)
        return { ok: false, reason: 'stale', revision: current.revision }
      }
      const { next, result } = operation(current)
      if (!next) { setState(current); return result }
      try { localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(next)) }
      catch { return { ok: false, reason: 'storage' } }
      try { localStorage.removeItem(V2_CART_KEY) } catch { /* v3 remains authoritative */ }
      try { localStorage.removeItem(V1_CART_KEY) } catch { /* v3 remains authoritative */ }
      setState(next)
      return result
    })
  } catch { return { ok: false, reason: 'lock' } }
}

const initial = (() => {
  try { return readDurable() } catch { return emptyEnvelope() }
})()

export const useCartStore = create<CartStore>((set) => ({
  ...initial,
  addItem: (product, branchId, expectedRevision) => {
    if (!validProduct(product) || !validBranch(branchId) || (product.price !== null && dollarsToMinor(product.price) === null)) return Promise.resolve({ ok: false, reason: 'invalid' })
    return transact(set, expectedRevision, (current) => {
      if (current.items.length && !current.selectedBranchId) return { result: { ok: false, reason: 'branch-required', revision: current.revision } }
      if (current.items.length && current.selectedBranchId !== branchId) return { result: { ok: false, reason: 'branch-switch-required', revision: current.revision } }
      const existing = current.items.find((item) => item.productId === product.id)
      if (existing && !Number.isSafeInteger(existing.quantity + 1)) return { result: { ok: false, reason: 'overflow' } }
      const items = existing
        ? current.items.map((item) => item.productId === product.id ? { ...item, quantity: item.quantity + 1, product } : item)
        : [...current.items, { productId: product.id, quantity: 1, product }]
      const next = { ...current, items, selectedBranchId: branchId, revision: newRevision() }
      return { next, result: { ok: true, revision: next.revision } }
    })
  },
  updateQuantity: (productId, quantity, revision) => {
    if (!Number.isSafeInteger(quantity) || quantity < 1) return Promise.resolve({ ok: false, reason: 'invalid' })
    return transact(set, revision, (current) => {
      const items = current.items.map((item) => item.productId === productId ? { ...item, quantity } : item)
      if (items.every((item, index) => item === current.items[index])) return { result: { ok: true, revision: current.revision } }
      const next = { ...current, items, revision: newRevision() }
      return { next, result: { ok: true, revision: next.revision } }
    })
  },
  removeItem: (productId, revision) => transact(set, revision, (current) => {
    const items = current.items.filter((item) => item.productId !== productId)
    const next = { ...current, items, revision: newRevision() }
    return { next, result: { ok: true, revision: next.revision } }
  }),
  clear: (revision) => transact(set, revision, (current) => {
    const next = { ...current, items: [], revision: newRevision() }
    return { next, result: { ok: true, revision: next.revision } }
  }),
  switchBranch: (branchId, revision) => {
    if (!validBranch(branchId)) return Promise.resolve({ ok: false, reason: 'invalid' })
    return transact(set, revision, (current) => {
    const next = { ...current, items: [], selectedBranchId: branchId, revision: newRevision() }
    return { next, result: { ok: true, revision: next.revision } }
    })
  },
  switchBranchWithItem: (branchId, product, revision) => {
    if (!validBranch(branchId) || !validProduct(product) || (product.price !== null && dollarsToMinor(product.price) === null)) {
      return Promise.resolve({ ok: false, reason: 'invalid' })
    }
    return transact(set, revision, (current) => {
      const next = { ...current, items: [{ productId: product.id, quantity: 1, product }], selectedBranchId: branchId, revision: newRevision() }
      return { next, result: { ok: true, revision: next.revision } }
    })
  },
  placeOrder: (revision, totalCents) => transact(set, undefined, (current) => {
    if (current.latestOrder?.reviewedRevision === revision) {
      return { result: { ok: true, order: current.latestOrder, revision: current.revision } }
    }
    if (current.revision !== revision) return { result: { ok: false, reason: 'stale', revision: current.revision } }
    if (!current.items.length || !validBranch(current.selectedBranchId)) return { result: { ok: false, reason: 'branch-required' } }
    let order: StoredOrder
    try { order = buildStoredOrder(current.items, totalCents, current.selectedBranchId, current.revision) }
    catch { return { result: { ok: false, reason: 'invalid' } } }
    const next = { ...current, items: [], revision: newRevision(), latestOrder: order }
    return { next, result: { ok: true, order, revision: next.revision } }
  }),
}))

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key !== CART_STORAGE_KEY && event.key !== null) return
    try {
      useCartStore.setState(readDurable())
    } catch { /* The next user action reports storage failure. */ }
  })
}
