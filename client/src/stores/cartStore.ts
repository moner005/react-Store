import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { CartItem, CartProduct, CartState } from '@/types/cart'
import { dollarsToMinor } from '../utils/money.ts'

interface CartStore extends CartState {
  addItem: (product: CartProduct) => boolean
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clear: () => void
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isValidProduct(value: unknown): value is CartProduct {
  if (!isRecord(value)) return false
  return typeof value.id === 'string'
    && value.id.length > 0
    && typeof value.name === 'string'
    && (value.price === null || (typeof value.price === 'number' && Number.isFinite(value.price)))
    && (value.image === undefined || typeof value.image === 'string')
    && (value.referenceNumber === undefined || typeof value.referenceNumber === 'string')
}

function isSupportedProduct(product: CartProduct): boolean {
  return product.price === null || dollarsToMinor(product.price) !== null
}

function isValidCartItem(value: unknown): value is CartItem {
  if (!isRecord(value) || !isValidProduct(value.product)) return false
  return typeof value.productId === 'string'
    && value.productId === value.product.id
    && Number.isSafeInteger(value.quantity)
    && (value.quantity as number) > 0
}

function removeItems(items: CartItem[], productId: string): CartItem[] {
  return items.filter((item) => item.productId !== productId)
}

export const useCartStore = create<CartStore>()(
  persist(
    (set) => ({
      items: [],
      selectedBranchId: null,
      addItem: (product) => {
        if (!isValidProduct(product) || !isSupportedProduct(product)) return false
        let accepted = false
        set((state) => {
          const existing = state.items.find((item) => item.productId === product.id)
          if (!existing) {
            accepted = true
            return { items: [...state.items, { productId: product.id, quantity: 1, product }] }
          }
          if (!Number.isSafeInteger(existing.quantity + 1)) return state
          accepted = true
          return {
            items: state.items.map((item) => item.productId === product.id
              ? { ...item, quantity: item.quantity + 1, product }
              : item),
          }
        })
        return accepted
      },
      removeItem: (productId) => set((state) => ({ items: removeItems(state.items, productId) })),
      updateQuantity: (productId, quantity) => {
        if (!Number.isSafeInteger(quantity) || quantity < 1) return
        set((state) => ({
          items: state.items.map((item) => item.productId === productId ? { ...item, quantity } : item),
        }))
      },
      clear: () => set({ items: [] }),
    }),
    {
      name: 'rolex-store-cart',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ items: state.items, selectedBranchId: state.selectedBranchId }),
      merge: (persistedState, currentState) => {
        const saved = isRecord(persistedState) ? persistedState : {}
        return {
          ...currentState,
          items: Array.isArray(saved.items)
            ? saved.items.filter(isValidCartItem).map((item) => ({
              ...item,
              product: {
                ...item.product,
                price: item.product.price !== null && dollarsToMinor(item.product.price) === null
                  ? null
                  : item.product.price,
              },
            }))
            : [],
          selectedBranchId: typeof saved.selectedBranchId === 'string' ? saved.selectedBranchId : null,
        }
      },
    },
  ),
)
