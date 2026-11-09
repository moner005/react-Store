
import { create } from 'zustand'
import {
  persist,
  createJSONStorage,
} from 'zustand/middleware'

import type {
  CartItem,
  CartProduct,
  CartState,
} from '@/types/cart'

interface CartStore extends CartState {
  addItem: (product: CartProduct) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clear: () => void
}

// Validate saved cart data before restoring it
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isValidCartItem(value: unknown): value is CartItem {
  if (!isRecord(value) || !isRecord(value.product)) {
    return false
  }

  const product = value.product

  return (
    typeof value.productId === 'string' &&
    typeof value.quantity === 'number' &&
    Number.isInteger(value.quantity) &&
    value.quantity > 0 &&
    typeof product.id === 'string' &&
    typeof product.name === 'string' &&
    (
      product.price === null ||
      (
        typeof product.price === 'number' &&
        Number.isFinite(product.price) &&
        product.price >= 0
      )
    ) &&
    (
      product.image === undefined ||
      typeof product.image === 'string'
    ) &&
    (
      product.referenceNumber === undefined ||
      typeof product.referenceNumber === 'string'
    )
  )
}

export const useCartStore = create<CartStore>()(
  persist(
    (set) => ({
      items: [],
      selectedBranchId: null,

      // Add a product or increase its quantity
      addItem: (product) => {
        if (
          !product.id ||
          !product.name.trim() ||
          (
            product.price !== null &&
            (
              !Number.isFinite(product.price) ||
              product.price < 0
            )
          )
        ) {
          return
        }

        set((state) => {
          const existingItem = state.items.find(
            (item) => item.productId === product.id
          )

          if (existingItem) {
            return {
              items: state.items.map((item) =>
                item.productId === product.id
                  ? {
                      ...item,
                      quantity: item.quantity + 1,
                      product,
                    }
                  : item
              ),
            }
          }

          const newItem: CartItem = {
            productId: product.id,
            quantity: 1,
            product,
          }

          return {
            items: [...state.items, newItem],
          }
        })
      },

      // Remove a product completely
      removeItem: (productId) =>
        set((state) => ({
          items: state.items.filter(
            (item) => item.productId !== productId
          ),
        })),

      // Update quantity and remove the product at zero
      updateQuantity: (productId, quantity) => {
        const newQuantity = Number.isFinite(quantity)
          ? Math.floor(quantity)
          : 0

        set((state) => ({
          items:
            newQuantity <= 0
              ? state.items.filter(
                  (item) => item.productId !== productId
                )
              : state.items.map((item) =>
                  item.productId === productId
                    ? {
                        ...item,
                        quantity: newQuantity,
                      }
                    : item
                ),
        }))
      },

      // Empty the entire cart
      clear: () => set({ items: [] }),
    }),

    {
      name: 'rolex-store-cart',

      storage: createJSONStorage(() => localStorage),

      partialize: (state) => ({
        items: state.items,
        selectedBranchId: state.selectedBranchId,
      }),

      // Restore only valid cart items
      merge: (persistedState, currentState) => {
        const saved = (persistedState ?? {}) as Partial<CartState>

        return {
          ...currentState,

          items: Array.isArray(saved.items)
            ? saved.items.filter(isValidCartItem)
            : [],

          selectedBranchId:
            typeof saved.selectedBranchId === 'string'
              ? saved.selectedBranchId
              : null,
        }
      },
    }
  )
)
